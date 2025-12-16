import { useDataset } from '../context/DatasetContext';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export function DatasetStatus() {
  const { file } = useDataset();

  return (
    <Badge variant="outline" className="flex items-center gap-2" title={file ? file.name : 'No dataset selected'}>
      <Database className="h-3 w-3" />
      <span className="text-muted-foreground">Dataset:</span>
      <span className="font-medium text-foreground max-w-[150px] truncate">{file ? file.name : '—'}</span>
    </Badge>
  );
}
