import { useEffect, useMemo, useRef, useState } from 'react';
import embed, { type Result as VegaEmbedResult } from 'vega-embed';

import type { ChartSpec } from '../lib/types';

/**
 * Hook to detect if dark mode is active on the <html> element
 */
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

  // Defensive: the backend historically returns { chart_key, generated_at, spec: <vega-lite> }.
  // Even though the API client unwraps it, keep this as a safety net.
  const resolvedSpec = useMemo(() => {
    const s = spec as unknown as Record<string, unknown>;
    const inner = s && typeof s === 'object' ? (s as any).spec : null;
    return inner && typeof inner === 'object' ? (inner as any) : (spec as any);
  }, [spec]);

  // Merge options with dynamic theme and background
  const options = useMemo(
    () => ({
      actions: true,
      renderer: 'canvas' as const,
      theme: (isDarkMode ? 'dark' : 'default') as any,
      config: {
        background: 'transparent',
        view: { fill: 'transparent', stroke: 'transparent' }
      },
    }),
    [isDarkMode],
  );

  useEffect(() => {
    let result: VegaEmbedResult | null = null;
    let canceled = false;

    async function run() {
      if (!containerRef.current) return;
      
      // Clean up previous
      containerRef.current.innerHTML = '<div class="flex flex-col items-center gap-2"><div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div><span class="text-[10px] text-muted-foreground uppercase tracking-widest">Génération...</span></div>';

      try {
        if (!resolvedSpec || Object.keys(resolvedSpec).length === 0) {
            throw new Error('Specification vide ou invalide');
        }

        // Try to embed with simple options. 
        const specToRender = { ...resolvedSpec };
        
        // Ensure some basic sizing if not present
        if (!specToRender.width && !specToRender.vconcat && !specToRender.hconcat) {
            specToRender.width = 'container';
        }
        if (!specToRender.height && !specToRender.vconcat && !specToRender.hconcat) {
            specToRender.height = 300;
        }

        result = await embed(containerRef.current, specToRender, options);
      } catch (e) {
        if (!containerRef.current || canceled) return;
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Vega Error:', e);
        containerRef.current.innerHTML = `<div class="p-6 text-center">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p class="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Erreur de rendu</p>
          <p class="text-[11px] text-muted-foreground max-w-[200px] mx-auto">${escapeHtml(msg)}</p>
        </div>`;
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
  }, [resolvedSpec, options]);

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-auto" 
      ref={containerRef} 
    />
  );
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
