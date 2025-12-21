import { ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import { LinkOpportunity, getScoreCategory } from '@/lib/linkAnalyzer';

interface ResultsListProps {
  opportunities: LinkOpportunity[];
  totalUrls: number;
  isLoading?: boolean;
  excludedKeywords?: string[];
  onToggleKeyword?: (keyword: string) => void;
}

function ScoreBadge({ score }: { score: number }) {
  const category = getScoreCategory(score);

  // Calculate color from Red (0) to Green (120) based on score (0-100)
  // Low score = warm/red, high score = green
  const hue = Math.round((score / 100) * 120);
  const backgroundColor = `hsl(${hue}, 70%, 45%)`;

  return (
    <div
      className={`score-badge score-badge-${category}`}
      style={{ backgroundColor }}
    >
      {score}
    </div>
  );
}

export function ResultsList({
  opportunities,
  totalUrls,
  isLoading,
  excludedKeywords = [],
  onToggleKeyword
}: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Analyzing links...</p>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="w-10 h-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">
          Enter your article content and sitemap URLs, then click "Analyze" to find internal linking opportunities.
        </p>
      </div>
    );
  }

  const excludedSet = new Set(excludedKeywords);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          Top Internal Linking Opportunities
        </h3>
        <span className="text-xs text-muted-foreground">
          {opportunities.length} of {totalUrls}
          <ChevronRight className="w-3 h-3 inline ml-1" />
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">
        {opportunities.map((opportunity, index) => (
          <div
            key={opportunity.url}
            className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <a
                href={opportunity.url.startsWith('http') ? opportunity.url : `https://example.com${opportunity.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium text-sm hover:underline flex items-center gap-1 truncate"
              >
                {opportunity.url}
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
              </a>

              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {opportunity.explanation}
                {opportunity.matchedKeywords.length > 0 && (
                  <span className="inline-flex flex-wrap gap-1 mt-1.5">
                    {opportunity.matchedKeywords
                      .filter(keyword => !excludedSet.has(keyword))
                      .slice(0, 5)
                      .map(keyword => (
                        <button
                          key={keyword}
                          onClick={() => onToggleKeyword?.(keyword)}
                          className="highlight-keyword text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Click to omit this keyword"
                        >
                          {keyword}
                        </button>
                      ))}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <ScoreBadge score={opportunity.score} />
              {opportunity.semanticScore !== undefined && opportunity.semanticScore > 50 && (
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Semantic
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
