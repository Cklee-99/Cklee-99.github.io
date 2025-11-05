'use client';

import categories from '@/data/categories.json';
import { StarField } from '@/features/galaxy';
import { BackButton } from './BackButton';

interface CategoryPageClientProps {
  categorySlug: string;
}

export function CategoryPageClient({ categorySlug }: CategoryPageClientProps) {
  const currentPath = `/${categorySlug}`;
  const category = categories.find((c) => c.route === currentPath);

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-nebula-dark via-nebula-mid to-nebula-light text-foreground">
      {/* Background */}
      <StarField />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-border/30 backdrop-blur-md bg-card/20" style={{ boxShadow: '0 0 10px rgba(180, 130, 255, 0.5)' }}>
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <BackButton />

            <div className="flex items-center gap-3">
              <span className="text-4xl animate-float planet-emoji">{category.emoji}</span>
              <h1 className="text-3xl font-poppins font-semibold">{category.label}</h1>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 md:p-12">
          <div className="max-w-7xl mx-auto rounded-2xl" style={{ boxShadow: '0 0 10px rgba(180, 130, 255, 0.5)' }}>
            <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-8 md:p-12 shadow-2xl">
              <h2 className="text-2xl font-poppins font-semibold mb-4">Welcome to {category.label}</h2>
              <p className="text-muted-foreground font-inter text-lg mb-8">
                This is your {category.label.toLowerCase()} tracking space. Start logging and tracking your progress in this life category.
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    <div className="text-5xl mb-3 planet-emoji">{category.emoji}</div>
                    <h3 className="font-poppins font-medium mb-2">Feature {i}</h3>
                    <p className="text-sm text-muted-foreground font-inter">Track and manage your {category.label.toLowerCase()} activities here.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

