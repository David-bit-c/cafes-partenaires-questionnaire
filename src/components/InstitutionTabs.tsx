// src/components/InstitutionTabs.tsx
// Onglets dynamiques par institution avec exportation

import React, { useState } from 'react';
import { InstitutionData } from '../services/apiService';

interface InstitutionTabsProps {
  institutions: InstitutionData[];
  isLoading: boolean;
}

export const InstitutionTabs: React.FC<InstitutionTabsProps> = ({ institutions, isLoading }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Initialiser avec l'onglet "Vue d'ensemble"
  React.useEffect(() => {
    if (institutions.length > 0 && !activeTab) {
      setActiveTab('overview');
    }
  }, [institutions, activeTab]);

  const activeInstitution = institutions.find(inst => inst.name === activeTab);
  
  // Calculer les données agrégées pour la vue d'ensemble
  const overviewData = React.useMemo(() => {
    if (institutions.length === 0) return null;
    
    const totalResponses = institutions.reduce((sum, inst) => sum + inst.totalResponses, 0);
    
    // Agréger tous les défis
    const allChallenges: Record<string, { count: number; percentage: number }> = {};
    institutions.forEach(inst => {
      Object.entries(inst.challenges).forEach(([challenge, data]) => {
        if (!allChallenges[challenge]) {
          allChallenges[challenge] = { count: 0, percentage: 0 };
        }
        allChallenges[challenge].count += data.count;
      });
    });
    
    // Recalculer les pourcentages
    Object.keys(allChallenges).forEach(challenge => {
      allChallenges[challenge].percentage = Math.round((allChallenges[challenge].count / totalResponses) * 100);
    });
    
    // Agréger les facteurs favorables
    const allFavorable: Record<string, { count: number; percentage: number }> = {};
    institutions.forEach(inst => {
      Object.entries(inst.ruptureFactors.favorable).forEach(([factor, data]) => {
        if (!allFavorable[factor]) {
          allFavorable[factor] = { count: 0, percentage: 0 };
        }
        allFavorable[factor].count += data.count;
      });
    });
    
    Object.keys(allFavorable).forEach(factor => {
      allFavorable[factor].percentage = Math.round((allFavorable[factor].count / totalResponses) * 100);
    });
    
    // Agréger les facteurs négatifs
    const allNegative: Record<string, { count: number; percentage: number }> = {};
    institutions.forEach(inst => {
      Object.entries(inst.ruptureFactors.negative).forEach(([factor, data]) => {
        if (!allNegative[factor]) {
          allNegative[factor] = { count: 0, percentage: 0 };
        }
        allNegative[factor].count += data.count;
      });
    });
    
    Object.keys(allNegative).forEach(factor => {
      allNegative[factor].percentage = Math.round((allNegative[factor].count / totalResponses) * 100);
    });
    
    // Calculer les tops
    const topChallenges = Object.entries(allChallenges)
      .map(([challenge, data]) => ({ challenge, ...data }))
      .sort((a, b) => b.count - a.count);
      
    const topFavorableFactors = Object.entries(allFavorable)
      .map(([factor, data]) => ({ factor, ...data }))
      .sort((a, b) => b.count - a.count);
      
    const topNegativeFactors = Object.entries(allNegative)
      .map(([factor, data]) => ({ factor, ...data }))
      .sort((a, b) => b.count - a.count);
    
    return {
      name: 'Vue d\'ensemble',
      totalResponses,
      percentageOfTotal: 100,
      challenges: allChallenges,
      ruptureFactors: {
        favorable: allFavorable,
        negative: allNegative,
      },
      topChallenges,
      topFavorableFactors,
      topNegativeFactors,
    };
  }, [institutions]);

  const handleExport = async (institutionName?: string) => {
    try {
      const response = await fetch('/api/export-institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          institution: institutionName || 'all',
          format: 'csv'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${institutionName ? institutionName.replace(/\s+/g, '_') : 'toutes_institutions'}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Chargement des données par institution...</p>
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Aucune donnée d'institution disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation des onglets - Version améliorée */}
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto">
          <nav className="-mb-px flex space-x-4 min-w-max px-1">
            {/* Onglet Vue d'ensemble */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="whitespace-nowrap">🏢 Vue d'ensemble</span>
              <span className={`py-0.5 px-2 rounded-full text-xs font-semibold ${
                activeTab === 'overview'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {overviewData?.totalResponses || 0}
              </span>
            </button>
            
            {institutions.map((institution) => (
              <button
                key={institution.name}
                onClick={() => setActiveTab(institution.name)}
                className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === institution.name
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="whitespace-nowrap">{institution.name}</span>
                <span className={`py-0.5 px-2 rounded-full text-xs font-semibold ${
                  activeTab === institution.name
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {institution.totalResponses}
                </span>
              </button>
            ))}
            
            {/* Bouton Export Global - DÉSACTIVÉ */}
            {/* <button
              onClick={() => handleExport()}
              className="flex items-center space-x-2 py-2 px-4 border-b-2 border-transparent text-green-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 font-medium text-sm rounded-t-lg transition-colors"
            >
              <span>📊</span>
              <span className="whitespace-nowrap">Export Global</span>
            </button> */}
          </nav>
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === 'overview' && overviewData ? (
        <div className="space-y-6">
          {/* En-tête de la vue d'ensemble */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <span className="mr-2">🏢</span>
                  Vue d'ensemble - Toutes les institutions
                </h3>
                <p className="text-blue-600 mt-1">
                  {overviewData.totalResponses} réponses au total • {institutions.length} institutions
                </p>
              </div>
            </div>
          </div>

          {/* Défis observés */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Défis Observés - Toutes institutions (Top 5)
            </h4>
            <div className="space-y-3">
              {overviewData.topChallenges.slice(0, 5).map((challenge, index) => (
                <div key={challenge.challenge} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <span className="text-gray-800 font-medium capitalize">
                      {challenge.challenge.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{challenge.count}</span>
                    <span className="text-sm text-gray-500 ml-1">({challenge.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facteurs de rupture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facteurs favorables */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <span className="mr-2">✅</span>
                Facteurs Favorables - Toutes institutions
              </h4>
              <div className="space-y-3">
                {overviewData.topFavorableFactors.slice(0, 3).map((factor, index) => (
                  <div key={factor.factor} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-800 font-medium capitalize">
                      {factor.factor.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{factor.count}</span>
                      <span className="text-sm text-gray-500 ml-1">({factor.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facteurs négatifs */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <span className="mr-2">❌</span>
                Facteurs Négatifs - Toutes institutions
              </h4>
              <div className="space-y-3">
                {overviewData.topNegativeFactors.slice(0, 3).map((factor, index) => (
                  <div key={factor.factor} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-800 font-medium capitalize">
                      {factor.factor.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-red-600">{factor.count}</span>
                      <span className="text-sm text-gray-500 ml-1">({factor.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Statistiques Globales</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Total institutions:</span>
                <span className="ml-2 text-gray-900">{institutions.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total défis identifiés:</span>
                <span className="ml-2 text-gray-900">{Object.keys(overviewData.challenges).length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Facteurs favorables:</span>
                <span className="ml-2 text-gray-900">{Object.keys(overviewData.ruptureFactors.favorable).length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Facteurs négatifs:</span>
                <span className="ml-2 text-gray-900">{Object.keys(overviewData.ruptureFactors.negative).length}</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeInstitution && (
        <div className="space-y-6">
          {/* En-tête de l'institution */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  {activeInstitution.name}
                </h3>
                <p className="text-blue-600">
                  {activeInstitution.totalResponses} réponses ({activeInstitution.percentageOfTotal}% du total)
                </p>
              </div>
              {/* Bouton Export Institution - DÉSACTIVÉ */}
              {/* <button
                onClick={() => handleExport(activeInstitution.name)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                📥 Export {activeInstitution.name}
              </button> */}
            </div>
          </div>

          {/* Défis observés */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Défis Observés (Top 5)
            </h4>
            <div className="space-y-3">
              {activeInstitution.topChallenges.slice(0, 5).map((challenge, index) => (
                <div key={challenge.challenge} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <span className="text-gray-800 font-medium capitalize">
                      {challenge.challenge.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{challenge.count}</span>
                    <span className="text-sm text-gray-500 ml-1">({challenge.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facteurs de rupture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facteurs favorables */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <span className="mr-2">✅</span>
                Facteurs Favorables
              </h4>
              <div className="space-y-3">
                {activeInstitution.topFavorableFactors.slice(0, 3).map((factor, index) => (
                  <div key={factor.factor} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-800 font-medium capitalize">
                      {factor.factor.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{factor.count}</span>
                      <span className="text-sm text-gray-500 ml-1">({factor.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facteurs négatifs */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <span className="mr-2">❌</span>
                Facteurs Négatifs
              </h4>
              <div className="space-y-3">
                {activeInstitution.topNegativeFactors.slice(0, 3).map((factor, index) => (
                  <div key={factor.factor} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-800 font-medium capitalize">
                      {factor.factor.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-red-600">{factor.count}</span>
                      <span className="text-sm text-gray-500 ml-1">({factor.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Statistiques Détaillées</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Total défis:</span>
                <span className="ml-2 text-gray-900">{Object.keys(activeInstitution.challenges).length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Facteurs favorables:</span>
                <span className="ml-2 text-gray-900">{Object.keys(activeInstitution.ruptureFactors.favorable).length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Facteurs négatifs:</span>
                <span className="ml-2 text-gray-900">{Object.keys(activeInstitution.ruptureFactors.negative).length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Part du total:</span>
                <span className="ml-2 text-gray-900">{activeInstitution.percentageOfTotal}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
