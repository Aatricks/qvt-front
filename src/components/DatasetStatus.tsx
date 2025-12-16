import { useDataset } from '../context/DatasetContext';

export function DatasetStatus() {
  const { file } = useDataset();

  return (
    <div className="badge" title={file ? file.name : 'No dataset selected'}>
      <span>Dataset:</span>
      <strong style={{ color: 'var(--text)' }}>{file ? file.name : '—'}</strong>
    </div>
  );
}
