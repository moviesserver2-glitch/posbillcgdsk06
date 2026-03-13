import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export function MainLayout({ children, noPadding = false }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block fixed h-full">
        <Sidebar />
      </div>

      <div className="md:hidden sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">CGDSK</span>
        </div>
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      <main className="md:pl-64 flex-1">
        <div className={cn(!noPadding && "p-4 sm:p-6 md:p-8")}>{children}</div>
      </main>
    </div>
  );
}
