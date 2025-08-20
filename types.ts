
export interface Submission {
  id: string;
  email: string;
  submittedAt: string;

  // Section 1
  participatedInCafes: 'Oui' | 'Non';

  // Section 2 (Optional)
  cafesKnowledge?: ('equipes' | 'partenaires')[];
  cafesCommunication?: 'Oui' | 'Non';
  cafesCommunicationReason?: string;
  cafesEnjoyment?: ('decouverte' | 'discussion' | 'informels' | 'autre')[];
  cafesEnjoymentOther?: string;

  // Section 3
  observedChallenges: ('sante_mentale' | 'precarite' | 'decrochage' | 'migration' | 'addictions' | 'conflits' | 'autre')[];
  observedChallengesOther?: string;
  
  challengesRanking: {
    sante_mentale: number;
    precarite: number;
    decrochage: number;
    migration: number;
    addictions: number;
    conflits: number;
  };
  
  specializationObstacles: string;

  // Professional Role
  professionalRole: string;
  professionalRoleOther?: string;
}

export type ChartData = {
  name: string;
  value: number;
}[];