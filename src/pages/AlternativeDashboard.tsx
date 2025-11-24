/**
 * Page Alternative Dashboard
 * Vue alternative des résultats avec graphiques interactifs
 * 
 * PRÉCAUTIONS APPLIQUÉES:
 * - Utilise UNIQUEMENT l'API existante (apiService.getSubmissions)
 * - Applique le seuil de confidentialité (min 3 réponses)
 * - Aucune donnée statique ou de test
 * - Composants isolés dans /components/dashboard/
 */

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Submission } from '../types';
import { adaptSubmissionsToDashboard, DashboardData, MINIMUM_THRESHOLD } from '../utils/dashboardAdapter';
import PrivacyShield from '../components/dashboard/PrivacyShield';
import ChallengesBarChart from '../components/dashboard/ChallengesBarChart';
import ImpactsRadarChart from '../components/dashboard/ImpactsRadarChart';

const AlternativeDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utilise l'API existante - AUCUNE donnée statique
      const apiResponse = await apiService.getSubmissions();
      
      // Adapte les données pour le dashboard
      const adapted = adaptSubmissionsToDashboard(apiResponse.submissions);
      setDashboardData(adapted);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-center text-gray-900">Erreur</h2>
          <p className="mb-4 text-center text-gray-600">{error}</p>
          <button
            onClick={loadData}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // Protection confidentialité: afficher PrivacyShield si < 3 réponses
  if (!dashboardData.hasMinimumResponses) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tableau de Bord des Résultats
                </h1>
                <p className="text-sm text-gray-600">
                  Vue analytique des retours sur les cafés partenaires
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <PrivacyShield threshold={MINIMUM_THRESHOLD} />
        </main>
      </div>
    );
  }

  const { totalResponses, challengesData, impactsData, qualitativeData } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Titre principal et badge */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <BarChart3 className="w-10 h-10 mr-4 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Renforcer le réseau et l'accompagnement
                </h1>
                <p className="text-lg text-gray-700 font-medium">
                  Tableau de Bord des Résultats
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-6">
              <div className="text-4xl font-bold text-blue-600">{totalResponses}</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Réponses</div>
            </div>
          </div>
          
          {/* Message d'introduction */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-blue-100">
            <p className="text-base text-gray-700 leading-relaxed">
              La synthèse de vos retours sur les « Cafés Partenaires » et votre vision des défis actuels 
              participent à construire ensemble des réponses adaptées pour les jeunes en rupture.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Défis Identifiés</p>
                <p className="text-2xl font-bold text-gray-900">{challengesData.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Facteurs Analysés</p>
                <p className="text-2xl font-bold text-gray-900">{impactsData.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commentaires Qualitatifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {qualitativeData.challenges.length + qualitativeData.impacts.length + qualitativeData.suggestions.length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts - Tous sur une seule page longue */}
        <div className="space-y-6">
          {/* Challenges Bar Chart */}
          {challengesData.length > 0 && (
            <ChallengesBarChart data={challengesData} />
          )}

          {/* Impacts Radar Chart */}
          {impactsData.length > 0 && (
            <ImpactsRadarChart data={impactsData} />
          )}

          {/* Qualitative Data */}
          {(qualitativeData.challenges.length > 0 || 
            qualitativeData.impacts.length > 0 || 
            qualitativeData.suggestions.length > 0) && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="mb-4 text-lg font-semibold">Retours Qualitatifs</h3>
              
              {qualitativeData.challenges.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-2 font-medium text-gray-900">Défis Supplémentaires</h4>
                  <ul className="space-y-2">
                    {qualitativeData.challenges.slice(0, 5).map((challenge, idx) => (
                      <li key={idx} className="text-sm text-gray-600">• {challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {qualitativeData.impacts.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-2 font-medium text-gray-900">Obstacles à la Spécialisation</h4>
                  <ul className="space-y-2">
                    {qualitativeData.impacts.slice(0, 5).map((impact, idx) => (
                      <li key={idx} className="text-sm text-gray-600">• {impact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {qualitativeData.suggestions.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Autres Facteurs</h4>
                  <ul className="space-y-2">
                    {qualitativeData.suggestions.slice(0, 5).map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-gray-600">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 mt-12 text-center text-gray-600 border-t border-gray-200">
        <p className="text-sm">
          Données collectées dans le respect de la confidentialité (minimum {MINIMUM_THRESHOLD} réponses requises)
        </p>
      </footer>
    </div>
  );
};

export default AlternativeDashboard;

