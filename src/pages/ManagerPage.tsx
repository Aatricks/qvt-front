import { FilePicker } from '../components/FilePicker';
import { ChartCard } from '../components/ChartCard';
import { useDataset } from '../context/DatasetContext';
import { topActionPriorities } from '../lib/specUtils';
import { useCharts, useSupportedKeys } from '../lib/useCharts';
import type { ChartJob } from '../lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Info, Lightbulb } from 'lucide-react';

export function ManagerPage() {
  const { file } = useDataset();
  const { keys, loading: keysLoading, error: keysError } = useSupportedKeys();

  const curated: ChartJob[] = [
    {
      key: 'importance_performance_matrix',
      title: 'Matrice importance–performance',
      description: 'Pour identifier les sujets à prioriser (importance élevée, performance faible).',
      config: { outcome: 'EPUI', method: 'spearman', min_n: 5 },
    },
    {
      key: 'leverage_scatter',
      title: 'Carte des leviers',
      description: "Visualise performance vs levier (association) sur l'issue (EPUI/ENG).",
      config: { outcome: 'EPUI', method: 'spearman', min_n: 5 },
    },
    {
      key: 'action_priority_index',
      title: "Priorités d'action (classement)",
      description: 'Une shortlist prête à l’emploi, lisible en réunion.',
      config: { top_n: 10, outcome: 'EPUI', method: 'spearman', min_n: 5 },
    },
    {
      key: 'dimension_ci_bars',
      title: 'Scores + incertitude (95% CI)',
      description: 'Quand les écarts sont petits, les intervalles aident à éviter les fausses certitudes.',
    },
  ];

  const jobs = (keys ? curated.filter((j) => keys.includes(j.key)) : []).slice();
  const state = useCharts(file, jobs);

  const actionSpec = state['action_priority_index']?.spec ?? null;
  const actions = actionSpec ? topActionPriorities(actionSpec, 6) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manager</h1>
        <p className="text-muted-foreground">
          Cette page met en avant des graphiques compréhensibles et des recommandations automatiques pour guider les actions.
        </p>
      </div>

      <FilePicker />

      {keysLoading && (
        <Card className="flex items-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Chargement des visualisations disponibles…</span>
        </Card>
      )}
      
      {keysError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {keysError}
        </div>
      )}

      {file && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <CardTitle>À retenir / prochaines actions</CardTitle>
            </div>
            <CardDescription>
                Les indicateurs ci-dessous sont des heuristiques (corrélation ≠ causalité). Utilisez-les pour prioriser, puis confirmez par des échanges terrain.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {actions.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-muted-foreground">Top actions suggérées</div>
                  <ol className="list-decimal pl-5 space-y-1">
                    {actions.map((a) => (
                      <li key={a.label} className="text-sm">
                        <span className="font-medium">{a.label}</span> <span className="text-muted-foreground text-xs">(score: {a.score.toFixed(3)})</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Chargez un dataset pour calculer une shortlist d’actions.</div>
              )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <ChartCard
            key={job.key}
            title={job.title}
            subtitle={job.description}
            status={state[job.key]?.status ?? (file ? 'loading' : 'idle')}
            error={state[job.key]?.error}
            spec={state[job.key]?.spec}
            footer={<Badge variant="secondary" className="font-mono text-xs">{job.key}</Badge>}
          />
        ))}

        {!file && (
           <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Choisissez un dataset</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Cliquez sur "Utiliser l'exemple (PROJET_POV)" pour générer les visuels à partir du CSV.
            </p>
          </Card>
        )}

        {file && keys && jobs.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucune visualisation manager disponible</h3>
             <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Essayez la page RH pour explorer toutes les clés supportées.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
