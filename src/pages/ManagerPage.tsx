import { FilePicker } from '../components/FilePicker';
import { ChartCard } from '../components/ChartCard';
import { useDataset } from '../context/DatasetContext';
import { topActionPriorities } from '../lib/specUtils';
import { useCharts, useSupportedKeys } from '../lib/useCharts';
import type { ChartJob } from '../lib/types';

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
    <div className="vstack">
      <div className="card vstack">
        <strong>Manager</strong>
        <span className="small">
          Cette page met en avant des graphiques compréhensibles et des recommandations automatiques pour guider les actions.
        </span>
      </div>

      <FilePicker />

      {keysLoading ? <div className="card">Chargement des visualisations disponibles…</div> : null}
      {keysError ? <div className="error">{keysError}</div> : null}

      {file ? (
        <div className="card vstack">
          <strong>À retenir / prochaines actions</strong>
          <span className="small">
            Les indicateurs ci-dessous sont des heuristiques (corrélation ≠ causalité). Utilisez-les pour prioriser, puis confirmez par des échanges terrain.
          </span>
          {actions.length ? (
            <>
              <div className="small">Top actions suggérées</div>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {actions.map((a) => (
                  <li key={a.label}>
                    <span>{a.label}</span> <span className="small">(score: {a.score.toFixed(3)})</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="small">Chargez un dataset pour calculer une shortlist d’actions.</div>
          )}
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
              Cliquez sur "Utiliser l'exemple (PROJET_POV)" pour générer les visuels à partir du CSV.
            </div>
          </div>
        ) : null}

        {file && keys && jobs.length === 0 ? (
          <div className="card">
            <strong>Aucune visualisation manager disponible</strong>
            <div className="small">Essayez la page RH pour explorer toutes les clés supportées.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
