import { ChartSpec, VisualizeError, type VisualizeErrorPayload } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function getSupportedKeys(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/visualize/supported-keys`, { signal });
  if (!res.ok) {
    throw new VisualizeError(`Failed to load supported keys (${res.status})`, { status: res.status });
  }
  return (await res.json()) as string[];
}

export async function visualize(
  key: string,
  opts: {
    hrFile: File;
    surveyFile?: File | null;
    config?: Record<string, unknown> | null;
    filters?: Record<string, unknown> | null;
    signal?: AbortSignal;
  },
): Promise<ChartSpec> {
  const form = new FormData();
  form.append('hr_file', opts.hrFile);
  if (opts.surveyFile) form.append('survey_file', opts.surveyFile);
  if (opts.filters) form.append('filters', JSON.stringify(opts.filters));
  if (opts.config) form.append('config', JSON.stringify(opts.config));

  const res = await fetch(`${API_BASE}/api/visualize/${encodeURIComponent(key)}`, {
    method: 'POST',
    body: form,
    signal: opts.signal,
  });

  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok) {
    const payload = (json && typeof json === 'object' ? (json as VisualizeErrorPayload) : undefined) as
      | VisualizeErrorPayload
      | undefined;
    const message = payload?.message || `Visualization request failed (${res.status})`;
    throw new VisualizeError(message, { payload, status: res.status });
  }

  if (!json || typeof json !== 'object') {
    throw new VisualizeError('Visualization API returned a non-JSON response');
  }

  // Backend returns a wrapper payload:
  //   { chart_key, generated_at, spec: <vega-lite spec> }
  // Vega/Vega-Lite tools (and vega-embed) expect the raw spec object.
  return unwrapSpec(json);
}

function unwrapSpec(json: unknown): ChartSpec {
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    const inner = obj.spec;
    if (inner && typeof inner === 'object') {
      return inner as ChartSpec;
    }
  }
  return json as ChartSpec;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
