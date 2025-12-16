import { FilePicker } from '../components/FilePicker';
import { ChartCard } from '../components/ChartCard';
import { useDataset } from '../context/DatasetContext';
import { topActionPriorities } from '../lib/specUtils';
import { useCharts, useSupportedKeys } from '../lib/useCharts';
import type { ChartJob } from '../lib/types';

export function EmployeePage() {
  const { file } = useDataset();
  const { keys, loading: keysLoading, error: keysError } = useSupportedKeys();

  const recommended: ChartJob[] = [
    {
      key: 'dimension_summary',
      title: 'Synthèse par dimension',
      description: "Vue d'ensemble simple des scores par grande dimension.",
    },
    {
      key: 'action_priority_index',
      title: "Priorités d'action",
      description: 'Les leviers les plus actionnables (heuristique: score bas + lien avec EPUI/ENG).',
      config: { top_n: 8, outcome: 'EPUI', method: 'spearman', min_n: 5 },
    },
    {
      key: 'likert_distribution',
      title: 'Questions les plus problématiques',
      description: 'Distribution des réponses Likert (centrée sur neutre).',
      config: { top_n: 12, focus: 'lowest', sort: 'net_agreement', interactive_dimension: true },
    },
  ];

  const jobs = (keys ? recommended.filter((j) => keys.includes(j.key)) : []).slice();
  const state = useCharts(file, jobs);

  const actionSpec = state['action_priority_index']?.spec ?? null;
  const actions = actionSpec ? topActionPriorities(actionSpec, 5) : [];

  return (
    <div className="vstack">
      <div className="card vstack">
        <strong>Employé</strong>
        <span className="small">
          Cette page montre un état global et les actions prioritaires, sans jargon statistique.
        </span>
      </div>

      <FilePicker />

      {keysLoading ? <div className="card">Chargement des visualisations disponibles…</div> : null}
      {keysError ? <div className="error">{keysError}</div> : null}

      {file && actions.length ? (
        <div className="card vstack">
          <strong>Top 5 des actions prioritaires</strong>
          <span className="small">
            Basé sur le graphique "Priorités d'action" (heuristique). À lire comme un point de départ.
          </span>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {actions.map((a) => (
              <li key={a.label}>
                <span>{a.label}</span> <span className="small">(score: {a.score.toFixed(3)})</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="grid cols-2">
        {jobs.map((job) => (
          <ChartCard
            key={job.key}
            title={job.title}
            subtitle={job.description}
            status={state[job.key]?.status ?? (file ? 'loading' : 'idle')}
            error={state[job.key]?.error}
            spec={state[job.key]?.spec}
            footer={<span className="badge">{job.key}</span>}
          />
        ))}

        {!file ? (
          <div className="card">
            <strong>Choisissez un dataset</strong>
            <div className="small">
              Cliquez sur "Utiliser l'exemple (PROJET_POV)" pour charger le CSV fourni et générer les graphiques via l'API.
            </div>
          </div>
        ) : null}

        {file && keys && jobs.length === 0 ? (
          <div className="card">
            <strong>Aucune visualisation recommandée disponible</strong>
            <div className="small">
              Les clés supportées par le backend ne correspondent pas aux recommandations pour cette page.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
