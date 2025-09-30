import React from 'react';
import { Submission } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface ResultsDashboardProps {
  submissions: Submission[];
  summary: string;
  summaryError: string;
  isLoading: boolean;
  error: string | null;
  usedModel?: string;
  onRefreshSummary?: (aiModelPreference: string) => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  submissions, 
  summary, 
  summaryError, 
  isLoading, 
  error, 
  usedModel, 
  onRefreshSummary 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent><p className="text-center text-gray-500 py-10">Chargement des données...</p></CardContent>
      </Card>
    );
  }

  if (error) {
     return <Card><CardContent><p className="text-center text-red-600 py-10">{error}</p></CardContent></Card>;
  }
  
  // Page d'information temporaire pendant la collecte
  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-800">📊 Collecte en cours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-blue-700">
            <p className="text-lg font-semibold mb-2">La consultation des professionnels de l'insertion est en cours</p>
            <p className="mb-3">Nous collectons actuellement les retours des professionnels sur les défis d'insertion des jeunes et l'impact des cafés partenaires CAP.</p>
            
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📈 Progression de la collecte</h3>
              <p className="text-sm text-blue-600">
                <strong>{submissions.length}</strong> professionnel{submissions.length > 1 ? 's' : ''} ont déjà partagé leur expertise
              </p>
            </div>
            
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Objectif de cette consultation</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Identifier les défis prioritaires d'insertion des jeunes</li>
                <li>• Analyser l'impact des cafés partenaires CAP</li>
                <li>• Recueillir les perceptions des professionnels du terrain</li>
                <li>• Alimenter la réflexion stratégique du secteur</li>
              </ul>
            </div>
            
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📅 Prochaines étapes</h3>
              <p className="text-sm text-blue-600">
                Les résultats détaillés seront disponibles une fois la collecte terminée. 
                Cette consultation contribuera à une meilleure compréhension des enjeux d'insertion des jeunes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {submissions.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-800">✅ Consultation active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              La collecte progresse bien ! Les professionnels partagent leurs expériences et perceptions. 
              Merci à tous les participants pour leur contribution à cette démarche collaborative.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultsDashboard;