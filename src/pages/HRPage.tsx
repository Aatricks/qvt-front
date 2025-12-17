import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { ChartCard } from '../components/ChartCard';
import { FilterBuilder } from '../components/FilterBuilder';
import { useDataset } from '../context/DatasetContext';
import { getSupportedKeys, visualize } from '../lib/api';
import type { ChartSpec } from '../lib/types';
import { VisualizeError } from '../lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Info, Play } from 'lucide-react';

// Add Label component locally if not present or just use simple label
const SimpleLabel = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
        {children}
    </label>
);


type RenderState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  spec: ChartSpec | null;
  error: string | null;
};

const CATEGORY_ORDER = ['Décision / actions', 'Synthèse', 'Analyses', 'Temps', 'Autres'] as const;

const KEY_CATEGORY: Record<string, (typeof CATEGORY_ORDER)[number]> = {
  action_priority_index: 'Décision / actions',
  leverage_scatter: 'Décision / actions',
  importance_performance_matrix: 'Décision / actions',

  dimension_summary: 'Synthèse',
  dimension_heatmap: 'Synthèse',
  dimension_boxplot: 'Synthèse',
  dimension_ci_bars: 'Synthèse',
  likert_distribution: 'Synthèse',
  likert_item_heatmap: 'Synthèse',
  demographic_distribution: 'Synthèse',

  anova_significance: 'Analyses',
  correlation_matrix: 'Analyses',
  scatter_regression: 'Analyses',

  time_series: 'Temps',
  time_series_ci: 'Temps',
};

export function HRPage() {
  const { file } = useDataset();

  const [supportedKeys, setSupportedKeys] = useState<string[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    'dimension_summary',
    'dimension_ci_bars',
    'likert_distribution',
    'action_priority_index',
    'importance_performance_matrix',
  ]);

  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});

  // Default config hidden from user
  const defaultConfig = {
    min_n: 5,
    outcome: 'EPUI',
    method: 'spearman',
    top_n: 12,
    focus: 'lowest',
    sort: 'net_agreement',
  };

  const [renderByKey, setRenderByKey] = useState<Record<string, RenderState>>({});

  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;
    setKeysLoading(true);
    setKeysError(null);
    getSupportedKeys(ctrl.signal)
      .then((k) => {
        if (!active) return;
        setSupportedKeys(k);
      })
      .catch((e) => {
        if (!active) return;
        if (ctrl.signal.aborted) return;
        if (e && typeof e === 'object' && 'name' in e && (e as any).name === 'AbortError') return;
        setKeysError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!active) return;
        setKeysLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, []);

  const keysByCategory = useMemo(() => {
    const keys = supportedKeys ?? [];
    const out: Record<string, string[]> = {};
    for (const k of keys) {
      const cat = KEY_CATEGORY[k] ?? 'Autres';
      (out[cat] ??= []).push(k);
    }
    for (const cat of Object.keys(out)) out[cat].sort();
    return out;
  }, [supportedKeys]);

  const canRender = !!file && !!supportedKeys && selectedKeys.length > 0;

  async function runRender() {
    if (!file) return;

    const keys = selectedKeys.filter((k) => supportedKeys?.includes(k));

    // init render states
    setRenderByKey(() => {
      const init: Record<string, RenderState> = {};
      for (const k of keys) init[k] = { status: 'loading', spec: null, error: null };
      return init;
    });

    const concurrency = 3;
    let idx = 0;

    const worker = async () => {
      const k = keys[idx++];
      if (!k) return;
      try {
        const spec = await visualize(k, { hrFile: file, config: defaultConfig, filters: dynamicFilters });
        setRenderByKey((prev) => ({ ...prev, [k]: { status: 'success', spec, error: null } }));
      } catch (e) {
        setRenderByKey((prev) => ({
          ...prev,
          [k]: { status: 'error', spec: null, error: formatVisualizeError(e) },
        }));
      }
      await worker();
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, keys.length) }, () => worker()));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pilote (exploration complète)</h1>
      </div>

      {keysLoading && (
        <Card className="flex items-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Chargement des clés disponibles…</span>
        </Card>
      )}
      
      {keysError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {keysError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
            <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Sélection des graphiques</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                {!supportedKeys ? null : (
                    <div className="space-y-6">
                    {CATEGORY_ORDER.filter((c) => keysByCategory[c]?.length).map((cat) => (
                        <div key={cat} className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="text-sm font-semibold">{cat}</h4>
                            <Badge variant="secondary" className="text-xs">{keysByCategory[cat].length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {keysByCategory[cat].map((k) => {
                            const checked = selectedKeys.includes(k);
                            return (
                                <div key={k} className="flex items-center space-x-2">
                                <Checkbox
                                    id={k}
                                    checked={checked}
                                    onCheckedChange={(c) =>
                                    setSelectedKeys((prev) =>
                                        c === true ? [...prev, k] : prev.filter((x) => x !== k)
                                    )
                                    }
                                />
                                <SimpleLabel htmlFor={k} className="font-mono text-xs cursor-pointer">
                                    {k}
                                </SimpleLabel>
                                </div>
                            );
                            })}
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                <span className="text-sm text-muted-foreground">Sélection: {selectedKeys.length} graphique(s)</span>
                <Button onClick={() => void runRender()} disabled={!canRender}>
                    <Play className="mr-2 h-4 w-4" />
                    Générer
                </Button>
            </CardFooter>
             {!file && (
                <div className="px-6 pb-4 text-xs text-muted-foreground text-center">
                    <Link to="/settings" className="underline font-medium text-primary">Chargez un CSV</Link> pour activer la génération.
                </div>
             )}
            </Card>
        </div>

        <div className="lg:col-span-5">
           <FilterBuilder file={file} onFiltersChange={setDynamicFilters} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(renderByKey)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, st]) => (
            <ChartCard
              key={k}
              title={k}
              status={st.status}
              error={st.error}
              spec={st.spec}
            />
          ))}

        {file && supportedKeys && Object.keys(renderByKey).length === 0 && (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed col-span-full">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Prêt à générer</h3>
             <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Sélectionnez des graphiques et des filtres puis cliquez sur “Générer”.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatVisualizeError(e: unknown): string {
  if (e instanceof VisualizeError) {
    const details = e.payload?.details?.length ? `\n• ${e.payload.details.join('\n• ')}` : '';
    return `${e.message}${details}`;
  }
  return e instanceof Error ? e.message : String(e);
}
