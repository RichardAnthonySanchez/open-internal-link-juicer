import { Tag, XCircle, CheckCircle2 } from 'lucide-react';

interface KeywordCloudProps {
  keywords: string[];
  excludedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
}

export function KeywordCloud({ keywords, excludedKeywords, onToggleKeyword }: KeywordCloudProps) {
  if (keywords.length === 0) return null;

  const excludedSet = new Set(excludedKeywords);

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Sitemap Keywords</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => {
          const isExcluded = excludedSet.has(keyword);
          return (
            <button
              key={keyword}
              onClick={() => onToggleKeyword(keyword)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isExcluded
                ? 'bg-muted text-muted-foreground opacity-60 hover:opacity-100'
                : 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105'
                }`}
              style={{ animationDelay: `${index * 30}ms` }}
              title={isExcluded ? "Include keyword" : "Exclude keyword"}
            >
              {keyword}
              {isExcluded ? (
                <CheckCircle2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              ) : (
                <XCircle className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
