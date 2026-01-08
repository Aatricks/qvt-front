import { useRef, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Upload, Trash2, Loader2, FileCheck, AlertCircle, FileSpreadsheet, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FilePicker() {
  const { file, setFile, loadSample, clear } = useDataset();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
        if (droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
        } else {
            setError("Format non supporté. Veuillez utiliser un fichier CSV.");
        }
    }
  };

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="border-b bg-muted/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileUp className="h-4 w-4 text-primary" />
          Importation des Données Sources
        </CardTitle>
        <CardDescription className="text-xs">
          Sélectionnez le fichier d'enquête au format CSV pour alimenter le moteur de visualisation.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
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

        <div 
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "relative group flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30",
            file && "border-primary/20 bg-primary/[0.02]"
          )}
        >
            <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center mb-3 border bg-background transition-transform",
                file ? "text-primary border-primary/20" : "text-muted-foreground border-border"
            )}>
                {file ? <FileCheck className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
            </div>

            {file ? (
                <div className="text-center">
                    <p className="font-semibold text-sm mb-0.5">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{(file.size / 1024).toFixed(1)} KB • Fichier Chargé</p>
                </div>
            ) : (
                <div className="text-center">
                    <p className="font-medium text-sm mb-0.5">Glissez-déposez un fichier CSV</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ou cliquez pour parcourir vos dossiers</p>
                </div>
            )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/5 border border-destructive/10 p-3 text-xs text-destructive font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
                <div className="h-px flex-grow bg-border" />
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/50">Environnement de test</span>
                <div className="h-px flex-grow bg-border" />
            </div>

            <Button 
                variant="secondary" 
                className="w-full h-10 text-xs font-semibold border bg-background hover:bg-muted/50"
                onClick={async (e) => {
                    e.stopPropagation();
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
                {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />}
                Charger le jeu de données de démonstration
            </Button>
            
            {file && (
                <Button 
                    variant="ghost" 
                    className="w-full h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/5 font-medium"
                    onClick={(e) => {
                        e.stopPropagation();
                        clear();
                        if (inputRef.current) inputRef.current.value = '';
                    }} 
                    disabled={busy}
                >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Réinitialiser le dataset
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}


