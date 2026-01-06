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
      actions: {
        export: true,
        source: true,
        compiled: false,
        editor: true,
      },
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
      containerRef.current.innerHTML = '';

      try {
        result = await embed(containerRef.current, resolvedSpec, options);
      } catch (e) {
        if (!containerRef.current || canceled) return;
        containerRef.current.innerHTML = '';
        const msg = e instanceof Error ? e.message : String(e);
        const hint =
          msg.includes('Make sure the specification includes')
            ? '<div class="text-xs text-muted-foreground mt-2">Astuce: vérifiez que vous passez bien un spec Vega-Lite (avec <code>$schema</code> et <code>mark</code>), pas le wrapper <code>{chart_key, generated_at, spec}</code>.</div>'
            : '';
        containerRef.current.innerHTML = `<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">Render error: ${escapeHtml(msg)}${hint}</div>`;
      }
    }

    void run();

    return () => {
      canceled = true;
      try {
        // vega-embed result often exposes either finalize() or view.finalize()
        // depending on version/build.
        (result as any)?.finalize?.();
        (result as any)?.view?.finalize?.();
      } catch {
        // ignore cleanup issues
      }
    };
  }, [resolvedSpec, options]);

  return <div className="w-full overflow-x-auto min-h-[260px] bg-background" ref={containerRef} />;
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
