import React, { useState, useEffect, useCallback } from 'react';
import QuestionnaireForm from './components/QuestionnaireForm';
import ResultsDashboard from './components/ResultsDashboard';
import Confirmation from './components/Confirmation'; // Importer le nouveau composant
import { FormIcon, ChartIcon } from './components/icons';
import { Submission } from './types';
import { apiService, ApiResponse } from './services/apiService';

type Tab = 'questionnaire' | 'results';
type SubmissionStatus = 'idle' | 'submitted' | 'error'; // Nouvel état pour gérer la soumission

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('questionnaire');
  const [apiData, setApiData] = useState<ApiResponse>({ submissions: [], summary: '', summaryError: '', usedModel: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle'); // Initialiser le nouvel état
  const [submissionError, setSubmissionError] = useState<string | null>(null); // Message d'erreur spécifique

  const fetchSubmissions = useCallback(async (aiModelPreference?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSubmissions(aiModelPreference);
      setApiData(data);
    } catch (err) {
      setError('Impossible de charger les résultats.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'results') {
      fetchSubmissions();
    }
  }, [activeTab, fetchSubmissions]);

  const handleAddSubmission = useCallback(async (newSubmission: Omit<Submission, 'id' | 'submittedAt'>) => {
    try {
        const response = await apiService.addSubmission(newSubmission);
        if (!response.ok) {
          throw new Error('La soumission a échoué');
        }
        setSubmissionStatus('submitted'); // Mettre à jour le statut en cas de succès
        setSubmissionError(null); // Réinitialiser l'erreur en cas de succès
        window.scrollTo(0, 0);

    } catch (err) {
        setSubmissionStatus('error'); // Mettre à jour le statut en cas d'erreur
        // Capturer le message d'erreur spécifique
        if (err instanceof Error) {
          setSubmissionError(err.message);
        } else {
          setSubmissionError('Nous n\'avons pas pu enregistrer votre réponse. Veuillez réessayer plus tard.');
        }
        console.error(err);
    }
  }, []);

  // Fonction pour réinitialiser le formulaire depuis la page de confirmation
  const handleResetForm = () => {
    setSubmissionStatus('idle');
    setSubmissionError(null); // Réinitialiser l'erreur
    setFormKey(Date.now()); // Changer la clé pour remonter un nouveau formulaire
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab || isAnimating) return;
    
    // Si on quitte la page de confirmation pour aller aux résultats, il faut aussi réinitialiser
    if (submissionStatus === 'submitted') {
      setSubmissionStatus('idle');
    }
    
    setIsAnimating(true);
    setActiveTab(tab);
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => handleTabChange(tab)}
        disabled={isAnimating}
        className={`nav-pill flex-1 flex items-center justify-center gap-3 ${
          isActive ? 'nav-pill-active' : 'nav-pill-inactive'
        }`}
        aria-pressed={isActive}
      >
        <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
          {icon}
        </span>
        <span className="font-semibold">{label}</span>
      </button>
    );
  };

  // Logique pour déterminer quel composant afficher
  const renderMainContent = () => {
    if (activeTab === 'results') {
      return (
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ResultsDashboard 
            submissions={apiData.submissions} 
            summary={apiData.summary}
            summaryError={apiData.summaryError}
            isLoading={isLoading}
            error={error}
            usedModel={apiData.usedModel}
            onRefreshSummary={fetchSubmissions}
          />
        </div>
      );
    }

    // Si on est sur l'onglet "questionnaire", on vérifie l'état de la soumission
    switch (submissionStatus) {
      case 'submitted':
        return <Confirmation onReset={handleResetForm} />;
      case 'error':
         // Composant d'information adaptatif selon le type d'erreur
        const isEmailDuplicate = submissionError?.includes('Cette adresse email a déjà été utilisée');
        
        return (
          <div className={`text-center p-8 rounded-lg ${isEmailDuplicate ? 'bg-blue-50' : 'bg-red-50'}`}>
            <h2 className={`text-2xl font-bold ${isEmailDuplicate ? 'text-blue-700' : 'text-red-700'}`}>
              {isEmailDuplicate ? 'Email déjà utilisé' : 'Erreur de soumission'}
            </h2>
            <p className={`mt-2 max-w-2xl mx-auto ${isEmailDuplicate ? 'text-blue-600' : 'text-red-600'}`}>
              {submissionError || 'Nous n\'avons pas pu enregistrer votre réponse. Veuillez réessayer plus tard.'}
            </p>
            <button 
              onClick={handleResetForm} 
              className={`mt-4 font-bold py-2 px-4 rounded-lg text-white ${
                isEmailDuplicate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isEmailDuplicate ? 'Utiliser une autre adresse' : 'Réessayer'}
            </button>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <QuestionnaireForm key={formKey} onSubmit={handleAddSubmission} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
      </div>
      
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold cap-logo invisible">
                  CAP Formations
                </h1>
                <p className="hidden sm:block text-sm text-muted-foreground font-medium">
                  Renforcer le réseau et l'accompagnement
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">En ligne</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 animate-slide-down" style={{ animationDelay: '100ms' }}>
          <div className="glass-card p-1.5 max-w-sm mx-auto shadow-2xl shadow-primary/5">
            <div className="flex gap-2">
              <TabButton 
                tab="questionnaire" 
                label="Questionnaire" 
                icon={<FormIcon className="w-5 h-5" />} 
              />
              <TabButton 
                tab="results" 
                label="Résultats" 
                icon={<ChartIcon className="w-5 h-5" />} 
              />
            </div>
          </div>
        </div>

        <div className={`transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {renderMainContent()}
        </div>
      </main>

      <footer className="mt-16 border-t border-border/50">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CAP Formations. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
