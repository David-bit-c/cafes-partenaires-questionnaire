// Cloudflare Pages Function pour la synthèse IA avec Google Gemini
// Reproduit la logique de l'endpoint FastAPI /summary

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // Vérification de la clé API Gemini
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        summary: "",
        summaryError: "Aucune clé GEMINI_API_KEY trouvée dans l'environnement."
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Récupération de toutes les soumissions
    const stmt = env.DB.prepare(
      "SELECT * FROM submissions ORDER BY created_at DESC"
    );
    
    const result = await stmt.all();
    
    if (!result.success) {
      throw new Error("Échec de la récupération des données");
    }

    if (result.results.length === 0) {
      return new Response(JSON.stringify({
        summary: "Pas de données de soumission à analyser.",
        summaryError: ""
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Traitement des données - UNIQUEMENT problématiques jeunes
    const youthIssuesData = [];
    for (const submission of result.results) {
      try {
        const parsedData = JSON.parse(submission.data);
        
        // Ne garder que les données sur les problématiques des jeunes + facteurs rupture
        const filteredData = {
          professionalRole: parsedData.professionalRole,
          observedChallenges: parsedData.observedChallenges,
          observedChallengesOther: parsedData.observedChallengesOther,
          challengesRanking: parsedData.challengesRanking,
          challengesHasEmerged: parsedData.challengesHasEmerged,
          emergingChallengesDescription: parsedData.emergingChallengesDescription,
          specializationObstacles: parsedData.specializationObstacles,
          // Nouvelles données facteurs de rupture
          ruptureFactorsFavorable: parsedData.ruptureFactorsFavorable,
          ruptureFactorsNegative: parsedData.ruptureFactorsNegative,
          ruptureFactorsOther: parsedData.ruptureFactorsOther,
          skipRuptureSection: parsedData.skipRuptureSection
        };
        
        youthIssuesData.push(filteredData);
      } catch (e) {
        console.error("Erreur parsing JSON:", submission.id, e);
        continue;
      }
    }

    if (youthIssuesData.length === 0) {
      return new Response(JSON.stringify({
        summary: "Aucune donnée valide à analyser.",
        summaryError: ""
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Conversion des données en format analysable (remplace df.to_string())
    const dataAnalysis = analyzeYouthIssuesData(youthIssuesData);
    
    // Prompt enrichi avec facteurs de rupture et maintien
    const prompt = `
    Tu es un assistant expert en analyse de données sociales.
    Voici les résultats d'un questionnaire adressé à des professionnels du social concernant leur perception des problématiques rencontrées par les jeunes et les facteurs influençant la rupture/maintien en formation.

    **Tâche :**
    1. Analyse les données ci-dessous.
    2. Rédige une synthèse claire et concise (environ 200-250 mots).
    3. Met en évidence :
        - Les problématiques les plus fréquemment observées par les professionnels.
        - L'évolution perçue de ces problématiques (augmentation/émergence).
        - Les obstacles rencontrés dans l'accompagnement professionnel.
        - Les nouvelles problématiques émergentes signalées.
        - **NOUVEAU** : Les facteurs favorisant la reprise de formation après rupture.
        - **NOUVEAU** : Les facteurs augmentant les risques d'abandon en cours de formation.

    **Données à analyser :**
    ${dataAnalysis}

    **Important :** Cette synthèse concerne les problématiques des jeunes ET l'expertise terrain sur les facteurs de rupture/maintien en formation. Ces insights viennent enrichir les statistiques officielles CAP avec des éléments explicatifs concrets.

    **Format de la réponse attendue :**
    Une synthèse rédigée sous forme de texte fluide qui combine :
    1. Les enjeux sociaux des jeunes identifiés
    2. Les leviers d'action pour favoriser le maintien en formation (facteurs favorable/défavorables)
    3. Les recommandations pratiques issues de l'expertise terrain
    `;

    // Appel à l'API Gemini
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        if (errorText.includes("API key not valid")) {
          return new Response(JSON.stringify({
            summary: "",
            summaryError: "Erreur de l'API Gemini : La clé fournie n'est pas valide ou a expiré. Veuillez vérifier la clé et les autorisations sur Google Cloud Console."
          }), {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        throw new Error(`Gemini API error: ${geminiResponse.status} ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur lors de la génération de la synthèse.";

      return new Response(JSON.stringify({
        summary: summary,
        summaryError: ""
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (geminiError) {
      console.error("Erreur Gemini API:", geminiError);
      return new Response(JSON.stringify({
        summary: "",
        summaryError: `Une erreur est survenue lors de la communication avec l'API Gemini : ${geminiError.message}`
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

  } catch (error) {
    console.error("Erreur lors de la génération de la synthèse:", error);
    
    return new Response(JSON.stringify({
      summary: "",
      summaryError: `Erreur serveur lors de la génération de la synthèse: ${error.message}`
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

// Fonction d'analyse focalisée sur les problématiques des jeunes
function analyzeYouthIssuesData(data) {
  let analysis = `Analyse des problématiques des jeunes - ${data.length} réponses de professionnels\n\n`;
  
  // Analyse des rôles professionnels
  const roles = {};
  data.forEach(d => {
    const role = d.professionalRole || 'Non spécifié';
    roles[role] = (roles[role] || 0) + 1;
  });
  analysis += `RÔLES PROFESSIONNELS:\n`;
  Object.entries(roles).forEach(([role, count]) => {
    analysis += `- ${role}: ${count} réponse(s)\n`;
  });
  
  // Analyse des défis observés
  const observedChallenges = {};
  data.forEach(d => {
    if (d.observedChallenges) {
      d.observedChallenges.forEach(challenge => {
        observedChallenges[challenge] = (observedChallenges[challenge] || 0) + 1;
      });
    }
  });
  analysis += `\nDÉFIS LES PLUS OBSERVÉS:\n`;
  Object.entries(observedChallenges).forEach(([challenge, count]) => {
    analysis += `- ${challenge}: ${count} mention(s)\n`;
  });
  
  // Analyse des classements (impact perçu sur échelle 1-7)
  const rankings = {};
  let rankingCount = 0;
  data.forEach(d => {
    if (d.challengesRanking) {
      rankingCount++;
      Object.entries(d.challengesRanking).forEach(([challenge, rating]) => {
        if (!rankings[challenge]) rankings[challenge] = [];
        rankings[challenge].push(Number(rating) || 0);
      });
    }
  });
  
  if (rankingCount > 0) {
    analysis += `\nCLASSEMENT IMPACT PERÇU (échelle 1-7, ${rankingCount} réponses):\n`;
    Object.entries(rankings).forEach(([challenge, ratings]) => {
      const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
      analysis += `- ${challenge}: ${avg}/7 (moyenne)\n`;
    });
  }
  
  // Analyse des problématiques en augmentation
  const emergingChallenges = {};
  data.forEach(d => {
    if (d.challengesHasEmerged) {
      d.challengesHasEmerged.forEach(challenge => {
        emergingChallenges[challenge] = (emergingChallenges[challenge] || 0) + 1;
      });
    }
  });
  analysis += `\nPROBLÉMATIQUES EN AUGMENTATION:\n`;
  Object.entries(emergingChallenges).forEach(([challenge, count]) => {
    analysis += `- ${challenge}: ${count} mention(s)\n`;
  });
  
  // Nouvelles problématiques émergentes (commentaires)
  const newChallenges = data.filter(d => d.emergingChallengesDescription && d.emergingChallengesDescription.trim())
    .map(d => d.emergingChallengesDescription.trim());
  if (newChallenges.length > 0) {
    analysis += `\nNOUVELLES PROBLÉMATIQUES ÉMERGENTES:\n`;
    newChallenges.forEach((desc, i) => {
      analysis += `${i + 1}. "${desc}"\n`;
    });
  }
  
  // Obstacles dans l'accompagnement
  const obstacles = data.filter(d => d.specializationObstacles && d.specializationObstacles.trim())
    .map(d => d.specializationObstacles.trim());
  if (obstacles.length > 0) {
    analysis += `\nOBSTACLES DANS L'ACCOMPAGNEMENT:\n`;
    obstacles.forEach((obstacle, i) => {
      analysis += `${i + 1}. "${obstacle}"\n`;
    });
  }
  
  // Analyse des facteurs de rupture et maintien en formation
  const ruptureResponses = data.filter(d => !d.skipRuptureSection);
  if (ruptureResponses.length > 0) {
    analysis += `\nFACTEURS DE RUPTURE ET MAINTIEN EN FORMATION (${ruptureResponses.length} réponses):\n`;
    
    // Labels pour conversion
    const factorLabels = {
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
    
    // Facteurs favorables reprise
    const favorableFactors = {};
    ruptureResponses.forEach(d => {
      if (d.ruptureFactorsFavorable) {
        d.ruptureFactorsFavorable.forEach(factor => {
          const label = factorLabels[factor] || factor;
          favorableFactors[label] = (favorableFactors[label] || 0) + 1;
        });
      }
    });
    
    if (Object.keys(favorableFactors).length > 0) {
      analysis += `\nFacteurs favorisant la reprise de formation:\n`;
      Object.entries(favorableFactors).forEach(([factor, count]) => {
        analysis += `- ${factor}: ${count} mention(s)\n`;
      });
    }
    
    // Facteurs défavorables maintien
    const negativeFactors = {};
    ruptureResponses.forEach(d => {
      if (d.ruptureFactorsNegative) {
        d.ruptureFactorsNegative.forEach(factor => {
          const label = factorLabels[factor] || factor;
          negativeFactors[label] = (negativeFactors[label] || 0) + 1;
        });
      }
    });
    
    if (Object.keys(negativeFactors).length > 0) {
      analysis += `\nFacteurs augmentant les risques d'abandon:\n`;
      Object.entries(negativeFactors).forEach(([factor, count]) => {
        analysis += `- ${factor}: ${count} mention(s)\n`;
      });
    }
    
    // Autres facteurs identifiés
    const otherFactors = ruptureResponses.filter(d => d.ruptureFactorsOther && d.ruptureFactorsOther.trim())
      .map(d => d.ruptureFactorsOther.trim());
    if (otherFactors.length > 0) {
      analysis += `\nAutres facteurs identifiés par les professionnels:\n`;
      otherFactors.forEach((factor, i) => {
        analysis += `${i + 1}. "${factor}"\n`;
      });
    }
  }
  
  return analysis;
}

// Fonction pour analyser les données (remplace pandas DataFrame.to_string())
function analyzeData(submissions) {
  const analysis = {
    totalSubmissions: submissions.length,
    participation: {},
    roles: {},
    challenges: {},
    satisfaction: {}
  };

  submissions.forEach(sub => {
    // Participation aux cafés
    if (sub.participatedInCafes) {
      analysis.participation[sub.participatedInCafes] = 
        (analysis.participation[sub.participatedInCafes] || 0) + 1;
    }

    // Rôles professionnels
    const role = sub.professionalRole === 'Autre' ? 
      (sub.professionalRoleOther || 'Autre non précisé') : 
      sub.professionalRole;
    if (role) {
      analysis.roles[role] = (analysis.roles[role] || 0) + 1;
    }

    // Défis observés
    if (sub.observedChallenges && Array.isArray(sub.observedChallenges)) {
      sub.observedChallenges.forEach(challenge => {
        analysis.challenges[challenge] = (analysis.challenges[challenge] || 0) + 1;
      });
    }

    // Satisfaction communication
    if (sub.cafesCommunication) {
      analysis.satisfaction[sub.cafesCommunication] = 
        (analysis.satisfaction[sub.cafesCommunication] || 0) + 1;
    }
  });

  // Format similaire à pandas to_string()
  return `
Analyse de ${analysis.totalSubmissions} soumissions:

PARTICIPATION AUX CAFÉS:
${Object.entries(analysis.participation).map(([key, val]) => `${key}: ${val}`).join('\n')}

RÔLES PROFESSIONNELS:
${Object.entries(analysis.roles).map(([key, val]) => `${key}: ${val}`).join('\n')}

DÉFIS OBSERVÉS:
${Object.entries(analysis.challenges).map(([key, val]) => `${key}: ${val}`).join('\n')}

SATISFACTION COMMUNICATION:
${Object.entries(analysis.satisfaction).map(([key, val]) => `${key}: ${val}`).join('\n')}
`.trim();
}

// Gestion CORS pour OPTIONS
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
