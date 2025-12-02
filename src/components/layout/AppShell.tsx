'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={cn(
          'min-h-screen transition-all duration-200',
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        )}
      >
        <main className="p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
