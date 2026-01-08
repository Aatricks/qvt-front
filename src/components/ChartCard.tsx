import type { ReactNode } from 'react';
import { Loader2, AlertCircle, Maximize2 } from 'lucide-react';
import type { ChartSpec } from '../lib/types';
import { VegaViewer } from './VegaViewer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const content = (
    <>
      {status === 'error' && error && (
        <div className="flex flex-col items-center justify-center gap-3 text-center p-6 border rounded-lg bg-destructive/5 border-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Erreur de visualisation</p>
              <p className="text-xs text-muted-foreground max-w-[280px] break-words">{error}</p>
          </div>
        </div>
      )}
      
      {status === 'success' && spec && (
          <div className="w-full flex justify-center overflow-hidden py-2">
              <VegaViewer spec={spec} />
          </div>
      )}
      
      {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
              <div className="h-8 w-8 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Traitement en cours</p>
          </div>
      )}

      {status === 'idle' && (
         <div className="flex flex-col items-center gap-2 opacity-40">
              <p className="text-sm font-medium text-muted-foreground">Aucune donnée à afficher</p>
         </div>
      )}
    </>
  );

  return (
    <Card className="flex flex-col h-full border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden">
      <CardHeader className="pb-3 space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </CardTitle>
            {subtitle && (
              <CardDescription className="text-xs text-muted-foreground leading-normal line-clamp-2">
                {subtitle}
              </CardDescription>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {status === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : status === 'success' ? (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground/40 hover:text-primary transition-all active:scale-95 group">
                    <Maximize2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl w-auto min-w-[50vw] h-auto max-h-[94vh] border-none bg-background/40 backdrop-blur-3xl shadow-2xl rounded-[2rem] p-0 overflow-hidden ring-1 ring-white/10 flex flex-col">
                  <div className="flex flex-col h-full overflow-hidden">
                    <DialogHeader className="p-8 pb-4 space-y-2 border-b border-white/5 bg-white/5 shrink-0">
                      <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
                      {subtitle && <DialogDescription className="text-sm text-muted-foreground/80 leading-relaxed max-w-3xl">{subtitle}</DialogDescription>}
                    </DialogHeader>
                    <div className="flex-grow p-6 md:p-10 flex items-center justify-center overflow-auto min-h-[350px]">
                      <div className="w-full flex justify-center">
                        <VegaViewer spec={spec!} />
                      </div>
                    </div>
                    {footer && (
                        <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold flex items-center justify-between shrink-0">
                            {footer}
                        </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow pt-4 px-6 min-h-[350px] flex flex-col items-center justify-center bg-muted/5">
        {content}
      </CardContent>

      {footer && (
        <CardFooter className="py-3 px-6 text-[10px] text-muted-foreground border-t bg-muted/20">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}