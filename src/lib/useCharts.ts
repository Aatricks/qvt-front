import { useEffect, useMemo, useState } from 'react';

import { getSupportedKeys, visualize } from './api';
import type { ChartJob, ChartSpec } from './types';
import { VisualizeError } from './types';

type ChartState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  spec: ChartSpec | null;
  error: string | null;
};

export function useSupportedKeys() {
  const [keys, setKeys] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    getSupportedKeys(ctrl.signal)
      .then((k) => {
        if (!active) return;
        setKeys(k);
      })
      .catch((e) => {
        if (!active) return;
        if (isAbortError(e, ctrl.signal)) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, []);

  return { keys, loading, error };
}

export function useCharts(file: File | null, jobs: ChartJob[]) {
  const [stateByKey, setStateByKey] = useState<Record<string, ChartState>>({});

  const stableJobs = useMemo(() => jobs, [JSON.stringify(jobs)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;

    // Initialize states
    setStateByKey((prev) => {
      const next: Record<string, ChartState> = { ...prev };
      for (const job of stableJobs) {
        next[job.key] = file
          ? { status: 'loading', spec: null, error: null }
          : { status: 'idle', spec: null, error: null };
      }
      return next;
    });

    if (!file)
      return () => {
        active = false;
        ctrl.abort();
      };

    // Run in small parallel batches to avoid hammering the backend.
    const concurrency = 3;
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (!active || ctrl.signal.aborted) return;
      const job = stableJobs[index++];
      if (!job) return;

      try {
        const spec = await visualize(job.key, {
          hrFile: file,
          config: job.config ?? null,
          filters: job.filters ?? null,
          signal: ctrl.signal,
        });
        if (active && !ctrl.signal.aborted) {
          setStateByKey((prev) => ({
            ...prev,
            [job.key]: { status: 'success', spec, error: null },
          }));
        }
      } catch (e) {
        if (!active || ctrl.signal.aborted || isAbortError(e, ctrl.signal)) return;
        const message = formatVisualizeError(e);
        setStateByKey((prev) => ({
          ...prev,
          [job.key]: { status: 'error', spec: null, error: message },
        }));
      }

      await runNext();
    };

    const runners = Array.from({ length: Math.min(concurrency, stableJobs.length) }, () => runNext());
    void Promise.all(runners);

    return () => {
      active = false;
      ctrl.abort();
    };
  }, [file, stableJobs]);

  return stateByKey;
}

function formatVisualizeError(e: unknown): string {
  if (e instanceof VisualizeError) {
    const details = e.payload?.details?.length ? `\n• ${e.payload.details.join('\n• ')}` : '';
    return `${e.message}${details}`;
  }
  if (e instanceof Error) {
    const msg = e.message || String(e);
    if (/failed to fetch/i.test(msg) || /networkerror/i.test(msg) || /load failed/i.test(msg)) {
      return "Impossible de contacter l'API. Vérifiez que FastAPI tourne (port 8000) et que le proxy Vite / CORS est correctement configuré.";
    }
    return msg;
  }
  return String(e);
}

function isAbortError(e: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  if (e && typeof e === 'object' && 'name' in e && (e as any).name === 'AbortError') return true;
  // Browser-dependent message (e.g. Chromium: "signal is aborted without reason")
  const msg = e instanceof Error ? e.message : String(e);
  return /aborted/i.test(msg);
}
