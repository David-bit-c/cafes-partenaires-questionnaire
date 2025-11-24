import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Submission, ChartData, SubmissionData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import MultiSelect from './MultiSelect'; // Importez le nouveau composant
import { apiService, InstitutionData } from '../services/apiService';
import { InstitutionTabs } from './InstitutionTabs';

interface ResultsDashboardProps {
  submissions: Submission[];
  summary: string;
  summaryError: string;
  isLoading: boolean;
  error: string | null;
  usedModel?: string;
  onRefreshSummary?: (aiModelPreference: string) => void;
}

// Palette professionnelle sobre pour crédibilité maximale
const PIE_COLORS = [
  '#2563EB', // Bleu royal professionnel
  '#1E40AF', // Bleu marine foncé
  '#6B7280', // Gris moyen élégant
  '#374151', // Gris anthracite
  '#059669'  // Vert émeraude discret
];
const BAR_COLOR = '#2563EB';      // Bleu royal
const RADAR_STROKE_COLOR = '#2563EB';  // Bleu royal
const RADAR_FILL_COLOR = 'rgba(37, 99, 235, 0.6)';  // Bleu royal avec transparence

const BAR_COLOR_2 = '#1E40AF';   // Bleu marine pour contraste

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs text-sm">
        <p className="font-bold text-gray-800 break-words">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.fill }}>
            {`${pld.name}: ${typeof pld.value === 'number' ? pld.value.toFixed(0) : pld.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BarChartCard = ({ title, data, yAxisWidth = 100, color = BAR_COLOR, showTop5 = true }: { title: string, data: any[], yAxisWidth?: number, color?: string, showTop5?: boolean }) => {
  const [showAll, setShowAll] = useState(false);
  const displayData = showTop5 && !showAll ? data.slice(0, 5) : data;
  const hasMore = showTop5 && data.length > 5;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showAll ? 'Voir Top 5' : `Voir tout (${data.length})`}
          </button>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
            <XAxis type="number" allowDecimals={false} stroke="#a1a1aa" fontSize={12} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={yAxisWidth} 
              stroke="#a1a1aa" 
              fontSize={10} 
              interval={0}
              tick={{ 
                fontSize: 10, 
                textAnchor: 'end', 
                dominantBaseline: 'middle',
                width: yAxisWidth - 10
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
            <Legend wrapperStyle={{ position: 'relative', marginTop: '20px' }} />
            <Bar dataKey="value" name="Nombre de réponses" fill={color} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const CombinedBarChartCard = ({ title, data, yAxisWidth = 100, showTop5 = true }: { title: string, data: any[], yAxisWidth?: number, showTop5?: boolean }) => {
  const [showAll, setShowAll] = useState(false);
  const displayData = showTop5 && !showAll ? data.slice(0, 5) : data;
  const hasMore = showTop5 && data.length > 5;
  
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showAll ? 'Voir Top 5' : `Voir tout (${data.length})`}
            </button>
          )}
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                    <XAxis type="number" allowDecimals={false} stroke="#a1a1aa" fontSize={12} />
                    <YAxis 
              type="category" 
              dataKey="name" 
              width={yAxisWidth} 
              stroke="#a1a1aa" 
              fontSize={10} 
              interval={0}
              tick={{ 
                fontSize: 10, 
                textAnchor: 'end', 
                dominantBaseline: 'middle',
                width: yAxisWidth - 10
              }}
            />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
                    <Legend wrapperStyle={{ position: 'relative', marginTop: '20px' }} />
                    <Bar dataKey="Fréquence" fill={BAR_COLOR} barSize={10} />
                    <Bar dataKey="En augmentation" fill={BAR_COLOR_2} barSize={10} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
};

const PieChartCard = ({ title, data }: { title: string, data: ChartData }) => (
   <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent>
       <ResponsiveContainer width="100%" height={300}>
          <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
          </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const RadarChartCard = ({ title, data }: { title: string, data: { subject: string; A: number; fullMark: number }[] }) => (
  <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
          <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid stroke="rgba(128, 128, 128, 0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[1, 7]} tickCount={7} tick={{ fill: 'transparent' }} axisLine={false} />
                  <Radar name="Impact moyen" dataKey="A" stroke={RADAR_STROKE_COLOR} fill={RADAR_FILL_COLOR} fillOpacity={0.7} />
                  <Tooltip content={<CustomTooltip />} />
              </RadarChart>
          </ResponsiveContainer>
      </CardContent>
  </Card>
);

const TextResponsesCard = ({ title, responses }: { title: string, responses: (string | undefined)[] }) => {
    const filteredResponses = responses.filter((res): res is string => res !== undefined && res !== null && res.trim() !== '');
    if (filteredResponses.length === 0) return null;
    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {filteredResponses.map((res, i) => (
                    <li key={i} className="bg-gray-50 p-3 rounded-md italic text-gray-700 border border-gray-200">"{res}"</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

const AccordionCard = ({ title, children, isExpanded, onToggle, color = "blue" }: { 
  title: string, 
  children: React.ReactNode, 
  isExpanded: boolean, 
  onToggle: () => void,
  color?: "blue" | "green" | "red"
}) => {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50", 
    red: "border-red-200 bg-red-50"
  };
  
  return (
    <Card className={`${colorClasses[color]} md:!bg-white md:!border-gray-200`}>
      <CardHeader 
        className="cursor-pointer hover:bg-opacity-80 transition-all md:cursor-default"
        onClick={() => onToggle()}
      >
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="md:hidden">
            {isExpanded ? '−' : '+'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className={`md:block ${isExpanded ? 'block' : 'hidden'}`}>
        {children}
      </CardContent>
    </Card>
  );
};

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ submissions, summary, summaryError, isLoading, error, usedModel, onRefreshSummary }) => {
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
                  <strong>{submissions.length || 81}</strong> professionnel{(submissions.length || 81) > 1 ? 's' : ''} ont déjà partagé leur expertise
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

  // Mode preview activé - afficher les vrais résultats avec bannière
  const previewBanner = isPreviewMode ? (
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
  ) : null;

  // 1. Extraire tous les rôles uniques pour le filtre
  const allRoles = useMemo(() => {
    const roles = new Set<string>();
    submissions.forEach(s => {
      const role = s.data.professionalRole === 'Autre' ? s.data.professionalRoleOther || 'Autre (non précisé)' : s.data.professionalRole;
      if (role) roles.add(role);
    });
    return Array.from(roles);
  }, [submissions]);

  // 2. État pour les rôles sélectionnés
  const [selectedRoles, setSelectedRoles] = useState<string[]>(allRoles);
  
  // État pour les accordéons mobile
  const [isMobileAccordionOpen, setIsMobileAccordionOpen] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  
  // État pour le bloc Admin Avancés
  const [showAdvancedAdmin, setShowAdvancedAdmin] = useState(false);
  
  // 3. État pour l'export des données
  const [isExporting, setIsExporting] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState<boolean>(() => {
    try {
      return localStorage.getItem('showSynthesis') === 'true';
    } catch {
      return false;
    }
  });
  const [aiModelPreference, setAiModelPreference] = useState<string>(() => {
    try {
      return localStorage.getItem('aiModelPreference') || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [showInstitutionAnalysis, setShowInstitutionAnalysis] = useState<boolean>(() => {
    try {
      return localStorage.getItem('showInstitutionAnalysis') === 'true';
    } catch {
      return false;
    }
  });
  // Feature flags (désactivés par défaut) - uniquement côté client
  const [showThematicFocus, setShowThematicFocus] = useState<boolean>(() => {
    try {
      return localStorage.getItem('showThematicFocus') === 'true';
    } catch {
      return false;
    }
  });
  const [showExecutiveDashboard, setShowExecutiveDashboard] = useState<boolean>(() => {
    try {
      return localStorage.getItem('showExecutiveDashboard') === 'true';
    } catch {
      return false;
    }
  });
  const [showActionRecommendations, setShowActionRecommendations] = useState<boolean>(() => {
    try {
      return localStorage.getItem('showActionRecommendations') === 'true';
    } catch {
      return false;
    }
  });
  // Synthèse thématique (lecture seule)
  const [showThematicSynthesis, setShowThematicSynthesis] = useState<boolean>(() => {
    try {
      return localStorage.getItem('showThematicSynthesis') === 'true';
    } catch {
      return false;
    }
  });
  const [synthesisDisplayMode, setSynthesisDisplayMode] = useState<'general' | 'thematic' | 'both'>(() => {
    try {
      const saved = localStorage.getItem('synthesisDisplayMode');
      if (saved === 'general' || saved === 'thematic' || saved === 'both') return saved;
      return 'both';
    } catch {
      return 'both';
    }
  });
  const [institutionData, setInstitutionData] = useState<InstitutionData[]>([]);
  const [isLoadingInstitutionData, setIsLoadingInstitutionData] = useState(false);
    
  // Mettre à jour les filtres lorsque les rôles changent
  React.useEffect(() => {
    setSelectedRoles(allRoles);
  }, [allRoles]);

  // Charger les données d'analyse par institution
  useEffect(() => {
    if (showInstitutionAnalysis) {
      setIsLoadingInstitutionData(true);
      apiService.getInstitutionAnalysis()
        .then(data => {
          setInstitutionData(data.institutions);
        })
        .catch(error => {
          console.error('Erreur chargement données institution:', error);
        })
        .finally(() => {
          setIsLoadingInstitutionData(false);
        });
    }
  }, [showInstitutionAnalysis]);

  // Persister l'état showInstitutionAnalysis
  useEffect(() => {
    try {
      localStorage.setItem('showInstitutionAnalysis', showInstitutionAnalysis.toString());
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }, [showInstitutionAnalysis]);

  // Persister les feature flags (lecture seule, aucun impact backend)
  useEffect(() => {
    try {
      localStorage.setItem('showThematicFocus', showThematicFocus.toString());
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }, [showThematicFocus]);

  useEffect(() => {
    try {
      localStorage.setItem('showExecutiveDashboard', showExecutiveDashboard.toString());
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }, [showExecutiveDashboard]);

  useEffect(() => {
    try {
      localStorage.setItem('showActionRecommendations', showActionRecommendations.toString());
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }, [showActionRecommendations]);

  // Persistance synthèse thématique
  useEffect(() => {
    try {
      localStorage.setItem('showThematicSynthesis', String(showThematicSynthesis));
    } catch {}
  }, [showThematicSynthesis]);
  useEffect(() => {
    try {
      localStorage.setItem('synthesisDisplayMode', synthesisDisplayMode);
    } catch {}
  }, [synthesisDisplayMode]);

  // Persistance de l'état d'affichage de la synthèse (admin toggle)
  React.useEffect(() => {
    try {
      localStorage.setItem('showSynthesis', String(showSynthesis));
    } catch {}
  }, [showSynthesis]);

  // Persistance de la préférence modèle IA (admin toggle)
  React.useEffect(() => {
    try {
      localStorage.setItem('aiModelPreference', aiModelPreference);
    } catch {}
  }, [aiModelPreference]);

  // Rafraîchir la synthèse quand le modèle change
  React.useEffect(() => {
    if (onRefreshSummary && aiModelPreference) {
      onRefreshSummary(aiModelPreference);
    }
  }, [aiModelPreference, onRefreshSummary]);

  // Fonctions d'export
  const handleAdminAuth = () => {
    if (adminPassword === 'CAP_EXPORT_2025') {
      setIsAdminAuthenticated(true);
      setAdminPassword('');
      setShowPassword(false);
      // Modal reste ouverte mais passe en mode export
    } else {
      alert('Code incorrect');
      setAdminPassword('');
    }
  };

  const handleExport = async () => {
    console.log('🔧 DÉBUT handleExport');
    setIsExporting(true);
    
    try {
      console.log('🔧 Appel API export...');
      const response = await fetch('/api/export?format=csv');
      console.log('🔧 Réponse API:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erreur d'export: ${response.status}`);
      }
      
      // Créer un lien de téléchargement
      console.log('🔧 Création blob...');
      const blob = await response.blob();
      console.log('🔧 Blob créé, taille:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Nom du fichier CSV
      const date = new Date().toISOString().split('T')[0];
      a.download = `questionnaire_cap_formations_${date}.csv`;
      
      console.log('🔧 Téléchargement:', a.download);
      document.body.appendChild(a);
      a.click();
      console.log('🔧 Click déclenché');
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('🔧 Cleanup terminé');
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      alert(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
      console.log('🔧 FIN handleExport');
    }
  };

  const data = useMemo(() => {
    // 3. Filtrer les soumissions en fonction des rôles sélectionnés
    const filteredSubmissions = submissions.filter(s => {
      const role = s.data.professionalRole === 'Autre' ? s.data.professionalRoleOther || 'Autre (non précisé)' : s.data.professionalRole;
      return role && selectedRoles.includes(role);
    });
      
    const totalSubmissions = filteredSubmissions.length;
    if (totalSubmissions === 0) return null;

    const processedSubmissions: SubmissionData[] = filteredSubmissions.map(s => s.data);

    const cafeParticipants = processedSubmissions.filter(s => s.participatedInCafes === 'Oui');
    
    const formatChartData = (data: Record<string, number>): ChartData =>
      Object.entries(data).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), 
        value 
      })).sort((a,b) => b.value - a.value);

    const participatedCafes = processedSubmissions.reduce((acc, s) => {
        const key = s.participatedInCafes || "Non spécifié";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<'Oui' | 'Non' | 'Non spécifié', number>);

    const cafesKnowledge = cafeParticipants.reduce((acc, s) => {
        s.cafesKnowledge?.forEach(k => {
            const label = k === 'equipes' ? 'Équipe CAP' : 'Autres partenaires';
            acc[label] = (acc[label] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const cafesCommunication = cafeParticipants.reduce((acc, s) => {
        if (s.cafesCommunication) acc[s.cafesCommunication] = (acc[s.cafesCommunication] || 0) + 1;
        return acc;
    }, {} as Record<'Oui' | 'Non', number>);

    const cafesEnjoyment = cafeParticipants.reduce((acc, s) => {
        s.cafesEnjoyment?.forEach(e => {
            const label = {
                decouverte: 'Découverte structures', discussion: 'Discussion libre',
                informels: 'Moments informels', autre: 'Autre'
            }[e] || e;
            acc[label] = (acc[label] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const observedChallenges = processedSubmissions.reduce((acc, s) => {
        s.observedChallenges?.forEach(c => {
             const label = {
                sante_mentale: 'Santé mentale', precarite: 'Précarité', decrochage: 'Décrochage',
                migration: 'Migration', addictions: 'Addictions', conflits: 'Conflits familiaux', autre: 'Autre'
            }[c] || c;
            acc[label] = (acc[label] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);
    
    const challengesRanking = processedSubmissions.reduce<Record<string, { total: number, count: number }>>((acc, s) => {
        if (!s.challengesRanking) return acc;
        Object.entries(s.challengesRanking).forEach(([key, value]) => {
            const label = {
                sante_mentale: 'Santé mentale', precarite: 'Précarité', decrochage: 'Décrochage',
                migration: 'Migration', addictions: 'Addictions', conflits: 'Conflits familiaux'
            }[key] || key;
            if (!acc[label]) acc[label] = { total: 0, count: 0 };
            acc[label].total += Number(value);
            acc[label].count += 1;
        });
        return acc;
    }, {});
    
        const challengesRankingAvg = Object.entries(challengesRanking).map(([name, {total, count}]) => ({
       subject: name, A: total/count, fullMark: 7
    }));

    const challengesEvolution = processedSubmissions.reduce((acc, s) => {
        s.challengesHasEmerged?.forEach(c => {
            const label = {
                sante_mentale: 'Santé mentale', precarite: 'Précarité', decrochage: 'Décrochage',
                migration: 'Migration', addictions: 'Addictions', conflits: 'Conflits familiaux'
            }[c] || c;
            acc[label] = (acc[label] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const combinedChallengesData = Object.keys(observedChallenges).map(challenge => ({
        name: challenge,
        'Fréquence': observedChallenges[challenge] || 0,
        'En augmentation': challengesEvolution[challenge] || 0,
    })).sort((a,b) => b['Fréquence'] - a['Fréquence']);

    // Taux d'aggravation: part des répondants qui signalent au moins une problématique en augmentation
    const submissionsWithEmergence = processedSubmissions.filter(s => (s.challengesHasEmerged || []).length > 0).length;
    const aggravationRate = totalSubmissions > 0 ? Math.round((submissionsWithEmergence / totalSubmissions) * 100) : 0;


    const professionalRoles = processedSubmissions.reduce((acc, s) => {
        const role = s.professionalRole === 'Autre' ? s.professionalRoleOther || 'Autre (non précisé)' : s.professionalRole;
        if (role) acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Traitement des facteurs de rupture - Exclusion des "skip section"
    const ruptureResponses = processedSubmissions.filter(s => !s.skipRuptureSection);
    
    // Labels pour les graphiques
    const ruptureFactorLabels = {
        // Facteurs favorables
        accompagnement_individualise: 'Accompagnement individualisé renforcé',
        soutien_competences_base: 'Soutien aux compétences de base',
        stabilisation_situation: 'Stabilisation situation personnelle',
        adaptation_pedagogique: 'Adaptation pédagogique',
        soutien_financier_materiel: 'Soutien financier et matériel',
        orientation_adaptee: 'Orientation et projet adaptés',
        // Facteurs défavorables
        lacunes_scolaires: 'Lacunes scolaires importantes',
        instabilite_psycho_sociale: 'Instabilité psycho-sociale',
        inadequation_orientation: 'Inadéquation orientation initiale',
        isolement_social: 'Isolement social et manque de pairs',
        difficultes_integration: 'Difficultés d\'intégration',
        demotivation_perte_sens: 'Démotivation et perte de sens'
    };

    const ruptureFactorsFavorable = ruptureResponses.reduce((acc, s) => {
        if (s.ruptureFactorsFavorable) {
            s.ruptureFactorsFavorable.forEach(factor => {
                const label = ruptureFactorLabels[factor] || factor;
                acc[label] = (acc[label] || 0) + 1;
            });
        }
        return acc;
    }, {} as Record<string, number>);

    const ruptureFactorsNegative = ruptureResponses.reduce((acc, s) => {
        if (s.ruptureFactorsNegative) {
            s.ruptureFactorsNegative.forEach(factor => {
                const label = ruptureFactorLabels[factor] || factor;
                acc[label] = (acc[label] || 0) + 1;
            });
        }
        return acc;
    }, {} as Record<string, number>);

    const textResponses = {
        cafesCommReason: cafeParticipants.map(s => s.cafesCommunicationReason),
        cafesEnjoymentOther: cafeParticipants.map(s => s.cafesEnjoymentOther),
        observedChallengesOther: processedSubmissions.map(s => s.observedChallengesOther),
        specializationObstacles: processedSubmissions.map(s => s.specializationObstacles),
        emergingChallengesDescription: processedSubmissions.map(s => s.emergingChallengesDescription),
        ruptureFactorsOther: ruptureResponses.map(s => s.ruptureFactorsOther),
    };

    return {
      participatedCafes: formatChartData(participatedCafes),
      cafesKnowledge: formatChartData(cafesKnowledge),
      cafesCommunication: formatChartData(cafesCommunication),
      cafesEnjoyment: formatChartData(cafesEnjoyment),
      observedChallenges: formatChartData(observedChallenges),
      challengesRankingAvg,
      professionalRoles: formatChartData(professionalRoles),
      textResponses,
      cafeParticipants,
      combinedChallengesData,
      filteredCount: totalSubmissions,
      // Nouvelles données facteurs de rupture
      ruptureFactorsFavorable: formatChartData(ruptureFactorsFavorable),
      ruptureFactorsNegative: formatChartData(ruptureFactorsNegative),
      ruptureResponsesCount: ruptureResponses.length,
      aggravationRate,
    };
  }, [submissions, selectedRoles]);
  
  if (isLoading) {
     return <Card><CardContent><p className="text-center text-gray-500 py-10">Chargement des résultats...</p></CardContent></Card>;
  }

  if (error) {
     return <Card><CardContent><p className="text-center text-red-600 py-10">{error}</p></CardContent></Card>;
  }
  
  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Résultats du Questionnaire</CardTitle></CardHeader>
        <CardContent><p className="text-center text-gray-500 py-10">Aucune réponse n'a été soumise pour le moment.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {previewBanner}
      {/* Sommaire de navigation */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">🧭 Navigation rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-sm">
            <a href="#participation" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
              <span>📊</span>
              <span>Participation</span>
            </a>
            <a href="#perception" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
              <span>🧭</span>
              <span>Perception</span>
            </a>
            <a href="#facteurs" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
              <span>✅</span>
              <span>Facteurs</span>
            </a>
            <a href="#syntheses" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
              <span>📋</span>
              <span>Synthèses</span>
            </a>
            <a href="#institutions" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
              <span>🏢</span>
              <span>Institutions</span>
            </a>
            {showThematicFocus && (
              <a href="#focus" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
                <span>🎯</span>
                <span>Focus</span>
              </a>
            )}
            {showExecutiveDashboard && (
              <a href="#dashboard" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
                <span>🎯</span>
                <span>Dashboard</span>
              </a>
            )}
            {showActionRecommendations && (
              <a href="#recommandations" className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-blue-100 transition-colors">
                <span>💡</span>
                <span>Actions</span>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card id="participation">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-xl font-bold">
            📊 Synthèse des Réponses
          </CardTitle>
        </CardHeader>
        <CardContent>
            {/* Afficher le nombre total et le nombre filtré */}
            <p className="text-3xl font-bold text-primary">{data?.filteredCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">réponse(s) affichée(s) sur {submissions.length} au total</p>
        </CardContent>
      </Card>

      {/* Dashboard exécutif remonté juste après le compteur */}
      {showExecutiveDashboard && data && (
        <>
          <Card id="dashboard">
            <CardHeader>
              <CardTitle>🎯 Dashboard exécutif</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const total = data.filteredCount || 0;
                const aggravation = data.aggravationRate || 0;
                const topChallenge = (data.observedChallenges || [])[0]?.name || '—';
                const topFav = (data.ruptureFactorsFavorable || [])[0]?.name || '—';
                const topNeg = (data.ruptureFactorsNegative || [])[0]?.name || '—';
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs uppercase text-blue-700">Réponses analysées</div>
                      <div className="text-2xl font-bold text-blue-900">{total}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs uppercase text-purple-700">
                        Tendance d'aggravation
                        <span
                          title="Part des répondants déclarant au moins une problématique 'en augmentation'."
                          className="ml-1 inline-block text-purple-600/70 cursor-help"
                          aria-label="Comment c'est calculé"
                        >
                          ℹ︎
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">{aggravation}%</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="text-xs uppercase text-amber-700">Défi dominant</div>
                      <div className="text-sm font-semibold text-amber-900 capitalize">{topChallenge}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-xs uppercase text-red-700">Facteur critique</div>
                      <div className="text-sm font-semibold text-red-900 capitalize">{topNeg}</div>
                    </div>
                    <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="text-xs uppercase text-slate-700">Levier prioritaire</div>
                      <div className="text-sm font-semibold text-slate-900 capitalize">{topFav}</div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Affichez les graphiques uniquement si des données existent après le filtrage */}
      {data ? (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.participatedCafes && <PieChartCard title="Participation aux cafés partenaires" data={data.participatedCafes} />}
                {data.professionalRoles && data.professionalRoles.length > 0 && <BarChartCard title="Répartition par rôle professionnel" data={data.professionalRoles} yAxisWidth={350} />}
            </div>
            
            {data.cafeParticipants.length > 0 && (
                <>
                    <hr className="my-8 border-gray-200"/>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">☕ Retours sur les Cafés Partenaires ({data.cafeParticipants.length} participant(s))</h2>
                    <div className="space-y-6">
                        {data.cafesKnowledge && data.cafesKnowledge.length > 0 && <BarChartCard title="Permet de mieux connaître..." data={data.cafesKnowledge} />}
                        {data.cafesCommunication && data.cafesCommunication.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <PieChartCard title="Facilite la communication" data={data.cafesCommunication} />
                                <TextResponsesCard title="Raisons si 'Non'" responses={data.textResponses.cafesCommReason} />
                            </div>
                        )}
                        {data.cafesEnjoyment && data.cafesEnjoyment.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <BarChartCard title="Aspects les plus appréciés des cafés" data={data.cafesEnjoyment} />
                              <TextResponsesCard title="Autres aspects appréciés" responses={data.textResponses.cafesEnjoymentOther} />
                            </div>
                        )}
                    </div>
                </>
            )}
            
            <hr className="my-8 border-gray-200"/>
            <h2 id="perception" className="text-2xl font-bold text-center text-gray-800 mb-6">🧭 Perception des Problématiques des Jeunes</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.observedChallenges && data.observedChallenges.length > 0 && <BarChartCard title="Défis les plus observés" data={data.observedChallenges} />}
                <TextResponsesCard title="Autres défis observés" responses={data.textResponses.observedChallengesOther} />
            </div>
            
            {data.challengesRankingAvg && data.challengesRankingAvg.length > 0 && <RadarChartCard title="Impact moyen perçu des problématiques" data={data.challengesRankingAvg} />}
            
            {data.combinedChallengesData && data.combinedChallengesData.length > 0 && <CombinedBarChartCard title="Fréquence vs. Tendance d'augmentation" data={data.combinedChallengesData} yAxisWidth={120} />}
            
            <TextResponsesCard title="Nouvelles problématiques émergentes signalées" responses={data.textResponses.emergingChallengesDescription} />
            
            <TextResponsesCard title="Obstacles dans l'accompagnement professionnel" responses={data.textResponses.specializationObstacles} />
            
            {/* Section Facteurs de Rupture et Maintien en Formation */}
            {data.ruptureResponsesCount >= 5 && (
                <>
                    <hr className="my-8 border-gray-200"/>
                    <h2 id="facteurs" className="text-2xl font-bold text-center text-gray-800 mb-6">
                        ✅ Facteurs de Rupture et Maintien en Formation 
                        <span className="text-lg font-normal text-gray-600 block mt-1">
                            Expertise terrain de {data.ruptureResponsesCount} professionnel(s)
                        </span>
                    </h2>

                    {/* Boutons de contrôle mobile */}
                    <div className="flex justify-center space-x-4 mb-6 md:hidden">
                      <button
                        onClick={() => setIsAllExpanded(!isAllExpanded)}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        {isAllExpanded ? 'Replier tout' : 'Déplier tout'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {data.ruptureFactorsFavorable && data.ruptureFactorsFavorable.length > 0 && (
                            <AccordionCard
                                title="Facteurs favorisant la reprise de formation"
                                isExpanded={isAllExpanded}
                                onToggle={() => setIsAllExpanded(!isAllExpanded)}
                                color="green"
                            >
                                <BarChartCard 
                                    title="" 
                                    data={data.ruptureFactorsFavorable.slice(0, 6)} 
                                    yAxisWidth={250}
                                    color="#059669"
                                    showTop5={false}
                                />
                            </AccordionCard>
                        )}
                        {data.ruptureFactorsNegative && data.ruptureFactorsNegative.length > 0 && (
                            <AccordionCard
                                title="Facteurs augmentant les risques d'abandon"
                                isExpanded={isAllExpanded}
                                onToggle={() => setIsAllExpanded(!isAllExpanded)}
                                color="red"
                            >
                                <BarChartCard 
                                    title="" 
                                    data={data.ruptureFactorsNegative.slice(0, 6)} 
                                    yAxisWidth={250}
                                    color="#DC2626"
                                    showTop5={false}
                                />
                            </AccordionCard>
                        )}
                    </div>
                    
                    {data.textResponses.ruptureFactorsOther && (
                        <TextResponsesCard 
                            title="Autres facteurs identifiés" 
                            responses={data.textResponses.ruptureFactorsOther} 
                        />
                    )}
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-blue-800 text-sm">
                            💡 <strong>Note méthodologique :</strong> Cette synthèse valorise l'expérience collective des professionnels 
                            et identifie les leviers d'action pour optimiser l'accompagnement des jeunes en rupture.
                        </p>
                    </div>
                </>
            )}
            
            {/* Affichage synthèses selon mode choisi */}
            {((synthesisDisplayMode === 'general' && showSynthesis) || (synthesisDisplayMode === 'both' && showSynthesis)) && (
              <>
                <hr className="my-8 border-gray-200"/>
                <Card id="syntheses">
                  <CardHeader>
                    <CardTitle>
                      Synthèse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summaryError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700 font-medium">Erreur lors de la génération de la synthèse :</p>
                        <p className="text-red-600 text-sm mt-1">{summaryError}</p>
                      </div>
                    ) : summary ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {summary}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-center">
                          🤖 Génération de la synthèse IA en cours...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Synthèse thématique directement sous synthèse générale si mode "both" */}
            {showThematicSynthesis && (synthesisDisplayMode === 'thematic' || synthesisDisplayMode === 'both') && data && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      📋 Synthèse thématique
                      <span className="text-sm font-normal text-gray-500 ml-2">(Basé sur données brutes)</span>
                    </CardTitle>
                    <button
                      onClick={() => {
                        const top = (arr: { name: string; value: number }[] | undefined, n: number) => (arr || []).slice(0, n);
                        const topChallenges = top(data.observedChallenges, 3);
                        const topFav = top(data.ruptureFactorsFavorable, 2);
                        const topNeg = top(data.ruptureFactorsNegative, 3);
                        const total = data.filteredCount || 0;
                        const aggravation = data.aggravationRate || 0;
                        
                        const synthesisText = `SYNTHÈSE THÉMATIQUE - Questionnaire CAP Formations
                        
Défis concrets: ${topChallenges.length > 0 ? topChallenges.map(c => c.name).join(' • ') : '—'}

Impact organisationnel: ${total} réponses analysées • facteurs clés: ${topFav.length > 0 ? topFav.map(f => f.name).join(' • ') : '—'} • tendance: ${aggravation}% observent une aggravation

Impact sociétal: ${topNeg.length > 0 ? topNeg.map(n => n.name).join(' • ') : '—'}`;
                        
                        navigator.clipboard.writeText(synthesisText).then(() => {
                          alert('Synthèse thématique copiée dans le presse-papiers !');
                        }).catch(() => {
                          alert('Erreur lors de la copie');
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                    >
                      <span>📋</span>
                      <span>Copier</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const top = (arr: { name: string; value: number }[] | undefined, n: number) => (arr || []).slice(0, n);
                      const topChallenges = top(data.observedChallenges, 3);
                      const topFav = top(data.ruptureFactorsFavorable, 2);
                      const topNeg = top(data.ruptureFactorsNegative, 3);
                      const total = data.filteredCount || 0;
                      const aggravation = data.aggravationRate || 0;
                      const topChallengeName = topChallenges[0]?.name || '—';
                      return (
                        <div className="space-y-3 text-gray-800">
                          <p><span className="font-semibold">Défis concrets:</span> {topChallenges.length > 0 ? topChallenges.map(c => c.name).join(' • ') : '—'}</p>
                          <p>
                            <span className="font-semibold">Impact organisationnel:</span> {total} réponses analysées • facteurs clés: {topFav.length > 0 ? topFav.map(f => f.name).join(' • ') : '—'} •
                            <span className="ml-1">tendance: {aggravation}% observent une aggravation</span>
                            <span
                              title="Part des répondants déclarant au moins une problématique 'en augmentation' parmi la liste proposée."
                              className="ml-2 inline-block text-gray-400 cursor-help align-middle"
                              aria-label="Comment c'est calculé"
                            >
                              ℹ︎
                            </span>
                          </p>
                          <p><span className="font-semibold">Impact sociétal:</span> {topNeg.length > 0 ? topNeg.map(n => n.name).join(' • ') : '—'}</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Section Analyse par Institution (affichage conditionné par le toggle admin) */}
            {showInstitutionAnalysis && (
              <>
                <hr className="my-8 border-gray-200"/>
                <Card id="institutions">
                  <CardHeader>
                    <CardTitle>
                      🏢 Analyse par Institution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInstitutionData ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Chargement des données par institution...</p>
                      </div>
                    ) : institutionData.length > 0 ? (
                      <InstitutionTabs 
                        institutions={institutionData} 
                        isLoading={isLoadingInstitutionData}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <p>Aucune donnée d'institution disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Placeholders non intrusifs conditionnés par les nouveaux flags */}
            {showThematicFocus && data && (
              <>
                <hr className="my-8 border-gray-200"/>
                <Card id="focus">
                  <CardHeader>
                    <CardTitle>🎯 Focus thématiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const top = (arr: { name: string; value: number }[], n: number) => (arr || []).slice(0, n);
                      const topChallenges = top(data.observedChallenges || [], 3);
                      const topFav = top(data.ruptureFactorsFavorable || [], 3);
                      const topNeg = top(data.ruptureFactorsNegative || [], 3);
                      const total = data.filteredCount || 0;
                      const aggravation = data.aggravationRate || 0;
                      const topChallengeName = topChallenges[0]?.name || '—';
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="font-semibold mb-2">🎯 Défis concrets</div>
                            <ul className="space-y-1">
                              {topChallenges.length > 0 ? topChallenges.map((c) => (
                                <li key={c.name} className="flex items-center justify-between">
                                  <span className="capitalize">{c.name}</span>
                                  <span className="text-gray-500">{c.value}</span>
                                </li>
                              )) : <li className="text-gray-500">Aucun élément</li>}
                            </ul>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="font-semibold mb-2">🏢 Impact organisationnel</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="text-xs uppercase text-blue-700">Réponses affichées</div>
                                <div className="text-lg font-bold text-blue-900">{total}</div>
                              </div>
                              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                                <div className="text-xs uppercase text-purple-700">
                                  Tendance d'aggravation
                                  <span
                                    title="Part des répondants déclarant au moins une problématique 'en augmentation'."
                                    className="ml-1 inline-block text-purple-600/70 cursor-help"
                                    aria-label="Comment c'est calculé"
                                  >
                                    ℹ︎
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-purple-900">{aggravation}%</div>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                <div className="text-xs uppercase text-amber-700">Défi dominant</div>
                                <div className="text-sm font-semibold text-amber-900 capitalize">{topChallengeName}</div>
                              </div>
                              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-md p-3">
                                <div className="text-xs uppercase text-amber-700">Facteurs clés</div>
                                <div className="text-amber-900">
                                  {topFav.length > 0 ? topFav.map(f => f.name).slice(0,2).join(' • ') : '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="font-semibold mb-2">🌍 Impact sociétal</div>
                            <ul className="space-y-1">
                              {topNeg.length > 0 ? topNeg.map((n) => (
                                <li key={n.name} className="flex items-center justify-between">
                                  <span className="capitalize">{n.name}</span>
                                  <span className="text-gray-500">{n.value}</span>
                                </li>
                              )) : <li className="text-gray-500">Aucun élément</li>}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            )}


            {showActionRecommendations && (
              <>
                <hr className="my-8 border-gray-200"/>
                <Card id="recommandations">
                  <CardHeader>
                    <CardTitle>💡 Recommandations d'actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data ? (
                      (() => {
                        const top = (arr: { name: string; value: number }[] | undefined, n: number) => (arr || []).slice(0, n);
                        const topChallenges = top(data.observedChallenges, 3);
                        const topFav = top(data.ruptureFactorsFavorable, 2);
                        const topNeg = top(data.ruptureFactorsNegative, 2);
                        const recs: string[] = [];
                        if (topChallenges.length) {
                          const topChallenge = topChallenges[0];
                          recs.push(`Traiter en priorité: ${topChallenges.map(c => c.name).join(' • ')} (fréquence la plus élevée: ${topChallenge.value} réponses)`);
                        }
                        if (topFav.length) {
                          const topFavFactor = topFav[0];
                          recs.push(`Amplifier les leviers: ${topFav.map(f => f.name).join(' • ')} (facteur le plus cité: ${topFavFactor.value} réponses)`);
                        }
                        if (topNeg.length) {
                          const topNegFactor = topNeg[0];
                          recs.push(`Réduire les facteurs de risque: ${topNeg.map(n => n.name).join(' • ')} (risque le plus signalé: ${topNegFactor.value} réponses)`);
                        }
                        return (
                          <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                            {recs.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        );
                      })()
                    ) : (
                      <div className="text-gray-600 text-sm">Aucune donnée disponible</div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
        </>
      ) : (
        <Card>
            <CardContent><p className="text-center text-gray-500 py-10">Aucune réponse ne correspond aux filtres sélectionnés.</p></CardContent>
        </Card>
      )}

      {/* Section de filtre déplacée en bas */}
      <Card>
        <CardHeader><span className="text-base">Filtres</span></CardHeader>
        <CardContent>
            <MultiSelect
                options={allRoles.map(role => ({ value: role, label: role }))}
                selected={selectedRoles}
                onChange={setSelectedRoles}
                placeholder="Sélectionner des rôles professionnels..."
            />
        </CardContent>
      </Card>

      {/* Footer Admin - Zone discrète en bas */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-400 space-x-4">
          <span>CAP Formations</span>
          <span>•</span>
          <span>Questionnaire 2025</span>
          <span>•</span>
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm underline"
          >
            🔓 Admin
          </button>
        </div>
      </div>

      {/* Modal Admin - Centrage parfait + Export intégré */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform">
            <h3 className="text-xl font-bold mb-2 text-center text-gray-800">🔐 Administration</h3>
            <p className="text-gray-600 mb-6 text-center text-sm">
              Accès sécurisé pour l'export des données avec informations institutionnelles
            </p>
            
            {!isAdminAuthenticated ? (
              <>
                {/* Phase 1: Authentification */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Code d'accès administrateur"
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAdminAuth();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M18.364 5.636L5.636 18.364" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAdminModal(false);
                      setAdminPassword('');
                      setShowPassword(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAdminAuth}
                    disabled={!adminPassword.trim()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Valider
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Phase 2: Export + Toggle Synthèse */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Accès autorisé</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {submissions.length} questionnaire(s) disponible(s) pour export
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {/* Contrôles de base */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <label htmlFor="toggle-synthesis" className="text-sm text-gray-700">Afficher la synthèse (bloc IA)</label>
                    <input
                      id="toggle-synthesis"
                      type="checkbox"
                      checked={showSynthesis}
                      onChange={(e) => setShowSynthesis(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <label htmlFor="toggle-institution" className="text-sm text-gray-700">Afficher tri par institution</label>
                    <input
                      id="toggle-institution"
                      type="checkbox"
                      checked={showInstitutionAnalysis}
                      onChange={(e) => setShowInstitutionAnalysis(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>

                  {/* Bouton pour ouvrir/fermer les options avancées */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700 font-medium">Options avancées</span>
                    <button
                      onClick={() => setShowAdvancedAdmin(!showAdvancedAdmin)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {showAdvancedAdmin ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>

                  {/* Options avancées (retractables) */}
                  {showAdvancedAdmin && (
                    <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-blue-50">
                      {/* Contrôles synthèse thématique */}
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="toggle-thematic-synthesis" className="text-sm text-gray-700">Activer synthèse thématique</label>
                        <input
                          id="toggle-thematic-synthesis"
                          type="checkbox"
                          checked={showThematicSynthesis}
                          onChange={(e) => setShowThematicSynthesis(e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="synthesis-mode-select" className="text-sm text-gray-700 block mb-2">
                          Mode d'affichage de la synthèse
                          <span
                            title="Générale: synthèse IA uniquement | Thématique: synthèse calculée uniquement | Les deux: synthèse IA puis synthèse calculée"
                            className="ml-1 inline-block text-gray-400 cursor-help"
                            aria-label="Comment ça fonctionne"
                          >
                            ℹ︎
                          </span>
                        </label>
                        <select
                          id="synthesis-mode-select"
                          value={synthesisDisplayMode}
                          onChange={(e) => setSynthesisDisplayMode(e.target.value as any)}
                          disabled={!showThematicSynthesis}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                        >
                          <option value="general">Générale uniquement</option>
                          <option value="thematic">Thématique uniquement</option>
                          <option value="both">Les deux (générale puis thématique)</option>
                        </select>
                      </div>

                      {/* Nouveaux feature flags (désactivés par défaut) */}
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="toggle-thematic" className="text-sm text-gray-700">Préparer Focus thématiques (lecture seule)</label>
                        <input
                          id="toggle-thematic"
                          type="checkbox"
                          checked={showThematicFocus}
                          onChange={(e) => setShowThematicFocus(e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="toggle-exec" className="text-sm text-gray-700">Préparer Dashboard exécutif (lecture seule)</label>
                        <input
                          id="toggle-exec"
                          type="checkbox"
                          checked={showExecutiveDashboard}
                          onChange={(e) => setShowExecutiveDashboard(e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="toggle-actions" className="text-sm text-gray-700">Préparer Recommandations d'actions (lecture seule)</label>
                        <input
                          id="toggle-actions"
                          type="checkbox"
                          checked={showActionRecommendations}
                          onChange={(e) => setShowActionRecommendations(e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                      
                      <div className="p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="ai-model-select" className="text-sm text-gray-700 block mb-2">Modèle IA pour synthèse</label>
                        <select
                          id="ai-model-select"
                          value={aiModelPreference}
                          onChange={(e) => setAiModelPreference(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="auto">Auto (GPT-5 → Claude Sonnet 4.5 → Claude 3.5 → Gemini 3 Pro)</option>
                          <option value="openai">Forcer GPT-5 uniquement</option>
                          <option value="claude">Forcer Claude Sonnet 4.5 uniquement</option>
                          <option value="gemini">Forcer Gemini 3 Pro uniquement</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Auto : essaie GPT-5 → Claude Sonnet 4.5 → Claude 3.5 → Gemini 3 Pro si échec
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleExport}
                    disabled={isExporting || submissions.length === 0}
                    className="w-full flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    {isExporting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Télécharger CSV complet
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    🔒 Données anonymisées • 🏢 Enrichissement institutionnel
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowAdminModal(false);
                      setIsAdminAuthenticated(false);
                      setAdminPassword('');
                      setShowPassword(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;
