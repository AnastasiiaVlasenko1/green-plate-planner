import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AppHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function AppHeader({ title, showSearch = true, onSearch }: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center gap-4 sticky top-0 z-10">
      {title && (
        <h1 className="text-xl font-semibold text-foreground">
          {title}
        </h1>
      )}

      {showSearch && (
        <div className="flex-1 max-w-md ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              className="pl-10 bg-secondary border-0"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
