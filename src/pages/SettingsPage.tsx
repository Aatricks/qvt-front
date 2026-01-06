import { FilePicker } from '../components/FilePicker';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres & Données</h1>
        <p className="text-muted-foreground">
          Importez vos données ou chargez un exemple pour explorer les fonctionnalités.
        </p>
      </div>

      <div className="w-full">
        <FilePicker />
      </div>
    </div>
  );
}
