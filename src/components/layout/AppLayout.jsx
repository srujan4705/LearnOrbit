import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless mobileOpen */}
      <div className={`md:block ${mobileOpen ? 'block' : 'hidden'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Desktop sidebar spacing */}
      <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : (collapsed ? 'md:ml-16' : 'md:ml-64')}`}>
        <TopBar onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}