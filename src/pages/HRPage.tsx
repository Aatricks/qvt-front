import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { ChartCard } from '../components/ChartCard';
import { FilterBuilder } from '../components/FilterBuilder';
import { useDataset } from '../context/DatasetContext';
import { getSupportedKeys, visualize } from '../lib/api';
import type { ChartSpec } from '../lib/types';
import { VisualizeError } from '../lib/types';
import { getChartMetadata } from '../lib/chartConfigs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Play, BarChart2, Info, LayoutPanelTop } from 'lucide-react';
import { cn } from '@/lib/utils';

type RenderState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  spec: ChartSpec | null;
  error: string | null;
};

const CATEGORY_ORDER = ['Décision / actions', 'Synthèse', 'Analyses', 'Temps', 'Autres'] as const;

export function HRPage() {
  const { file } = useDataset();

  const [supportedKeys, setSupportedKeys] = useState<string[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    'dimension_ci_bars',
    'likert_distribution',
    'anova_significance',
    'correlation_matrix',
    'action_priority_index',
  ]);

  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});

  // Default config hidden from user
  const defaultConfig = {
    min_n: 5,
    outcome: 'EPUI',
    method: 'spearman',
    top_n: 10,
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
      const meta = getChartMetadata(k);
      const cat = meta.category;
      (out[cat] ??= []).push(k);
    }
    for (const cat of Object.keys(out)) {
       out[cat].sort((a, b) => getChartMetadata(a).title.localeCompare(getChartMetadata(b).title));
    }
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
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Espace Pilote</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Exploration granulaire des données QVCT. Croisez les indicateurs avec les variables de segmentation et générez des rapports statistiques détaillés.
        </p>
      </div>

      {keysLoading && (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Synchronisation des capacités du moteur d'analyse...</span>
        </div>
      )}

      {keysError && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/5 border border-destructive/10 p-4 text-sm text-destructive font-medium">
            <AlertCircle className="h-4 w-4" />
            <span>Échec de connexion au service d'analyse : {keysError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8">
            <Card className="shadow-sm border-border overflow-hidden bg-card">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-2">
                    <LayoutPanelTop className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Répertoire des Indicateurs</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="py-6">
                {!supportedKeys ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p className="text-xs font-medium uppercase tracking-widest">Initialisation</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                    {CATEGORY_ORDER.filter((c) => keysByCategory[c]?.length).map((cat) => (
                        <div key={cat} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{cat}</h4>
                                <div className="h-px flex-grow bg-border" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {keysByCategory[cat].map((k) => {
                                const meta = getChartMetadata(k);
                                const checked = selectedKeys.includes(k);
                                return (
                                    <div 
                                        key={k} 
                                        onClick={() => setSelectedKeys(prev => checked ? prev.filter(x => x !== k) : [...prev, k])}
                                        className={cn(
                                            "flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer group relative overflow-hidden",
                                            checked 
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/10 shadow-sm" 
                                                : "border-border bg-background hover:border-primary/30 hover:bg-primary/[0.01] hover:shadow-md hover:-translate-y-0.5"
                                        )}
                                    >
                                        <Checkbox
                                            id={k}
                                            checked={checked}
                                            className={cn("mt-0.5 transition-all duration-300", checked ? "border-primary bg-primary scale-110" : "group-hover:border-primary/50")}
                                            onCheckedChange={(c) =>
                                                setSelectedKeys((prev) =>
                                                    c === true ? [...prev, k] : prev.filter((x) => x !== k)
                                                )
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <label 
                                                htmlFor={k} 
                                                className="text-xs font-semibold leading-tight cursor-pointer group-hover:text-primary transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {meta.title}
                                            </label>
                                            <p className="text-[10px] text-muted-foreground leading-normal line-clamp-1 group-hover:text-muted-foreground/80 transition-colors">
                                                {meta.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                                })}
                            </div>
                        </div>
                    ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/10 p-4">
                <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{selectedKeys.length}</span> indicateurs sélectionnés
                </div>
                <Button 
                    onClick={() => void runRender()} 
                    disabled={!canRender} 
                    className="h-9 px-6 font-semibold shadow-sm"
                >
                    <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                    Lancer l'Analyse
                </Button>
            </CardFooter>
            </Card>
            {!file && (
                <div className="mt-4 p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/30 flex items-center gap-3">
                    <Info className="h-4 w-4 text-orange-600 shrink-0" />
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-400">
                        Données absentes. Veuillez charger un <Link to="/settings" className="underline font-bold">fichier source</Link> pour activer la génération.
                    </p>
                </div>
            )}
        </div>

        <div className="xl:col-span-4 sticky top-20">
           <FilterBuilder file={file} onFiltersChange={setDynamicFilters} />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {Object.entries(renderByKey).length > 0 && (
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold">Sorties d'Analyse</h2>
                <div className="h-px flex-grow bg-border" />
                <Badge variant="outline" className="font-mono text-[10px]">{Object.keys(renderByKey).length} Modules</Badge>
            </div>
        )}

        <div className="grid grid-cols-1 gap-8">
            {Object.entries(renderByKey)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, st]) => {
                const meta = getChartMetadata(k);
                return (
                <ChartCard
                    key={k}
                    title={meta.title}
                    subtitle={meta.description}
                    status={st.status}
                    error={st.error}
                    spec={st.spec}
                    footer={
                        <div className="flex items-center justify-between w-full uppercase tracking-wider font-bold">
                            <span className="text-primary/70">{meta.category}</span>
                            <span className="opacity-40">{k}</span>
                        </div>
                    }
                />
                );
            })}
        </div>
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