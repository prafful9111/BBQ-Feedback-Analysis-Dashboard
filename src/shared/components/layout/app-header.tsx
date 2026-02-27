import { CalendarDays } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  description: string;
}

export const AppHeader = ({ title, description }: AppHeaderProps) => {
  const now = new Date();

  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        {now.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
      </div>
    </div>
  );
};
