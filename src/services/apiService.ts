import { Submission } from '../types';

// URL relative pour les Pages Functions (pas besoin de variable d'environnement)
const API_BASE_URL = "/api";

export interface ApiResponse {
  submissions: Submission[];
  summary: string;
  summaryError: string;
  usedModel?: string;
}

export interface InstitutionData {
  name: string;
  totalResponses: number;
  percentageOfTotal: number;
  challenges: Record<string, { count: number; percentage: number }>;
  ruptureFactors: {
    favorable: Record<string, { count: number; percentage: number }>;
    negative: Record<string, { count: number; percentage: number }>;
  };
  challengesRanking: Record<string, number>;
  topChallenges: Array<{ challenge: string; count: number; percentage: number }>;
  topFavorableFactors: Array<{ factor: string; count: number; percentage: number }>;
  topNegativeFactors: Array<{ factor: string; count: number; percentage: number }>;
}

export interface InstitutionAnalysisResponse {
  success: boolean;
  timestamp: string;
  totalSubmissions: number;
  institutions: InstitutionData[];
  summary: {
    totalInstitutions: number;
    institutionsWithData: number;
    averageResponsesPerInstitution: number;
  };
}

export const apiService = {
  // Récupérer les rôles dynamiques
  getDynamicRoles: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`);
      if (!response.ok) {
        throw new Error('Failed to fetch dynamic roles');
      }
      const data = await response.json();
      return data.success ? data.roles : [];
    } catch (error) {
      console.error('Erreur récupération rôles dynamiques:', error);
      return [];
    }
  },

  // Ajouter un nouveau rôle
  addDynamicRole: async (roleName: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add dynamic role');
      }
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Erreur ajout rôle dynamique:', error);
      return false;
    }
  },

  getSubmissions: async (aiModelPreference?: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/submissions`);
    if (!response.ok) {
      throw new Error('Failed to fetch submissions from the new API');
    }
    const submissionsData: any[] = await response.json();

    // Correction cruciale : Parser la chaîne JSON 'data' en objet
    const adaptedSubmissions = submissionsData.map((s: any) => {
      let parsedData = {};
      try {
        // 's.data' est une chaîne de caractères JSON, il faut la parser
        if (typeof s.data === 'string') {
          parsedData = JSON.parse(s.data);
        } else {
          parsedData = s.data; // Au cas où elle serait déjà un objet
        }
      } catch (e) {
        console.error("Erreur de parsing JSON pour la soumission:", s.id, e);
        // Retourner un objet vide pour éviter un crash
      }
              return {
        id: s.id,
        created_at: s.created_at,
        data: parsedData as any, // 'data' est maintenant un objet
      };
    });

    // Appel à l'endpoint summary pour récupérer la synthèse IA
    let summary = '';
    let summaryError = '';
    let usedModel = '';
    
    try {
      // Construire l'URL avec le paramètre du modèle si fourni
      const summaryUrl = aiModelPreference 
        ? `${API_BASE_URL}/summary?ai_model=${aiModelPreference}`
        : `${API_BASE_URL}/summary`;
        
      const summaryResponse = await fetch(summaryUrl);
      if (summaryResponse.ok) {
        const summaryData: any = await summaryResponse.json();
        summary = summaryData.summary || '';
        summaryError = summaryData.summaryError || '';
        usedModel = summaryData.usedModel || '';
      } else {
        summaryError = 'Erreur lors de la récupération de la synthèse IA.';
      }
    } catch (e) {
      console.error("Erreur lors de l'appel à l'endpoint summary:", e);
      summaryError = 'Impossible de récupérer la synthèse IA.';
    }

    return {
        submissions: adaptedSubmissions,
        summary: summary,
        summaryError: summaryError,
        usedModel: usedModel
    };
  },

  addSubmission: async (newSubmission: Omit<Submission, 'id' | 'submittedAt'>): Promise<Response> => {
    const response = await fetch(`${API_BASE_URL}/submissions`, { // Utilise la nouvelle route /api/submissions
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSubmission),
    });

    // Si erreur d'unicité email, enrichir le message d'erreur
    if (!response.ok && response.status === 409) {
      const errorData: any = await response.json();
      if (errorData.errorType === 'EMAIL_ALREADY_EXISTS') {
        throw new Error(errorData.error);
      }
    }

    return response;
  },

  // Récupérer l'analyse par institution
  getInstitutionAnalysis: async (): Promise<InstitutionAnalysisResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/institution-analysis`);
      if (!response.ok) {
        throw new Error('Failed to fetch institution analysis');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur récupération analyse institution:', error);
      throw error;
    }
  },
};
