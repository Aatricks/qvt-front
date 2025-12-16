import { useRef, useState } from 'react';

import { useDataset } from '../context/DatasetContext';

export function FilePicker() {
  const { file, setFile, loadSample, clear } = useDataset();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="card vstack">
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="vstack" style={{ gap: 4 }}>
          <strong>Fichier de données (CSV)</strong>
          <span className="small">
            Le backend attend un fichier dans <code>hr_file</code> (mode "single-file": le survey est détecté si des colonnes Likert sont présentes).
          </span>
        </div>

        <div className="hstack" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            className="btn"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            Choisir un fichier
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await loadSample();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            Utiliser l'exemple (PROJET_POV)
          </button>
          <button
            className="btn danger"
            type="button"
            onClick={() => {
              clear();
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={busy || !file}
          >
            Vider
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        style={{ display: 'none' }}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          setError(null);
          const next = e.target.files?.[0] || null;
          setFile(next);
        }}
      />

      <div className="hstack" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span className="small">
          Sélection: <strong>{file ? file.name : 'aucun fichier'}</strong>
        </span>
        {busy ? <span className="small">Chargement…</span> : null}
      </div>

      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
