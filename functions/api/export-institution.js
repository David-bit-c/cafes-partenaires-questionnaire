// functions/api/export-institution.js
// Exportation CSV par institution ou global

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { institution, format = 'csv' } = body;
    
    console.log(`📊 Export ${format} pour institution: ${institution}`);
    
    // Récupérer les données
    const submissionsResult = await env.DB.prepare(
      "SELECT * FROM submissions ORDER BY created_at DESC"
    ).all();
    
    if (!submissionsResult.success) {
      throw new Error("Échec de la récupération des soumissions");
    }
    
    const submissions = submissionsResult.results;
    
    // Classification des institutions (utiliser la logique existante)
    const institutionData = await classifyAndProcessSubmissions(submissions, env);
    
    // Filtrer par institution si spécifiée
    let dataToExport;
    if (institution === 'all') {
      dataToExport = institutionData;
    } else {
      const filteredInstitution = institutionData.find(inst => inst.name === institution);
      dataToExport = filteredInstitution ? [filteredInstitution] : [];
    }
    
    if (dataToExport.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Institution "${institution}" non trouvée`
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Générer le CSV
    const csvContent = generateCSV(dataToExport, institution === 'all');
    
    const filename = institution === 'all' 
      ? `export_toutes_institutions_${new Date().toISOString().split('T')[0]}.csv`
      : `export_${institution.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      }
    });
    
  } catch (error) {
    console.error("Erreur export institution:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Utiliser la même logique de classification que institution-analysis.js
async function classifyAndProcessSubmissions(submissions, env) {
  // Import des fonctions de classification
  const { extractMainDomain } = await import('./website-analyzer.js');
  const { getStaticClassification, getEmailSpecificClassification } = await import('./llm-classifier.js');
  
  // Classification hybride (version simplifiée pour export)
  async function classifyInstitution(email) {
    if (!email || typeof email !== 'string') return 'Autres';
    
    const domain = extractMainDomain(email);
    if (!domain) return 'Autres';
    
    // 1. Classification spécifique par email (pour emails personnels identifiés)
    const emailSpecific = getEmailSpecificClassification(email);
    if (emailSpecific) {
      return emailSpecific;
    }
    
    // 2. Vérifier le cache
    const cached = await env.DB.prepare(
      "SELECT institution_type FROM institution_classifications WHERE domain = ?"
    ).bind(domain).first();
    
    if (cached) {
      return cached.institution_type;
    }
    
    // 3. Règles statiques
    const staticClassification = getStaticClassification(domain);
    if (staticClassification) {
      return staticClassification;
    }
    
    // 4. Fallback
    return 'Autres';
  }
  
  // Traitement des données
  const institutionData = {};
  const totalSubmissions = submissions.length;
  
  for (const submission of submissions) {
    try {
      const data = JSON.parse(submission.data);
      const email = data.email;
      const institution = await classifyInstitution(email);
      
      if (!institutionData[institution]) {
        institutionData[institution] = {
          name: institution,
          totalResponses: 0,
          challenges: {},
          ruptureFactors: {
            favorable: {},
            negative: {}
          },
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
      
      // Facteurs favorables
      if (data.ruptureFactorsFavorable && Array.isArray(data.ruptureFactorsFavorable)) {
        data.ruptureFactorsFavorable.forEach(factor => {
          institutionData[institution].ruptureFactors.favorable[factor] = 
            (institutionData[institution].ruptureFactors.favorable[factor] || 0) + 1;
        });
      }
      
      // Facteurs négatifs
      if (data.ruptureFactorsNegative && Array.isArray(data.ruptureFactorsNegative)) {
        data.ruptureFactorsNegative.forEach(factor => {
          institutionData[institution].ruptureFactors.negative[factor] = 
            (institutionData[institution].ruptureFactors.negative[factor] || 0) + 1;
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
    
    // Défis avec pourcentages
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
    
    processedData[institution] = {
      name: institution,
      totalResponses: total,
      percentageOfTotal: Math.round((total / totalSubmissions) * 100),
      challenges: challengesWithPercentages,
      ruptureFactors: {
        favorable: favorableWithPercentages,
        negative: negativeWithPercentages
      },
      topChallenges: Object.entries(challengesWithPercentages)
        .sort(([,a], [,b]) => b.percentage - a.percentage)
        .slice(0, 5)
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
  
  return Object.values(processedData).sort((a, b) => b.totalResponses - a.totalResponses);
}

function generateCSV(institutions, isGlobal = false) {
  const headers = [
    'Institution',
    'Total_Reponses',
    'Pourcentage_Total',
    'Top_Defi_1',
    'Top_Defi_1_Pourcentage',
    'Top_Defi_2',
    'Top_Defi_2_Pourcentage',
    'Top_Defi_3',
    'Top_Defi_3_Pourcentage',
    'Top_Facteur_Favorable_1',
    'Top_Facteur_Favorable_1_Pourcentage',
    'Top_Facteur_Negatif_1',
    'Top_Facteur_Negatif_1_Pourcentage',
    'Total_Defis_Uniques',
    'Total_Facteurs_Favorables',
    'Total_Facteurs_Negatifs'
  ];
  
  const rows = institutions.map(inst => [
    inst.name,
    inst.totalResponses,
    inst.percentageOfTotal,
    inst.topChallenges[0]?.challenge || '',
    inst.topChallenges[0]?.percentage || 0,
    inst.topChallenges[1]?.challenge || '',
    inst.topChallenges[1]?.percentage || 0,
    inst.topChallenges[2]?.challenge || '',
    inst.topChallenges[2]?.percentage || 0,
    inst.topFavorableFactors[0]?.factor || '',
    inst.topFavorableFactors[0]?.percentage || 0,
    inst.topNegativeFactors[0]?.factor || '',
    inst.topNegativeFactors[0]?.percentage || 0,
    Object.keys(inst.challenges).length,
    Object.keys(inst.ruptureFactors.favorable).length,
    Object.keys(inst.ruptureFactors.negative).length
  ]);
  
  // Ajouter BOM pour Excel UTF-8
  const csvContent = '\uFEFF' + 
    headers.join(',') + '\n' + 
    rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  return csvContent;
}
