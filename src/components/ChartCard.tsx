import type { ReactNode } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { ChartSpec } from '../lib/types';
import { VegaViewer } from './VegaViewer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';

export function ChartCard({
  title,
  subtitle,
  status,
  error,
  spec,
  footer,
}: {
  title: string;
  subtitle?: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string | null;
  spec?: ChartSpec | null;
  footer?: ReactNode;
}) {
  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold leading-tight">{title}</CardTitle>
          {status === 'loading' && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
        {subtitle && <CardDescription className="text-sm line-clamp-2">{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-grow pt-4">
        {status === 'error' && error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}
        {status === 'success' && spec && (
            <VegaViewer spec={spec} />
        )}
        {status === 'idle' && (
           <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="text-sm">En attente de données...</p>
           </div>
        )}
      </CardContent>

      {footer && (
        <CardFooter className="pt-2 text-xs text-muted-foreground border-t bg-muted/30">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
