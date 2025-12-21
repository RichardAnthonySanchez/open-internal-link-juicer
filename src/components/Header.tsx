import { Link2, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="text-center mb-10">
      <div className="inline-flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
          <Link2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
        Internal Link Opportunity Finder
      </h1>
      
      <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
        Paste your sitemap and an article, get top internal link suggestions with clear relevance scores.
      </p>
    </header>
  );
}
