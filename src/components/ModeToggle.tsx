import { Switch } from '@/components/ui/switch';

interface ModeToggleProps {
  mode: 'individual' | 'batch';
  onChange: (mode: 'individual' | 'batch') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <span className={`text-sm font-medium transition-colors ${
        mode === 'individual' ? 'text-foreground' : 'text-muted-foreground'
      }`}>
        Evaluate Individually
      </span>
      
      <Switch
        checked={mode === 'batch'}
        onCheckedChange={(checked) => onChange(checked ? 'batch' : 'individual')}
        className="data-[state=checked]:bg-primary"
      />
      
      <span className={`text-sm font-medium transition-colors ${
        mode === 'batch' ? 'text-foreground' : 'text-muted-foreground'
      }`}>
        Batch-Rank Strongest
      </span>
    </div>
  );
}
