import { useEffect, useMemo, useState } from 'react';

import { ChartCard } from '../components/ChartCard';
import { FilePicker } from '../components/FilePicker';
import { useDataset } from '../context/DatasetContext';
import { getSupportedKeys, visualize } from '../lib/api';
import type { ChartSpec } from '../lib/types';
import { VisualizeError } from '../lib/types';

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

  const [filtersText, setFiltersText] = useState<string>('{}');
  const [configText, setConfigText] = useState<string>(
    JSON.stringify(
      {
        min_n: 5,
        outcome: 'EPUI',
        method: 'spearman',
        top_n: 12,
        focus: 'lowest',
        sort: 'net_agreement',
      },
      null,
      2,
    ),
  );

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

    let filters: Record<string, unknown> | null = null;
    let config: Record<string, unknown> | null = null;

    try {
      filters = parseJsonObject(filtersText);
    } catch (e) {
      setKeysError(`Filters JSON invalid: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }

    try {
      config = parseJsonObject(configText);
    } catch (e) {
      setKeysError(`Config JSON invalid: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }

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
        const spec = await visualize(k, { hrFile: file, config, filters });
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
    <div className="vstack">
      <div className="card vstack">
        <strong>RH (exploration complète)</strong>
        <span className="small">
          Ici vous pouvez choisir quelles visualisations lancer, et passer des <code>filters</code>/<code>config</code> JSON à l’API.
        </span>
      </div>

      <FilePicker />

      {keysLoading ? <div className="card">Chargement des clés…</div> : null}
      {keysError ? <div className="error">{keysError}</div> : null}

      <div className="grid cols-2">
        <div className="card vstack">
          <strong>Sélection des graphiques</strong>
          <span className="small">Basé sur <code>/api/visualize/supported-keys</code>.</span>

          {!supportedKeys ? null : (
            <div className="vstack" style={{ gap: 10 }}>
              {CATEGORY_ORDER.filter((c) => keysByCategory[c]?.length).map((cat) => (
                <div key={cat} className="vstack" style={{ gap: 6 }}>
                  <div className="hstack" style={{ justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 13 }}>{cat}</strong>
                    <span className="small">{keysByCategory[cat].length} clés</span>
                  </div>
                  <div className="vstack" style={{ gap: 6 }}>
                    {keysByCategory[cat].map((k) => {
                      const checked = selectedKeys.includes(k);
                      return (
                        <label key={k} className="hstack" style={{ gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedKeys((prev) =>
                                checked ? prev.filter((x) => x !== k) : [...prev, k],
                              )
                            }
                          />
                          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace' }}>
                            {k}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="hstack" style={{ justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap' }}>
            <span className="small">Sélection: {selectedKeys.length} graphique(s)</span>
            <button className="btn primary" type="button" disabled={!canRender} onClick={() => void runRender()}>
              Générer
            </button>
          </div>
          {!file ? <div className="small">Chargez un CSV pour activer la génération.</div> : null}
        </div>

        <div className="card vstack">
          <strong>Paramètres API</strong>
          <span className="small">
            Les champs sont envoyés comme <code>filters</code> et <code>config</code> (JSON) dans le multipart <code>FormData</code>.
          </span>

          <div className="vstack" style={{ gap: 8 }}>
            <label className="vstack" style={{ gap: 6 }}>
              <span className="small">filters (ex: {`{"Sexe":"F"}`})</span>
              <textarea className="input" value={filtersText} onChange={(e) => setFiltersText(e.target.value)} />
            </label>

            <label className="vstack" style={{ gap: 6 }}>
              <span className="small">config (dépend du graphique)</span>
              <textarea className="input" value={configText} onChange={(e) => setConfigText(e.target.value)} />
            </label>

            <div className="small">
              Conseils:
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Pour segmentation, utilisez <code>segment_field</code> (si le graphique le supporte).</li>
                <li>Pour les graphes "leviers", baissez/montez <code>min_n</code> selon votre niveau de rigueur.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
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

        {file && supportedKeys && Object.keys(renderByKey).length === 0 ? (
          <div className="card">
            <strong>Prêt</strong>
            <div className="small">Sélectionnez des graphiques puis cliquez sur “Générer”.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = JSON.parse(trimmed) as unknown;
  if (value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a JSON object');
  }
  return value as Record<string, unknown>;
}

function formatVisualizeError(e: unknown): string {
  if (e instanceof VisualizeError) {
    const details = e.payload?.details?.length ? `\n• ${e.payload.details.join('\n• ')}` : '';
    return `${e.message}${details}`;
  }
  return e instanceof Error ? e.message : String(e);
}
