// Cloudflare Pages Function pour analyse par institution
// Données pré-calculées par institution avec pourcentages

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    
    // Récupération des soumissions
    const submissionsStmt = env.DB.prepare(
      "SELECT * FROM submissions ORDER BY created_at DESC"
    );
    const submissionsResult = await submissionsStmt.all();
    
    if (!submissionsResult.success) {
      throw new Error("Échec de la récupération des soumissions");
    }

    const submissions = submissionsResult.results;
    
    // Classification simplifiée des institutions
    function classifyInstitution(email) {
      if (!email || typeof email !== 'string') return 'Autres';
      
      const domain = email.toLowerCase().split('@')[1];
      if (!domain) return 'Autres';
      
      // Classification simplifiée (Option D) - AMÉLIORÉE
      if (domain.includes('hug.ch') || domain.includes('hcuge.ch')) {
        return 'HUG';
      }
      if (domain.includes('ge.ch') || domain.includes('etat.ge.ch')) {
        return 'État de Genève';
      }
      if (domain.includes('hospicegeneral.ch')) {
        return 'Hospice Général';
      }
      
      // FASE - Fondation d'Aide Sociale
      if (domain.includes('fase.ch') || domain.includes('fase.cj')) {
        return 'FASE';
      }
      
      // Communes genevoises
      if (domain.includes('lancy.ch') || domain.includes('plan-les-ouates.ch') || domain.includes('carouge.ch')) {
        return 'Communes';
      }
      
      // Associations spécialisées
      if (domain.includes('for-pro.ch') || domain.includes('mbg.ch') || domain.includes('sceneactive.ch') || domain.includes('radiovostok.ch')) {
        return 'Associations';
      }
      
      // Entreprises/Groupes
      if (domain.includes('groupe-serbeco.ch') || domain.includes('fegpac.ch')) {
        return 'Entreprises';
      }
      
      // Éducation
      if (domain.includes('cfp') || domain.includes('ecole') || domain.includes('formation')) {
        return 'Éducation';
      }
      
      // Emails personnels
      if (domain.includes('gmail.com') || domain.includes('hotmail.com') || domain.includes('yahoo.com')) {
        return 'Personnel';
      }
      
      return 'Autres';
    }

    // Traitement des données par institution
    const institutionData = {};
    const totalSubmissions = submissions.length;
    
    for (const submission of submissions) {
      try {
        const data = JSON.parse(submission.data);
        const email = data.email;
        const institution = classifyInstitution(email);
        
        if (!institutionData[institution]) {
          institutionData[institution] = {
            name: institution,
            totalResponses: 0,
            challenges: {},
            ruptureFactors: {
              favorable: {},
              negative: {}
            },
            challengesRanking: {},
            submissions: []
          };
        }
        
        institutionData[institution].totalResponses++;
        institutionData[institution].submissions.push(submission);
        
        // Défis observés
        if (data.observedChallenges && Array.isArray(data.observedChallenges)) {
          data.observedChallenges.forEach(challenge => {
            institutionData[institution].challenges[challenge] = 
              (institutionData[institution].challenges[challenge] || 0) + 1;
          });
        }
        
        // Facteurs de rupture favorables
        if (data.ruptureFactorsFavorable && Array.isArray(data.ruptureFactorsFavorable)) {
          data.ruptureFactorsFavorable.forEach(factor => {
            institutionData[institution].ruptureFactors.favorable[factor] = 
              (institutionData[institution].ruptureFactors.favorable[factor] || 0) + 1;
          });
        }
        
        // Facteurs de rupture négatifs
        if (data.ruptureFactorsNegative && Array.isArray(data.ruptureFactorsNegative)) {
          data.ruptureFactorsNegative.forEach(factor => {
            institutionData[institution].ruptureFactors.negative[factor] = 
              (institutionData[institution].ruptureFactors.negative[factor] || 0) + 1;
          });
        }
        
        // Classement des défis
        if (data.challengesRanking && typeof data.challengesRanking === 'object') {
          Object.entries(data.challengesRanking).forEach(([challenge, ranking]) => {
            if (!institutionData[institution].challengesRanking[challenge]) {
              institutionData[institution].challengesRanking[challenge] = [];
            }
            institutionData[institution].challengesRanking[challenge].push(parseInt(ranking) || 0);
          });
        }
        
      } catch (error) {
        console.error(`Erreur parsing soumission ${submission.id}:`, error);
      }
    }

    // Calcul des pourcentages et moyennes
    const processedData = {};
    
    for (const [institution, data] of Object.entries(institutionData)) {
      const total = data.totalResponses;
      
      // Défis observés avec pourcentages
      const challengesWithPercentages = {};
      Object.entries(data.challenges).forEach(([challenge, count]) => {
        challengesWithPercentages[challenge] = {
          count: count,
          percentage: Math.round((count / total) * 100)
        };
      });
      
      // Facteurs favorables avec pourcentages
      const favorableWithPercentages = {};
      Object.entries(data.ruptureFactors.favorable).forEach(([factor, count]) => {
        favorableWithPercentages[factor] = {
          count: count,
          percentage: Math.round((count / total) * 100)
        };
      });
      
      // Facteurs négatifs avec pourcentages
      const negativeWithPercentages = {};
      Object.entries(data.ruptureFactors.negative).forEach(([factor, count]) => {
        negativeWithPercentages[factor] = {
          count: count,
          percentage: Math.round((count / total) * 100)
        };
      });
      
      // Moyennes des classements
      const rankingAverages = {};
      Object.entries(data.challengesRanking).forEach(([challenge, rankings]) => {
        const average = rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length;
        rankingAverages[challenge] = Math.round(average * 10) / 10; // 1 décimale
      });
      
      processedData[institution] = {
        name: institution,
        totalResponses: total,
        percentageOfTotal: Math.round((total / totalSubmissions) * 100),
        challenges: challengesWithPercentages,
        ruptureFactors: {
          favorable: favorableWithPercentages,
          negative: negativeWithPercentages
        },
        challengesRanking: rankingAverages,
        topChallenges: Object.entries(challengesWithPercentages)
          .sort(([,a], [,b]) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(([challenge, data]) => ({ challenge, ...data })),
        topFavorableFactors: Object.entries(favorableWithPercentages)
          .sort(([,a], [,b]) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(([factor, data]) => ({ factor, ...data })),
        topNegativeFactors: Object.entries(negativeWithPercentages)
          .sort(([,a], [,b]) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(([factor, data]) => ({ factor, ...data }))
      };
    }

    // Tri par nombre de réponses (décroissant)
    const sortedInstitutions = Object.values(processedData)
      .sort((a, b) => b.totalResponses - a.totalResponses);

    console.log(`✅ Analyse par institution: ${sortedInstitutions.length} institutions, ${totalSubmissions} soumissions`);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      totalSubmissions: totalSubmissions,
      institutions: sortedInstitutions,
      summary: {
        totalInstitutions: sortedInstitutions.length,
        institutionsWithData: sortedInstitutions.filter(inst => inst.totalResponses > 0).length,
        averageResponsesPerInstitution: Math.round(totalSubmissions / sortedInstitutions.length * 10) / 10
      }
    }, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600" // Cache 1 heure
      }
    });

  } catch (error) {
    console.error("Erreur analyse par institution:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
