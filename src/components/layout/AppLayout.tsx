import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-secondary">
      {/* Desktop Sidebar */}
      <AppSidebar />
      
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pt-14 pb-[60px] lg:pt-0 lg:pb-0">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
