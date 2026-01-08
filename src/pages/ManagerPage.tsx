import { Link } from 'react-router-dom';
import { ChartCard } from '../components/ChartCard';
import { useDataset } from '../context/DatasetContext';
import { useCharts, useSupportedKeys } from '../lib/useCharts';
import type { ChartJob } from '../lib/types';
import { getChartMetadata } from '../lib/chartConfigs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, TrendingUp, Compass, Target, Info } from 'lucide-react';

export function ManagerPage() {
  const { file } = useDataset();
  const { keys, loading: keysLoading, error: keysError } = useSupportedKeys();

  const curatedKeys = ['action_priority_index', 'dimension_ci_bars'];

  const jobs: ChartJob[] = (keys ? curatedKeys.filter((k) => keys.includes(k)) : []).map(k => {
    const meta = getChartMetadata(k);
    return {
      key: k,
      title: meta.title,
      description: meta.description,
      config: k === 'action_priority_index' ? { outcome: 'EPUI', top_n: 10 } : undefined
    };
  });

  const state = useCharts(file, jobs);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Pilotage Stratégique QVCT</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Outils d'aide à la décision pour identifier les leviers d'amélioration et prioriser les actions correctives basées sur les données d'enquête.
        </p>
      </div>

      {keysLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {[1, 2].map(i => (
              <Card key={i} className="h-[400px] flex items-center justify-center bg-muted/20 border-dashed border-2 animate-pulse">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
              </Card>
           ))}
        </div>
      )}

      {keysError && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/5 border border-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">{keysError}</p>
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
                     <span className="font-medium">Indicateur de Performance Sociale</span>
                     <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase">{job.key}</code>
                </div>
            }
          />
        ))}

        {!file && (
           <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-muted/10 min-h-[400px] col-span-full">
            <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center shadow-sm border mb-6">
                <Compass className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analyse non disponible</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
              Veuillez importer un jeu de données valide dans le module de configuration pour activer les outils de pilotage.
            </p>
            <Link to="/settings">
                <Button variant="outline" className="px-6">Configurer les données</Button>
            </Link>
          </Card>
        )}
      </div>

      <div className="bg-muted/30 border rounded-lg overflow-hidden">
         <div className="px-6 py-4 border-b bg-muted/50 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Guide d'Interprétation</h3>
         </div>
         <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-3">
                <div className="h-7 w-7 rounded border flex items-center justify-center bg-white text-xs font-bold shadow-sm">01</div>
                <h4 className="text-sm font-semibold">Matrices de Priorité</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Les dimensions situées dans le quadrant supérieur gauche combinent des scores de satisfaction faibles avec une forte corrélation à l'épuisement.</p>
            </div>
            <div className="space-y-3">
                <div className="h-7 w-7 rounded border flex items-center justify-center bg-white text-xs font-bold shadow-sm">02</div>
                <h4 className="text-sm font-semibold">Significativité</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">L'intervalle de confiance reflète la précision statistique. Des barres étroites indiquent une convergence des réponses des collaborateurs.</p>
            </div>
            <div className="space-y-3">
                <div className="h-7 w-7 rounded border flex items-center justify-center bg-white text-xs font-bold shadow-sm">03</div>
                <h4 className="text-sm font-semibold">Évolutions</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Croisez ces résultats avec les analyses de l'Espace Pilote pour identifier si ces tendances sont spécifiques à certaines directions.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

