// src/components/InstitutionTabs.tsx
// Onglets dynamiques par institution avec exportation

import React, { useState } from 'react';
import { InstitutionData } from '../services/apiService';

interface InstitutionTabsProps {
  institutions: InstitutionData[];
  isLoading: boolean;
}

export const InstitutionTabs: React.FC<InstitutionTabsProps> = ({ institutions, isLoading }) => {
  const [activeTab, setActiveTab] = useState<string>('');

  // Initialiser avec le premier onglet
  React.useEffect(() => {
    if (institutions.length > 0 && !activeTab) {
      setActiveTab(institutions[0].name);
    }
  }, [institutions, activeTab]);

  const activeInstitution = institutions.find(inst => inst.name === activeTab);

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
      {activeInstitution && (
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
