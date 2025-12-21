import { useState, useMemo } from 'react';
import { CheckCircle, FileText, X, Sparkles, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LinkOpportunity } from '@/lib/linkAnalyzer';

interface ArticleInputProps {
  value: string;
  onChange: (value: string) => void;
  opportunities?: LinkOpportunity[];
  excludedKeywords?: string[];
}

export function ArticleInput({
  value,
  onChange,
  opportunities = [],
  excludedKeywords = []
}: ArticleInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  const handleClear = () => {
    onChange('');
    setShowHighlights(false);
  };

  // Map each keyword to its highest ranking opportunity index (1-based)
  const keywordMap = useMemo(() => {
    const map = new Map<string, number>();
    const excludedSet = new Set(excludedKeywords.map(k => k.toLowerCase()));

    opportunities.forEach((opt, index) => {
      opt.matchedKeywords.forEach(kw => {
        const lowerKw = kw.toLowerCase();
        if (!map.has(lowerKw) && !excludedSet.has(lowerKw)) {
          map.set(lowerKw, index + 1);
        }
      });
    });
    return map;
  }, [opportunities, excludedKeywords]);

  // Sorted keywords by length descending to catch longer phrases first
  const sortedKeywords = useMemo(() =>
    Array.from(keywordMap.keys()).sort((a, b) => b.length - a.length),
    [keywordMap]);

  const renderHighlights = () => {
    if (!value) return null;
    if (sortedKeywords.length === 0) return <div className="whitespace-pre-wrap">{value}</div>;

    // Build a regex for all keywords
    const pattern = sortedKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(\\b(${pattern})\\b)`, 'gi');

    const parts = value.split(regex);
    const elements: (string | JSX.Element)[] = [];

    // value.split with groups returns: [content, full_match_including_capture, actual_keyword_match, content, ...]
    // We iterate by 3s
    for (let i = 0; i < parts.length; i += 3) {
      elements.push(parts[i]); // Regular text

      if (i + 1 < parts.length) {
        const keyword = parts[i + 1];
        const index = keywordMap.get(keyword.toLowerCase());

        if (index) {
          elements.push(
            <span
              key={`${i}-${keyword}`}
              className="inline-flex items-center gap-1 px-1 bg-green-500/10 text-green-700 dark:text-green-400 font-semibold rounded border border-green-500/30 group relative transition-all hover:bg-green-500/20"
            >
              {keyword}
              <span className="w-4 h-4 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                {index}
              </span>
            </span>
          );
        } else {
          elements.push(keyword);
        }
      }
    }

    return <div className="whitespace-pre-wrap">{elements}</div>;
  };

  return (
    <div className="card-elevated p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${value.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            {value.trim() ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <h2 className="text-lg font-semibold text-foreground">Paste article content below</h2>
        </div>

        <div className="flex gap-2">
          {opportunities.length > 0 && (
            <Button
              variant={showHighlights ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHighlights(!showHighlights)}
              className={showHighlights ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {showHighlights ? (
                <><Pencil className="w-4 h-4 mr-1.5" /> Edit Mode</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-1.5" /> Highlight Links</>
              )}
            </Button>
          )}

          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className={`flex-1 relative rounded-lg border transition-all overflow-hidden ${isFocused
        ? 'border-primary ring-2 ring-primary/20'
        : showHighlights ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/50'
        }`}>
        {showHighlights ? (
          <div className="w-full h-full min-h-[400px] p-4 text-sm leading-relaxed overflow-y-auto">
            {renderHighlights()}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste your article content here..."
            className="w-full h-full min-h-[400px] p-4 bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground text-sm leading-relaxed"
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>{wordCount.toLocaleString()} words</span>
        <span>{charCount.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
