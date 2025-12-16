import type { ReactNode } from 'react';

import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="vstack" style={{ gap: 16 }}>{children}</div>
      </div>
    </div>
  );
}
