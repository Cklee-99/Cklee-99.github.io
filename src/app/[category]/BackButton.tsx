'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/')}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary transition-all duration-200 hover:scale-110"
      aria-label="Back to galaxy"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
}
