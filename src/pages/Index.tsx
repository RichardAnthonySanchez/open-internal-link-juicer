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
  const { toast } = useToast();

  const handleAnalyze = async () => {
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
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const urls = sitemapUrls.split('\n').filter(url => url.trim());
    const analysisResults = analyzeInternalLinks(articleContent, urls, mode, 20);
    
    setResults(analysisResults);
    setIsAnalyzing(false);

    toast({
      title: "Analysis complete",
      description: `Found ${analysisResults.opportunities.filter(o => o.score > 0).length} relevant opportunities`
    });
  };

  const handleReset = () => {
    setArticleContent('');
    setSitemapUrls('');
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Header />

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - Article Input */}
          <div className="lg:row-span-2">
            <ArticleInput 
              value={articleContent} 
              onChange={setArticleContent} 
            />
            
            {results && results.articleKeywords.length > 0 && (
              <KeywordCloud keywords={results.articleKeywords} />
            )}
          </div>

          {/* Right Column - Controls & Results */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              <ModeToggle mode={mode} onChange={setMode} />
              
              <div className="mt-6">
                <SitemapInput 
                  value={sitemapUrls} 
                  onChange={setSitemapUrls} 
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAnalyze}
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

            {/* Results */}
            <div className="card-elevated p-6">
              <ResultsList
                opportunities={results?.opportunities || []}
                totalUrls={results?.totalUrls || 0}
                isLoading={isAnalyzing}
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
