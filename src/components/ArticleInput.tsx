import { useState, useMemo } from 'react';
import { CheckCircle, FileText, X, Sparkles, Pencil, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LinkOpportunity } from '@/lib/linkAnalyzer';

interface ArticleInputProps {
  value: string;
  onChange: (value: string) => void;
  showHighlights: boolean;
  onShowHighlightsChange: (show: boolean) => void;
  opportunities?: LinkOpportunity[];
  excludedKeywords?: string[];
  selectedOpportunity?: LinkOpportunity | null;
}

export function ArticleInput({
  value,
  onChange,
  showHighlights,
  onShowHighlightsChange,
  opportunities = [],
  excludedKeywords = [],
  selectedOpportunity = null
}: ArticleInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { toast } = useToast();

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  const handleClear = () => {
    onChange('');
    onShowHighlightsChange(false);
  };

  // Map each keyword to its matching link opportunity
  const keywordMap = useMemo(() => {
    const map = new Map<string, LinkOpportunity>();
    const excludedSet = new Set(excludedKeywords.map(k => k.toLowerCase()));

    opportunities.forEach((opt) => {
      opt.matchedKeywords.forEach(kw => {
        const lowerKw = kw.toLowerCase();
        if (!map.has(lowerKw) && !excludedSet.has(lowerKw)) {
          map.set(lowerKw, opt);
        }
      });
    });
    return map;
  }, [opportunities, excludedKeywords]);

  const getHighlightStyle = (score: number) => {
    const hue = Math.round((score / 100) * 120);
    return {
      backgroundColor: `hsla(${hue}, 85%, 50%, 0.3)`,
      borderColor: `hsla(${hue}, 85%, 50%, 0.4)`,
      color: `hsl(${hue}, 90%, 20%)`
    };
  };

  const getBadgeStyle = (score: number) => {
    const hue = Math.round((score / 100) * 120);
    return {
      backgroundColor: `hsl(${hue}, 70%, 45%)`
    };
  };

  // Sorted keywords by length descending to catch longer phrases first
  const sortedKeywords = useMemo(() =>
    Array.from(keywordMap.keys()).sort((a, b) => b.length - a.length),
    [keywordMap]);

  const renderHighlights = () => {
    if (!value) return null;

    // Split text into paragraphs for semantic highlighting
    // This should match the chunking logic in the hook
    const paragraphs = value.split(/(\n\n+)/);

    const semanticChunkText = selectedOpportunity?.semanticMatch?.chunkText;

    const elements: (string | JSX.Element)[] = [];

    paragraphs.forEach((paragraph, pIdx) => {
      const isSemanticMatch = semanticChunkText && paragraph.trim() === semanticChunkText.trim();

      if (paragraph.match(/\n\n+/)) {
        elements.push(paragraph);
        return;
      }

      // Split paragraph into sentences
      // Match a sentence-ending punctuation followed by whitespace or end of string
      const sentenceParts = paragraph.split(/([.!?]+\s+)/);
      const paragraphElements: (string | JSX.Element)[] = [];

      for (let i = 0; i < sentenceParts.length; i++) {
        const sentence = sentenceParts[i];
        if (!sentence) continue;

        // Skip the punctuation/whitespace parts from the split
        if (i % 2 !== 0) {
          paragraphElements.push(sentence);
          continue;
        }

        // Check if any keyword matches this sentence
        let matchedOpportunity: LinkOpportunity | null = null;
        let matchedKeyword: string | null = null;

        for (const kw of sortedKeywords) {
          const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          if (regex.test(sentence)) {
            matchedOpportunity = keywordMap.get(kw.toLowerCase()) || null;
            matchedKeyword = kw;
            break;
          }
        }

        if (matchedOpportunity) {
          const optIndex = opportunities.findIndex(o => o.url === matchedOpportunity?.url) + 1;
          const style = getHighlightStyle(matchedOpportunity.score);
          const badgeStyle = getBadgeStyle(matchedOpportunity.score);

          paragraphElements.push(
            <span
              key={`p${pIdx}-s${i}`}
              className="px-0.5 py-0.25 rounded border transition-colors inline"
              style={style}
            >
              {sentence}
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded-full text-white text-[9px] font-bold align-middle"
                style={badgeStyle}
              >
                {optIndex}
              </span>
            </span>
          );
        } else {
          paragraphElements.push(sentence);
        }
      }

      if (isSemanticMatch) {
        elements.push(
          <div
            key={`p${pIdx}`}
            className="p-3 my-2 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg shadow-sm animate-pulse-subtle ring-2 ring-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Semantic Target Area
            </div>
            {paragraphElements}
          </div>
        );
      } else {
        elements.push(<span key={`p${pIdx}`}>{paragraphElements}</span>);
      }
    });

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
              onClick={() => onShowHighlightsChange(!showHighlights)}
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
          <div
            className="w-full h-full min-h-[400px] p-4 text-sm leading-relaxed overflow-y-auto cursor-help"
            onClick={() => {
              toast({
                title: "Highlight Mode Active",
                description: "You're in highlight mode. Switch to Edit Mode to modify your text.",
                variant: "default",
              });
            }}
          >
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
