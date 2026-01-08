import { useDataset } from '../context/DatasetContext';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DatasetStatus() {
  const { file } = useDataset();

  return (
    <Badge 
      variant={file ? "secondary" : "outline"} 
      className={cn(
        "flex items-center gap-2 px-3 py-1 transition-all",
        file ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-dashed"
      )} 
      title={file ? `Fichier: ${file.name}` : 'Aucun dataset sélectionné'}
    >
      <Database className={cn("h-3.5 w-3.5", file ? "text-primary" : "text-muted-foreground")} />
      <span className="hidden sm:inline opacity-70">Dataset:</span>
      <span className="font-semibold truncate max-w-[100px] md:max-w-[200px]">
        {file ? file.name : '—'}
      </span>
    </Badge>
  );
}
