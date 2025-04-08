import React from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
      {!isAuthPage && <Navigation />}
    </div>
  );
};