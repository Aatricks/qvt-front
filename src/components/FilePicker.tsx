import { useRef, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react';

export function FilePicker() {
  const { file, setFile, loadSample, clear } = useDataset();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import des données
        </CardTitle>
        <CardDescription>
          Le backend attend un fichier CSV. Le mode "single-file" détectera automatiquement les colonnes Likert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setError(null);
            const next = e.target.files?.[0] || null;
            setFile(next);
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Fichier sélectionné</span>
            <span className="text-sm text-muted-foreground">
               {file ? file.name : 'Aucun fichier sélectionné'}
            </span>
          </div>
          
           {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <Loader2 className="h-4 w-4 animate-spin" />
               Chargement...
            </div>
           )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Upload className="mr-2 h-4 w-4" />
          Choisir un fichier
        </Button>
        <Button 
          variant="secondary" 
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
          <FileText className="mr-2 h-4 w-4" />
          Exemple (PROJET_POV)
        </Button>
        {file && (
            <Button 
              variant="destructive" 
              onClick={() => {
                clear();
                if (inputRef.current) inputRef.current.value = '';
              }} 
              disabled={busy}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vider
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
