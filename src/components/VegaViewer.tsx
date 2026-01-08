import { useEffect, useMemo, useRef, useState } from 'react';
import embed, { type Result as VegaEmbedResult } from 'vega-embed';

import type { ChartSpec } from '../lib/types';

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function VegaViewer({ spec }: { spec: ChartSpec }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDarkMode = useIsDarkMode();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const resolvedSpec = useMemo(() => {
    const s = spec as unknown as Record<string, unknown>;
    const inner = s && typeof s === 'object' ? (s as any).spec : null;
    return inner && typeof inner === 'object' ? (inner as any) : (spec as any);
  }, [spec]);

  const options = useMemo(
    () => ({
      actions: {
        export: { svg: true, png: true },
        source: false,
        compiled: false,
        editor: false,
      },
      renderer: 'canvas' as const,
      theme: (isDarkMode ? 'dark' : 'default') as any,
      config: {
        background: 'transparent',
        view: { fill: 'transparent', stroke: 'transparent' },
        axis: {
            labelFontSize: 10,
            titleFontSize: 11,
        },
        legend: {
            labelFontSize: 10,
            titleFontSize: 11,
        }
      },
    }),
    [isDarkMode],
  );

  useEffect(() => {
    let result: VegaEmbedResult | null = null;
    let canceled = false;

    async function run() {
      if (!containerRef.current || dimensions.width === 0) return;
      
      try {
        if (!resolvedSpec || Object.keys(resolvedSpec).length === 0) {
            throw new Error('Spécification invalide');
        }

        const specToRender = { ...resolvedSpec };
        
        // Dynamic sizing logic
        const isConcat = !!(specToRender.vconcat || specToRender.hconcat || specToRender.facet);
        
        if (!isConcat) {
            specToRender.width = dimensions.width - 80; // Account for axis/padding
            specToRender.autosize = { type: 'fit', contains: 'padding' };
        } else {
            // For concatenated charts, we can't easily force total width
            // but we can try to make sub-charts fill
            specToRender.width = 'container';
        }

        result = await embed(containerRef.current, specToRender, options);
      } catch (e) {
        if (!containerRef.current || canceled) return;
        console.error('Vega Error:', e);
        containerRef.current.innerHTML = `<div class="p-4 text-center opacity-50"><p class="text-[10px] font-medium uppercase tracking-tighter">Erreur de rendu</p></div>`;
      }
    }

    void run();

    return () => {
      canceled = true;
      if (result) {
        try {
          (result as any)?.finalize?.();
          (result as any)?.view?.finalize?.();
        } catch {}
      }
    };
  }, [resolvedSpec, options, dimensions.width]);

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden min-h-[300px]" 
      ref={containerRef} 
    >
        {dimensions.width === 0 && (
            <div className="flex flex-col items-center gap-4 opacity-20">
                <div className="h-24 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
        )}
    </div>
  );
}
