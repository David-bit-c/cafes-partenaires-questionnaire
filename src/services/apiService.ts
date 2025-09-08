import { Submission } from '../types';

// URL relative pour les Pages Functions (pas besoin de variable d'environnement)
const API_BASE_URL = "/api";

export interface ApiResponse {
  submissions: Submission[];
  summary: string;
  summaryError: string;
}

export const apiService = {
  getSubmissions: async (): Promise<ApiResponse> => {
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
    
    try {
      const summaryResponse = await fetch(`${API_BASE_URL}/summary`);
      if (summaryResponse.ok) {
        const summaryData: any = await summaryResponse.json();
        summary = summaryData.summary || '';
        summaryError = summaryData.summaryError || '';
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
        summaryError: summaryError
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
      const errorData = await response.json();
      if (errorData.errorType === 'EMAIL_ALREADY_EXISTS') {
        throw new Error(errorData.error);
      }
    }

    return response;
  },
};
