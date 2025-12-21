import { useState } from 'react';
import { CheckCircle, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArticleInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ArticleInput({ value, onChange }: ArticleInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="card-elevated p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            value.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {value.trim() ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <h2 className="text-lg font-semibold text-foreground">Paste article content below</h2>
        </div>
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

      <div className={`flex-1 relative rounded-lg border transition-all ${
        isFocused 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50'
      }`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste your article content here. The tool will analyze the text to identify keyword themes and match them against your sitemap URLs..."
          className="w-full h-full min-h-[400px] p-4 bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground text-sm leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>{wordCount.toLocaleString()} words</span>
        <span>{charCount.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
