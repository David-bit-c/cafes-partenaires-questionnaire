// Ce fichier n'existe pas, mais sa structure est implicitement utilisée
// dans les composants. Le définir ici permet d'avoir une référence centrale
// pour la structure des données du formulaire.

export interface SubmissionData {
  // Page 1
  participatedInCafes: 'Oui' | 'Non';
  
  // Page 2 (Conditionnelle)
  cafesKnowledge?: ('equipes' | 'partenaires')[];
  cafesCommunication?: 'Oui' | 'Non';
  cafesCommunicationReason?: string;
  cafesEnjoyment?: ('decouverte' | 'discussion' | 'informels' | 'autre')[];
  cafesEnjoymentOther?: string;
  
  // Page 3
  observedChallenges: ('sante_mentale' | 'precarite' | 'decrochage' | 'migration' | 'addictions' | 'conflits' | 'autre')[];
  observedChallengesOther?: string;
  
  // Page 4
  challengesRanking: {
    sante_mentale: number;
    precarite: number;
    decrochage: number;
    migration: number;
    addictions: number;
    conflits: number;
  };

  // Page 5 - Évolution des problématiques
  challengesHasEmerged?: ('sante_mentale' | 'precarite' | 'decrochage' | 'migration' | 'addictions' | 'conflits')[];
  emergingChallengesDescription?: string;
  
  // Page 5.5 - Facteurs rupture et maintien formation
  ruptureFactorsFavorable?: ('accompagnement_individualise' | 'soutien_competences_base' | 'stabilisation_situation' | 'adaptation_pedagogique' | 'soutien_financier_materiel' | 'orientation_adaptee')[];
  ruptureFactorsNegative?: ('lacunes_scolaires' | 'instabilite_psycho_sociale' | 'inadequation_orientation' | 'isolement_social' | 'difficultes_integration' | 'demotivation_perte_sens')[];
  ruptureFactorsOther?: string;
  skipRuptureSection?: boolean;
  
  // Page 6 (Anciennement 5)
  specializationObstacles: string;
  professionalRole: 'Coach en insertion' | 'Assistant social' | 'Psychologue' | 'Éducateur' | 'Conseiller ORP' | 'Job-coach' | 'Autre';
  professionalRoleOther?: string;
  email: string;
}

export interface Submission {
  id: number;
  created_at: string;
  data: SubmissionData;
}

export type ChartData = { name: string; value: number }[];
