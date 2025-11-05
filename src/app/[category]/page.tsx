import categories from '@/data/categories.json';
import { notFound } from 'next/navigation';
import { CategoryPageClient } from './CategoryPageClient';

// Generate static params for all categories during build time
export function generateStaticParams() {
  return categories.map((category) => ({
    category: category.route.replace('/', ''),
  }));
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const currentPath = `/${categorySlug}`;

  const category = categories.find((c) => c.route === currentPath);

  if (!category) {
    notFound();
  }

  return <CategoryPageClient categorySlug={categorySlug} />;
}
