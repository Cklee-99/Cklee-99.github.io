'use client';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import categories from '@/data/categories.json';

export const GalaxySidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button - only visible on mobile */}
      <button onClick={() => setIsOpen(true)} className="sidebar-hamburger" aria-label="Open menu">
        <Menu className="sidebar-hamburger-icon" />
      </button>

      {/* Overlay - only on mobile when menu is open */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-inner">
          {/* Header */}
          <div className="sidebar-header">
            {/* Left: Logo + Subtext */}
            <div className="sidebar-header-content">
              <div className="sidebar-header-title-row">
                <h2 className="sidebar-header-title">Logverse</h2>
              </div>
              <span className="sidebar-header-subtitle">Your Universe of Daily Logs</span>
            </div>

            {/* Right: Close button (absolute positioned) */}
            <button onClick={() => setIsOpen(false)} className="sidebar-close-btn" aria-label="Close menu">
              <X className="sidebar-close-icon" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {categories.map((category) => (
              <Link key={category.route} href={category.route} onClick={() => setIsOpen(false)} className="sidebar-nav-link group">
                <span className="sidebar-nav-emoji planet-emoji">{category.emoji}</span>
                <span className="sidebar-nav-label">{category.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">© 2025 Logverse</div>
        </div>
      </div>
    </>
  );
};
