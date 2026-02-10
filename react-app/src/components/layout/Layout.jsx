/**
 * @fileoverview Main Layout Component
 * Provides the application shell with sidebar, header, and main content area.
 *
 * @module components/layout/Layout
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import KeyboardShortcutsHelp, { ShortcutsBadge } from '../common/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

/**
 * Layout Component
 * Main application layout with responsive sidebar
 */
export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Initialize keyboard shortcuts (Alt+1-8 for navigation)
  useKeyboardShortcuts();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp />

      {/* First-time hint badge */}
      <ShortcutsBadge />

      {/* Sidebar - Desktop */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex"
      />

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex flex-col min-h-screen transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
        `}
      >
        {/* Header */}
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-4 py-3 border-t border-theme text-center text-xs text-secondary">
          <span>© 2024-2025 Rachgia Factory Dashboard</span>
          <span className="mx-2">|</span>
          <span>v19.0.0</span>
        </footer>
      </div>
    </div>
  );
}
