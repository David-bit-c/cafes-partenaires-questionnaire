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
  // Gestion du mode preview via URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    
    if (adminParam === '1') {
      localStorage.setItem('previewMode', 'true');
      // Recharger la page sans le paramètre pour nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (adminParam === '0') {
      localStorage.removeItem('previewMode');
      // Recharger la page sans le paramètre pour nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Vérifier si le mode preview est activé
  const isPreviewMode = React.useMemo(() => {
    try {
      return localStorage.getItem('previewMode') === 'true';
    } catch {
      return false;
    }
  }, []);

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
  
  // Si le mode preview n'est pas activé, afficher la page d'information temporaire pendant la collecte
  if (!isPreviewMode) {
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
  }

  // Mode preview activé - afficher les vrais résultats
  return (
    <div className="space-y-6">
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-green-800">🔓 Mode Preview Activé</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            Vous visualisez les résultats complets en mode prévisualisation. 
            <span className="text-sm text-green-600 ml-2">
              (Pour désactiver: <a href="?admin=0" className="underline">?admin=0</a>)
            </span>
          </p>
        </CardContent>
      </Card>
      
      {/* Ici on pourrait ajouter le contenu des vrais résultats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Résultats Complets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-10">
            Contenu des résultats complets à implémenter...
            <br />
            <span className="text-sm">({submissions.length} réponses disponibles)</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDashboard;