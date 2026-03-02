'use client';

import { Navbar } from './navbar';

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
