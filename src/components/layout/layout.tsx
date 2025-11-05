'use client';
import { ReactNode } from 'react';
import { StarField } from '@/features/galaxy/components/StarField';
import { GalaxySidebar } from '@/features/galaxy/components/GalaxySidebar';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showStarField?: boolean;
}

export const Layout = ({ children, showSidebar = true, showStarField = true }: LayoutProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-nebula-dark via-nebula-mid to-nebula-light">
      {showStarField && <StarField />}
      {showSidebar && <GalaxySidebar />}

      <div className="relative z-10">{children}</div>
    </div>
  );
};
