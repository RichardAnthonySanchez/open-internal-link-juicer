import { useState } from 'react';
import { Link2, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SitemapInputProps {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
}

export function SitemapInput({ value, onChange, onReset }: SitemapInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasContent = value.trim().length > 0;
  const urlCount = value.trim()
    ? value.trim().split('\n').filter(line => line.trim()).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasContent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            {hasContent ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
          </div>
          <h3 className="font-semibold text-foreground">Paste Sitemap</h3>
        </div>

        {onReset && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Clear sitemap URLs"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className={`relative rounded-lg border transition-all ${isFocused
        ? 'border-primary ring-2 ring-primary/20'
        : 'border-border hover:border-primary/50'
        }`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="/blog/best-content-writing-tools
/seo/how-to-use-canonical-tags
/marketing/content-strategy-guide"
          className="w-full h-32 p-3 bg-transparent resize-none focus:outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{urlCount} URLs</span>
      </div>
    </div>
  );
}

