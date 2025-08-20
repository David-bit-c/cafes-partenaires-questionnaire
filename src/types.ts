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

  // Page 5 - Nouvelle section
  challengesHasEmerged?: ('sante_mentale' | 'precarite' | 'decrochage' | 'migration' | 'addictions' | 'conflits')[];
  emergingChallengesDescription?: string;
  
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
