# QVT-Site

L'application frontend pour la plateforme de visualisation QVT. Construite avec React, Vite et Vega-Lite.

## Fonctionnalités

- Vues basées sur les rôles : Tableaux de bord dédiés pour les employés, les decideurs et les RH (pilotes d'action group).
- Visualisations interactives : Rendu de graphiques Vega-Lite utilisant `vega-embed`, et les json générés par le backend python.
- Interface moderne : Stylisée avec Tailwind CSS et les primitives Radix UI, shadcn.

## Installation

1. Naviguer vers le dossier du site :
   ```bash
   cd site
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

## Utilisation

### Serveur de développement

Démarrer le serveur de développement local :

```bash
npm run dev
```

L'application sera accessible à l'adresse `http://localhost:5173`.

### Compiler pour la production

Compiler l'application pour le déploiement :

```bash
npm run build
```

Pour prévisualiser la version de production localement :

```bash
npm run preview
```