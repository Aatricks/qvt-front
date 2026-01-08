import { FilePicker } from '../components/FilePicker';
import { Database } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Configuration des Données</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Gestion des sources de données pour le moteur de visualisation. Importez vos fichiers d'enquête ou utilisez les jeux de démonstration.
        </p>
      </div>

      <div className="max-w-3xl">
        <FilePicker />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl opacity-70">
        <div className="space-y-3">
            <h3 className="text-sm font-semibold">Format de Fichier</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">Le moteur attend un fichier CSV encodé en UTF-8. Les échelles de type Likert sont automatiquement détectées pour le calcul des indicateurs de tendance centrale.</p>
        </div>
        <div className="space-y-3">
            <h3 className="text-sm font-semibold">Confidentialité & RGPD</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">Les données sont traitées exclusivement en mémoire vive et ne font l'objet d'aucun stockage persistant. Un seuil de confidentialité strict (N=5) est appliqué sur toutes les segmentations.</p>
        </div>
      </div>
    </div>
  );
}


