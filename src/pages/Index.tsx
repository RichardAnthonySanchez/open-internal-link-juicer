import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { ArticleInput } from '@/components/ArticleInput';
import { SitemapInput } from '@/components/SitemapInput';
import { ModeToggle } from '@/components/ModeToggle';
import { ResultsList } from '@/components/ResultsList';
import { KeywordCloud } from '@/components/KeywordCloud';
import { analyzeInternalLinks, AnalysisResult } from '@/lib/linkAnalyzer';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [articleContent, setArticleContent] = useState('');
  const [sitemapUrls, setSitemapUrls] = useState('');
  const [mode, setMode] = useState<'individual' | 'batch'>('batch');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAnalyze = async (currentExcluded: string[] = excludedKeywords) => {
    if (!articleContent.trim()) {
      toast({
        title: "Missing content",
        description: "Please paste your article content first",
        variant: "destructive"
      });
      return;
    }

    if (!sitemapUrls.trim()) {
      toast({
        title: "Missing URLs",
        description: "Please add sitemap URLs to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. Initial Keyword-based analysis (Fast baseline)
      const urls = sitemapUrls.split('\n').filter(url => url.trim());
      const analysisResults = analyzeInternalLinks(articleContent, urls, mode, 20, currentExcluded);

      // 2. Semantic Analysis (Inspired by SemanticFinder)
      const { semanticAnalyzer } = await import('@/lib/semanticAnalyzer');

      // Initialize model (this may take time on first run)
      await semanticAnalyzer.init();

      // Chunk article into paragraphs/sentences for semantic matching
      const articleChunks = articleContent
        .split(/\n\n+/)
        .map(c => c.trim())
        .filter(c => c.length > 20);

      // Generate embeddings for chunks
      const chunkEmbeddings = await Promise.all(
        articleChunks.map(chunk => semanticAnalyzer.generateEmbedding(chunk))
      );

      // Enhance opportunities with semantic scores
      const enhancedOpportunities = await Promise.all(
        analysisResults.opportunities.map(async (opportunity) => {
          // Join slug keywords into a semantic query
          const query = opportunity.slugKeywords.join(' ');
          if (!query) return opportunity;

          const queryEmbedding = await semanticAnalyzer.generateEmbedding(query);

          // Find max similarity between query and any article chunk
          let maxSim = 0;
          for (const chunkEmb of chunkEmbeddings) {
            const sim = semanticAnalyzer.cosineSimilarity(queryEmbedding, chunkEmb);
            if (sim > maxSim) maxSim = sim;
          }

          return {
            ...opportunity,
            semanticScore: Math.round(maxSim * 100),
            // Boost overall score if semantic match is high
            score: Math.min(Math.max(opportunity.score, Math.round(maxSim * 100)), 100),
            explanation: maxSim > 0.6
              ? `Strong semantic match (${Math.round(maxSim * 100)}%) found in content.`
              : opportunity.explanation
          };
        })
      );

      // Sort by best score (keyword or semantic)
      enhancedOpportunities.sort((a, b) => b.score - a.score);
      analysisResults.opportunities = enhancedOpportunities;

      setResults(analysisResults);
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      // Fallback to basic analysis if semantic fails
      const urls = sitemapUrls.split('\n').filter(url => url.trim());
      const basicResults = analyzeInternalLinks(articleContent, urls, mode, 20, currentExcluded);
      setResults(basicResults);

      toast({
        title: "Semantic analysis error",
        description: "Falling back to keyword-based matching.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }

    if (currentExcluded.length === excludedKeywords.length) {
      toast({
        title: "Analysis complete",
        description: "Semantic & keyword analysis finished."
      });
    }
  };

  const handleToggleKeyword = (keyword: string) => {
    const newExcluded = excludedKeywords.includes(keyword)
      ? excludedKeywords.filter(k => k !== keyword)
      : [...excludedKeywords, keyword];

    setExcludedKeywords(newExcluded);
    // Re-analyze immediately with the new exclusion list
    handleAnalyze(newExcluded);
  };

  const handleReset = () => {
    setArticleContent('');
    setSitemapUrls('');
    setResults(null);
    setExcludedKeywords([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Header />

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - Article Input */}
          <div className="lg:row-span-3">
            <ArticleInput
              value={articleContent}
              onChange={setArticleContent}
              opportunities={results?.opportunities || []}
              excludedKeywords={excludedKeywords}
            />
          </div>

          {/* Right Column - Controls & Results */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              {/* <ModeToggle mode={mode} onChange={setMode} /> */}

              <div className="mt-6">
                <SitemapInput
                  value={sitemapUrls}
                  onChange={setSitemapUrls}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Links
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="px-4"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Keyword Cloud - NEW LOCATION */}
            {results && results.articleKeywords.length > 0 && (
              <KeywordCloud
                keywords={[...results.articleKeywords, ...excludedKeywords].sort()}
                excludedKeywords={excludedKeywords}
                onToggleKeyword={handleToggleKeyword}
              />
            )}

            {/* Results */}
            <div className="card-elevated p-6">
              <ResultsList
                opportunities={results?.opportunities || []}
                totalUrls={results?.totalUrls || 0}
                isLoading={isAnalyzing}
                excludedKeywords={excludedKeywords}
                onToggleKeyword={handleToggleKeyword}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-muted-foreground">
          <p>Built for SEO teams • No crawling required • Client-side analysis</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
