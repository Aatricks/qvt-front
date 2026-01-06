import type { ChartSpec } from './types';

export function getDatasets(spec: ChartSpec): Record<string, unknown[]> {
  const anySpec = spec as any;
  const datasets = anySpec?.datasets;
  if (!datasets || typeof datasets !== 'object') return {};

  const out: Record<string, unknown[]> = {};
  for (const [k, v] of Object.entries(datasets as Record<string, unknown>)) {
    if (Array.isArray(v)) out[k] = v as unknown[];
  }
  return out;
}

export function getFirstDatasetValues(spec: ChartSpec): unknown[] {
  const datasets = getDatasets(spec);
  const firstKey = Object.keys(datasets)[0];
  return firstKey ? datasets[firstKey] : [];
}

export function topActionPriorities(spec: ChartSpec, limit = 5): Array<{ label: string; score: number }> {
  const rows = getFirstDatasetValues(spec) as Array<Record<string, unknown>>;
  const parsed = rows
    .map((r) => {
      const label = (r.dimension_label ?? r.dimension_prefix ?? r.dimension ?? r.label) as unknown;
      const score = (r.priority_index ?? r.priority ?? r.score) as unknown;
      return {
        label: typeof label === 'string' ? label : String(label ?? ''),
        score: typeof score === 'number' ? score : Number(score ?? NaN),
      };
    })
    .filter((r) => r.label && Number.isFinite(r.score));

  parsed.sort((a, b) => b.score - a.score);
  return parsed.slice(0, limit);
}
