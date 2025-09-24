import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Submission, ChartData, SubmissionData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import MultiSelect from './MultiSelect'; // Importez le nouveau composant

interface ResultsDashboardProps {
  submissions: Submission[];
  summary: string;
  summaryError: string;
  isLoading: boolean;
  error: string | null;
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

const BarChartCard = ({ title, data, yAxisWidth = 100, color = BAR_COLOR }: { title: string, data: any[], yAxisWidth?: number, color?: string }) => (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
            <XAxis type="number" allowDecimals={false} stroke="#a1a1aa" fontSize={12} />
            <YAxis type="category" dataKey="name" width={yAxisWidth} stroke="#a1a1aa" fontSize={12} interval={0} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
            <Legend wrapperStyle={{ position: 'relative', marginTop: '20px' }} />
            <Bar dataKey="value" name="Nombre de réponses" fill={color} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
);

const CombinedBarChartCard = ({ title, data, yAxisWidth = 100 }: { title: string, data: any[], yAxisWidth?: number }) => (
    <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                    <XAxis type="number" allowDecimals={false} stroke="#a1a1aa" fontSize={12} />
                    <YAxis type="category" dataKey="name" width={yAxisWidth} stroke="#a1a1aa" fontSize={12} interval={0} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
                    <Legend wrapperStyle={{ position: 'relative', marginTop: '20px' }} />
                    <Bar dataKey="Fréquence" fill={BAR_COLOR} barSize={10} />
                    <Bar dataKey="En augmentation" fill={BAR_COLOR_2} barSize={10} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

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

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ submissions, summary, summaryError, isLoading, error }) => {
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
    
  // Mettre à jour les filtres lorsque les rôles changent
  React.useEffect(() => {
    setSelectedRoles(allRoles);
  }, [allRoles]);

  // Persistance de l'état d'affichage de la synthèse (admin toggle)
  React.useEffect(() => {
    try {
      localStorage.setItem('showSynthesis', String(showSynthesis));
    } catch {}
  }, [showSynthesis]);

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
      Object.entries(data).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-xl font-bold">
            Synthèse des Réponses
          </CardTitle>
        </CardHeader>
        <CardContent>
            {/* Afficher le nombre total et le nombre filtré */}
            <p className="text-3xl font-bold text-primary">{data?.filteredCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">réponse(s) affichée(s) sur {submissions.length} au total</p>
        </CardContent>
      </Card>
      
      {/* Affichez les graphiques uniquement si des données existent après le filtrage */}
      {data ? (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.participatedCafes && <PieChartCard title="Participation aux cafés partenaires" data={data.participatedCafes} />}
                {data.professionalRoles && data.professionalRoles.length > 0 && <BarChartCard title="Répartition par rôle professionnel" data={data.professionalRoles} yAxisWidth={200} />}
            </div>
            
            {data.cafeParticipants.length > 0 && (
                <>
                    <hr className="my-8 border-gray-200"/>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Retours sur les Cafés Partenaires ({data.cafeParticipants.length} participant(s))</h2>
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
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Perception des Problématiques des Jeunes</h2>

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
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        Facteurs de Rupture et Maintien en Formation 
                        <span className="text-lg font-normal text-gray-600 block mt-1">
                            Expertise terrain de {data.ruptureResponsesCount} professionnel(s)
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {data.ruptureFactorsFavorable && data.ruptureFactorsFavorable.length > 0 && (
                            <BarChartCard 
                                title="Facteurs favorisant la reprise de formation" 
                                data={data.ruptureFactorsFavorable.slice(0, 6)} 
                                yAxisWidth={250}
                                color="#059669"
                            />
                        )}
                        {data.ruptureFactorsNegative && data.ruptureFactorsNegative.length > 0 && (
                            <BarChartCard 
                                title="Facteurs augmentant les risques d'abandon" 
                                data={data.ruptureFactorsNegative.slice(0, 6)} 
                                yAxisWidth={250}
                                color="#DC2626"
                            />
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
            
            {/* Section Synthèse IA (affichage conditionné par le toggle admin) */}
            {showSynthesis && (
              <>
                <hr className="my-8 border-gray-200"/>
                <Card>
                  <CardHeader>
                    <CardTitle>Synthèse</CardTitle>
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
