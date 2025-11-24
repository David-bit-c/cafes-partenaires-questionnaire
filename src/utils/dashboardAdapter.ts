/**
 * Adaptateur de données pour le dashboard alternatif
 * Convertit les données de l'API (Submission[]) vers le format du dashboard
 * 
 * PRÉCAUTIONS :
 * - Utilise UNIQUEMENT les données de l'API (pas de données statiques)
 * - Applique le seuil de confidentialité (min 3 réponses)
 * - Aucune donnée individuelle exposée
 */

import { Submission, SubmissionData } from '../types';

// Seuil minimum pour respecter la confidentialité
export const MINIMUM_THRESHOLD = 3;

/**
 * Interface pour les données agrégées du dashboard
 */
export interface DashboardData {
  totalResponses: number;
  hasMinimumResponses: boolean;
  challengesData: AggregatedItem[];
  impactsData: AggregatedItem[];
  scoreDistribution: ScoreData[];
  qualitativeData: {
    challenges: string[];
    impacts: string[];
    suggestions: string[];
  };
}

export interface AggregatedItem {
  name: string;
  count: number;
  percentage: number;
}

export interface ScoreData {
  score: string;
  count: number;
}

/**
 * Convertit les données de l'API vers le format du dashboard
 */
export function adaptSubmissionsToDashboard(submissions: Submission[]): DashboardData {
  const totalResponses = submissions.length;
  const hasMinimumResponses = totalResponses >= MINIMUM_THRESHOLD;

  // Si pas assez de réponses, retourner structure vide
  if (!hasMinimumResponses) {
    return {
      totalResponses,
      hasMinimumResponses: false,
      challengesData: [],
      impactsData: [],
      scoreDistribution: [],
      qualitativeData: {
        challenges: [],
        impacts: [],
        suggestions: []
      }
    };
  }

  // Agréger les défis
  const challengesData = aggregateChallenges(submissions);
  
  // Agréger les impacts
  const impactsData = aggregateImpacts(submissions);
  
  // Distribution des scores
  const scoreDistribution = getScoreDistribution(submissions);
  
  // Données qualitatives
  const qualitativeData = extractQualitativeData(submissions);

  return {
    totalResponses,
    hasMinimumResponses: true,
    challengesData,
    impactsData,
    scoreDistribution,
    qualitativeData
  };
}

/**
 * Agrège les défis rencontrés
 */
function aggregateChallenges(submissions: Submission[]): AggregatedItem[] {
  const challengesMap = new Map<string, number>();
  
  const labelMap: Record<string, string> = {
    'sante_mentale': 'Santé mentale',
    'precarite': 'Précarité',
    'decrochage': 'Décrochage',
    'migration': 'Migration',
    'addictions': 'Addictions',
    'conflits': 'Conflits',
    'autre': 'Autre'
  };
  
  submissions.forEach(sub => {
    const data = sub.data as SubmissionData;
    if (data.observedChallenges && Array.isArray(data.observedChallenges)) {
      data.observedChallenges.forEach(challenge => {
        if (challenge && typeof challenge === 'string') {
          const label = labelMap[challenge] || challenge;
          challengesMap.set(label, (challengesMap.get(label) || 0) + 1);
        }
      });
    }
  });

  const total = submissions.length;
  
  return Array.from(challengesMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Agrège les facteurs favorables et négatifs
 */
function aggregateImpacts(submissions: Submission[]): AggregatedItem[] {
  const impactsMap = new Map<string, number>();
  
  const labelMap: Record<string, string> = {
    // Facteurs favorables
    'accompagnement_individualise': 'Accompagnement individualisé',
    'soutien_competences_base': 'Soutien compétences de base',
    'stabilisation_situation': 'Stabilisation de la situation',
    'adaptation_pedagogique': 'Adaptation pédagogique',
    'soutien_financier_materiel': 'Soutien financier/matériel',
    'orientation_adaptee': 'Orientation adaptée',
    // Facteurs négatifs
    'lacunes_scolaires': 'Lacunes scolaires',
    'instabilite_psycho_sociale': 'Instabilité psycho-sociale',
    'inadequation_orientation': 'Inadéquation orientation',
    'isolement_social': 'Isolement social',
    'difficultes_integration': 'Difficultés d\'intégration',
    'demotivation_perte_sens': 'Démotivation/perte de sens'
  };
  
  submissions.forEach(sub => {
    const data = sub.data as SubmissionData;
    
    // Facteurs favorables
    if (data.ruptureFactorsFavorable && Array.isArray(data.ruptureFactorsFavorable)) {
      data.ruptureFactorsFavorable.forEach(factor => {
        if (factor && typeof factor === 'string') {
          const label = labelMap[factor] || factor;
          impactsMap.set(label, (impactsMap.get(label) || 0) + 1);
        }
      });
    }
    
    // Facteurs négatifs
    if (data.ruptureFactorsNegative && Array.isArray(data.ruptureFactorsNegative)) {
      data.ruptureFactorsNegative.forEach(factor => {
        if (factor && typeof factor === 'string') {
          const label = labelMap[factor] || factor;
          impactsMap.set(label, (impactsMap.get(label) || 0) + 1);
        }
      });
    }
  });

  const total = submissions.length;
  
  return Array.from(impactsMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Génère la distribution des rankings de défis
 */
function getScoreDistribution(submissions: Submission[]): ScoreData[] {
  const scoresMap = new Map<string, number>();
  
  submissions.forEach(sub => {
    const data = sub.data as SubmissionData;
    if (data.challengesRanking) {
      // Calculer le score moyen des challenges
      const scores = Object.values(data.challengesRanking);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const roundedScore = Math.round(avgScore);
      const scoreKey = String(roundedScore);
      scoresMap.set(scoreKey, (scoresMap.get(scoreKey) || 0) + 1);
    }
  });

  return Array.from(scoresMap.entries())
    .map(([score, count]) => ({
      score: `Niveau ${score}`,
      count
    }))
    .sort((a, b) => parseInt(a.score.replace('Niveau ', '')) - parseInt(b.score.replace('Niveau ', '')));
}

/**
 * Extrait les données qualitatives (textes libres)
 */
function extractQualitativeData(submissions: Submission[]): {
  challenges: string[];
  impacts: string[];
  suggestions: string[];
} {
  const challenges: string[] = [];
  const impacts: string[] = [];
  const suggestions: string[] = [];

  submissions.forEach(sub => {
    const data = sub.data as SubmissionData;
    
    // Défis observés (texte "autre")
    if (data.observedChallengesOther && typeof data.observedChallengesOther === 'string' && data.observedChallengesOther.trim()) {
      challenges.push(data.observedChallengesOther.trim());
    }
    
    // Description des défis émergents
    if (data.emergingChallengesDescription && typeof data.emergingChallengesDescription === 'string' && data.emergingChallengesDescription.trim()) {
      challenges.push(data.emergingChallengesDescription.trim());
    }
    
    // Obstacles à la spécialisation
    if (data.specializationObstacles && typeof data.specializationObstacles === 'string' && data.specializationObstacles.trim()) {
      impacts.push(data.specializationObstacles.trim());
    }
    
    // Facteurs de rupture (autres)
    if (data.ruptureFactorsOther && typeof data.ruptureFactorsOther === 'string' && data.ruptureFactorsOther.trim()) {
      suggestions.push(data.ruptureFactorsOther.trim());
    }
  });

  return { challenges, impacts, suggestions };
}

