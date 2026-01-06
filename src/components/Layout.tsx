import type { ReactNode } from 'react';

import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="container mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
