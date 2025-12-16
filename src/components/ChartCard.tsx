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
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-grow">
        {status === 'error' && error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {status === 'success' && spec && (
            <div className="w-full overflow-hidden">
                <VegaViewer spec={spec} />
            </div>
        )}
      </CardContent>

      {footer && (
        <CardFooter className="text-xs text-muted-foreground">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
