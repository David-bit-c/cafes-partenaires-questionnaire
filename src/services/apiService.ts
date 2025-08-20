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
    const submissionsData = await response.json();

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
        submittedAt: s.created_at,
        data: parsedData, // 'data' est maintenant un objet
      };
    });

    return {
        submissions: adaptedSubmissions,
        summary: '', // Synthèse IA non implémentée
        summaryError: 'La synthèse IA sera bientôt disponible.'
    };
  },

  addSubmission: async (newSubmission: Omit<Submission, 'id' | 'submittedAt'>): Promise<Response> => {
    return fetch(`${API_BASE_URL}/submissions`, { // Utilise la nouvelle route /api/submissions
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSubmission),
    });
  },
};
