import { CategoryAnalysisPage } from '@/features/category-analysis';

interface CategoryRoutePageProps {
  params: {
    category: string;
  };
}

export default function CategoryRoutePage({ params }: CategoryRoutePageProps) {
  return <CategoryAnalysisPage categorySlug={params.category} />;
}
