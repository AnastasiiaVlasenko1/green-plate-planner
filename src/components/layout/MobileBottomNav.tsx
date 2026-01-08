import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, BookOpen, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/meal-planner', icon: CalendarDays, label: 'Planner' },
  { path: '/recipes', icon: BookOpen, label: 'Recipes' },
  { path: '/grocery-list', icon: ShoppingCart, label: 'Grocery' },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 transition-transform active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {/* Notification dot - can be conditionally shown */}
                {/* <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" /> */}
              </div>
              <span className={cn(
                'text-[10px] mt-1 font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
