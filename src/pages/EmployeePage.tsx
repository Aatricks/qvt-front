import { Link } from 'react-router-dom';
import { ChartCard } from '../components/ChartCard';
import { useDataset } from '../context/DatasetContext';
import { useCharts, useSupportedKeys } from '../lib/useCharts';
import type { ChartJob } from '../lib/types';
import { getChartMetadata } from '../lib/chartConfigs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Info, PieChart } from 'lucide-react';

export function EmployeePage() {
  const { file } = useDataset();
  const { keys, loading: keysLoading, error: keysError } = useSupportedKeys();

  const recommendedKeys = ['dimension_ci_bars', 'likert_distribution'];

  const jobs: ChartJob[] = (keys ? recommendedKeys.filter((k) => keys.includes(k)) : []).map(k => {
    const meta = getChartMetadata(k);
    return {
      key: k,
      title: meta.title,
      description: meta.description,
      config: k === 'likert_distribution' ? { top_n: 12, focus: 'lowest', sort: 'net_agreement', interactive_dimension: true } : undefined
    };
  });

  const state = useCharts(file, jobs);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Synthèse Collaborateur</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Indicateurs de Qualité de Vie et Conditions au Travail (QVCT). Ces visualisations reflètent la perception globale de l'organisation de manière anonymisée.
        </p>
      </div>

      {keysLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {[1, 2].map(i => (
              <Card key={i} className="h-[400px] flex items-center justify-center bg-muted/30 border-dashed border-2 animate-pulse">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
              </Card>
           ))}
        </div>
      )}

      {keysError && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/5 border border-destructive/10 p-4 text-destructive font-medium text-sm">
            <AlertCircle className="h-4 w-4" />
            <p>{keysError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {jobs.map((job) => (
          <ChartCard
              key={job.key}
              title={job.title}
              subtitle={job.description}
              status={state[job.key]?.status ?? (file ? 'loading' : 'idle')}
              error={state[job.key]?.error}
              spec={state[job.key]?.spec}
              footer={
                  <div className="flex items-center justify-between w-full opacity-70">
                       <span className="font-medium">Indicateur Organisationnel</span>
                       <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase">{job.key}</code>
                  </div>
              }
          />
        ))}

        {!file && (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-muted/10 min-h-[400px] col-span-full">
            <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center shadow-sm border mb-6">
                <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Données non chargées</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
              L'accès aux indicateurs nécessite l'importation préalable d'un jeu de données source.
            </p>
            <Link to="/settings">
                <Button className="px-6 font-semibold">
                    Importer un dataset
                </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
