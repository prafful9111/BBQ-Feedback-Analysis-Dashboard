import { Skeleton } from '@/shared/components/ui/skeleton';

export const LoadingGrid = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-[124px]" />
      ))}
    </div>
  );
};
