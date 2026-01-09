export type ChartMetadata = {
  key: string;
  title: string;
  description: string;
  category: 'Décision / actions' | 'Synthèse' | 'Analyses' | 'Temps' | 'Autres';
  icon?: string;
};

export const CHART_METADATA: Record<string, ChartMetadata> = {
  action_priority_index: {
    key: 'action_priority_index',
    title: 'Priorités d\'action',
    description: 'Identifie les dimensions combinant scores faibles et forte importance pour l\'épuisement.',
    category: 'Décision / actions',
  },
  dimension_ci_bars: {
    key: 'dimension_ci_bars',
    title: 'Scores par dimension',
    description: 'Moyennes des scores par dimension avec écart-type (dispersion).',
    category: 'Synthèse',
  },
  dimension_mean_std_scatter: {
    key: 'dimension_mean_std_scatter',
    title: 'Moyenne vs Dispersion',
    description: 'Analyse la relation entre le score moyen et la dispersion (écart-type) pour chaque dimension.',
    category: 'Analyses',
  },
  clustering_profile: {
    key: 'clustering_profile',
    title: 'Segmentation automatique',
    description: 'Identifie des groupes de collaborateurs aux profils de réponse similaires par segmentation automatique (clustering).',
    category: 'Analyses',
  },
  likert_distribution: {
    key: 'likert_distribution',
    title: 'Répartition Likert',
    description: 'Distribution détaillée des réponses pour chaque question de l\'enquête.',
    category: 'Synthèse',
  },
  anova_significance: {
    key: 'anova_significance',
    title: 'Analyse de variance (ANOVA)',
    description: 'Évalue si les différences de scores entre groupes démographiques sont statistiquement significatives.',
    category: 'Analyses',
  },
  correlation_matrix: {
    key: 'correlation_matrix',
    title: 'Matrice de corrélation',
    description: 'Visualise les relations entre les différentes dimensions du questionnaire.',
    category: 'Analyses',
  },
  demographic_distribution: {
    key: 'demographic_distribution',
    title: 'Profil démographique',
    description: 'Répartition de la population répondante selon les variables signalétiques.',
    category: 'Synthèse',
  },
  dimension_heatmap: {
    key: 'dimension_heatmap',
    title: 'Heatmap des scores',
    description: 'Vue d\'ensemble des scores croisés par dimensions et groupes.',
    category: 'Synthèse',
  },
  dimension_boxplot: {
    key: 'dimension_boxplot',
    title: 'Dispersion des scores',
    description: 'Visualise la distribution et les valeurs aberrantes pour chaque dimension.',
    category: 'Synthèse',
  },
  likert_item_heatmap: {
    key: 'likert_item_heatmap',
    title: 'Heatmap des items',
    description: 'Détail des scores par item et par groupe.',
    category: 'Synthèse',
  },
  scatter_regression: {
    key: 'scatter_regression',
    title: 'Nuage de points & Régression',
    description: 'Analyse la relation linéaire entre deux dimensions.',
    category: 'Analyses',
  },
  time_series: {
    key: 'time_series',
    title: 'Évolution temporelle',
    description: 'Suivi des scores au fil du temps.',
    category: 'Temps',
  },
  time_series_ci: {
    key: 'time_series_ci',
    title: 'Évolution avec confiance',
    description: 'Suivi temporel incluant les intervalles de confiance.',
    category: 'Temps',
  },
};

export function getChartMetadata(key: string): ChartMetadata {
  return CHART_METADATA[key] ?? {
    key,
    title: key,
    description: 'Pas de description disponible pour ce graphique.',
    category: 'Autres',
  };
}
