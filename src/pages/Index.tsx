import { useState, useRef } from 'react';
import { Search, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { ArticleInput } from '@/components/ArticleInput';
import { SitemapInput } from '@/components/SitemapInput';
import { ResultsList } from '@/components/ResultsList';
import { KeywordCloud } from '@/components/KeywordCloud';
import { useLinkAnalysis } from '@/hooks/useLinkAnalysis';
import { LinkOpportunity } from '@/lib/linkAnalyzer';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [articleContent, setArticleContent] = useState('');
  const [sitemapUrls, setSitemapUrls] = useState('');
  const [mode] = useState<'individual' | 'batch'>('batch');
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<LinkOpportunity | null>(null);
  const [showHighlights, setShowHighlights] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { analyze, isAnalyzing, results, reset } = useLinkAnalysis();
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

    await analyze(articleContent, sitemapUrls, mode, currentExcluded);
    setShowHighlights(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv') && !file.name.endsWith('.xml')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .csv, or .xml file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target?.result as string;

      if (file.name.endsWith('.xml')) {
        const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g);
        if (urlMatches) {
          content = urlMatches
            .map(match => match.replace(/<\/?loc>/g, ''))
            .join('\n');
        }
      }

      setSitemapUrls(content);
      toast({
        title: "File uploaded",
        description: `Loaded ${content.split('\n').filter(l => l.trim()).length} URLs`
      });
    };
    reader.readAsText(file);
  };

  const handleToggleKeyword = (keyword: string) => {
    const newExcluded = excludedKeywords.includes(keyword)
      ? excludedKeywords.filter(k => k !== keyword)
      : [...excludedKeywords, keyword];

    setExcludedKeywords(newExcluded);
    handleAnalyze(newExcluded);
  };

  const handleReset = () => {
    setArticleContent('');
    setSitemapUrls('');
    setExcludedKeywords([]);
    setSelectedOpportunity(null);
    setShowHighlights(false);
    reset();
  };

  const handleSelectOpportunity = (opportunity: LinkOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowHighlights(true);
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
              showHighlights={showHighlights}
              onShowHighlightsChange={setShowHighlights}
              opportunities={results?.opportunities || []}
              excludedKeywords={excludedKeywords}
              selectedOpportunity={selectedOpportunity}
            />
          </div>

          {/* Right Column - Controls & Results */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              <div className="mt-2">
                <SitemapInput
                  value={sitemapUrls}
                  onChange={setSitemapUrls}
                  onReset={handleReset}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.csv,.xml"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>

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
              </div>
            </div>

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
                onSelectOpportunity={handleSelectOpportunity}
                selectedUrl={selectedOpportunity?.url}
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

