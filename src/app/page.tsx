'use client';
import { Galaxy, GalaxySidebar, StarField } from '@/features/galaxy';

export default function Page() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0F0B1E 0%, #140C2A 25%, #1A103D 50%, #2B1A4F 75%, #0F0B1E 100%)',
      }}
    >
      <StarField />
      <GalaxySidebar />
      <div className="relative z-1">
        <Galaxy />
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 text-center select-none">
        <p className="text-sm font-inter text-muted-foreground bg-card/60 backdrop-blur-md px-6 py-3 rounded-full border border-border select-none">
          Click planets to explore • Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
}
