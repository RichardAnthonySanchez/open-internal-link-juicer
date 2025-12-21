import { Tag } from 'lucide-react';

interface KeywordCloudProps {
  keywords: string[];
}

export function KeywordCloud({ keywords }: KeywordCloudProps) {
  if (keywords.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Detected Keywords
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 12).map((keyword, index) => (
          <span
            key={keyword}
            className="px-2.5 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
