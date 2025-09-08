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
    
  // Mettre à jour les filtres lorsque les rôles changent
  React.useEffect(() => {
    setSelectedRoles(allRoles);
  }, [allRoles]);

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
        accompagnement_psy: 'Accompagnement psychologique renforcé',
        soutien_financier: 'Soutien financier adapté',
        flexibilite_horaires: 'Flexibilité des horaires/modalités',
        relation_confiance: 'Relation de confiance avec un référent',
        projet_clarifie: 'Projet professionnel clarifié',
        resolution_problemes: 'Résolution des problématiques personnelles',
        // Facteurs défavorables
        sante_mentale_non_traitee: 'Problèmes de santé mentale non traités',
        difficultes_financieres: 'Difficultés financières persistantes',
        manque_motivation: 'Manque de motivation/sens du projet',
        problemes_familiaux: 'Problèmes familiaux ou sociaux',
        inadequation_formation: 'Inadéquation formation/profil du jeune',
        manque_soutien: 'Manque de soutien de l\'entourage'
    };

    const ruptureFactorsFavorable = ruptureResponses.reduce((acc, s) => {
        if (s.ruptureFactorsFavorable) {
            s.ruptureFactorsFavorable.forEach(factor => {
                if (factor !== 'autre') {
                    const label = ruptureFactorLabels[factor] || factor;
                    acc[label] = (acc[label] || 0) + 1;
                }
            });
        }
        return acc;
    }, {} as Record<string, number>);

    const ruptureFactorsNegative = ruptureResponses.reduce((acc, s) => {
        if (s.ruptureFactorsNegative) {
            s.ruptureFactorsNegative.forEach(factor => {
                if (factor !== 'autre') {
                    const label = ruptureFactorLabels[factor] || factor;
                    acc[label] = (acc[label] || 0) + 1;
                }
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
                            💡 <strong>Note méthodologique :</strong> Ces résultats reflètent l'expertise terrain des professionnels 
                            et viennent enrichir les statistiques officielles CAP avec des facteurs explicatifs concrets.
                        </p>
                    </div>
                </>
            )}
            
            {/* Section Synthèse IA */}
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
    </div>
  );
};

export default ResultsDashboard;
