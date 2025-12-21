import { useState, useRef } from 'react';
import { Link2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SitemapInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SitemapInput({ value, onChange }: SitemapInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const urlCount = value.trim() 
    ? value.trim().split('\n').filter(line => line.trim()).length 
    : 0;

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
      
      // Basic XML sitemap parsing
      if (file.name.endsWith('.xml')) {
        const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g);
        if (urlMatches) {
          content = urlMatches
            .map(match => match.replace(/<\/?loc>/g, ''))
            .join('\n');
        }
      }
      
      onChange(content);
      toast({
        title: "File uploaded",
        description: `Loaded ${content.split('\n').filter(l => l.trim()).length} URLs`
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Link2 className="w-4 h-4 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Paste Sitemap</h3>
      </div>

      <div className={`relative rounded-lg border transition-all ${
        isFocused 
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
        
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.csv,.xml"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>
    </div>
  );
}
