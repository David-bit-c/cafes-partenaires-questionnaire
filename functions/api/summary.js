// Cloudflare Pages Function pour la synthèse IA avec Google Gemini + OpenAI fallback
// Reproduit la logique de l'endpoint FastAPI /summary

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    
    // Récupération de la préférence admin depuis les paramètres URL
    const url = new URL(request.url);
    const adminPreference = url.searchParams.get('ai_model') || 'auto';
    
    // Vérification des clés API disponibles
    const geminiKey = env.GEMINI_API_KEY;
    const openaiKey = env.OPENAI_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY;
    
    console.log("🔑 Clés API - Gemini:", geminiKey ? "✅ Configurée" : "❌ Manquante");
    console.log("🔑 Clés API - OpenAI:", openaiKey ? "✅ Configurée" : "❌ Manquante");
    console.log("🔑 Clés API - Claude:", claudeKey ? "✅ Configurée" : "❌ Manquante");
    
    if (!geminiKey && !openaiKey && !claudeKey) {
      return new Response(JSON.stringify({
        summary: "",
        summaryError: "Aucune clé API IA trouvée (GEMINI_API_KEY, OPENAI_API_KEY ou CLAUDE_API_KEY requis)."
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

    // Logique de choix du modèle IA avec fallback
    let summary = "";
    let summaryError = "";
    let usedModel = "";

    // Fonction pour appeler Gemini
    async function callGemini() {
      if (!geminiKey) throw new Error("Clé Gemini non disponible");
      
      console.log("🤖 Tentative appel Gemini avec modèle gemini-1.5-flash...");
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
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
        console.log("❌ Erreur Gemini:", geminiResponse.status, errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status} ${errorText}`);
      }
      
      console.log("✅ Gemini réussi");

      const geminiData = await geminiResponse.json();
      return geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur lors de la génération de la synthèse.";
    }

    // Fonction pour appeler OpenAI
    async function callOpenAI() {
      if (!openaiKey) throw new Error("Clé OpenAI non disponible");
      
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-5",
            messages: [
              {
                role: "system",
                content: "Tu es un assistant expert en analyse de données sociales. Réponds en français de manière claire et concise."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        }
      );

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      return openaiData.choices?.[0]?.message?.content || "Erreur lors de la génération de la synthèse.";
    }

    // Fonction pour appeler Claude Sonnet 4
    async function callClaudeSonnet4() {
      if (!claudeKey) throw new Error("Clé Claude non disponible");
      
      console.log("🚀 Tentative appel Claude Sonnet 4 avec modèle claude-3-5-sonnet...");
      const claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          })
        }
      );

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.log("❌ Erreur Claude Sonnet 4:", claudeResponse.status, errorText);
        throw new Error(`Claude Sonnet 4 API error: ${claudeResponse.status} ${errorText}`);
      }

      console.log("✅ Claude Sonnet 4 réussi");
      const claudeData = await claudeResponse.json();
      return claudeData.content?.[0]?.text || "Erreur lors de la génération de la synthèse.";
    }

    // Fonction pour appeler Claude 3.5 Sonnet (fallback)
    async function callClaude() {
      if (!claudeKey) throw new Error("Clé Claude non disponible");
      
      console.log("🤖 Tentative appel Claude 3.5 Sonnet avec modèle claude-3-5-sonnet-20241022...");
      const claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          })
        }
      );

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.log("❌ Erreur Claude 3.5:", claudeResponse.status, errorText);
        throw new Error(`Claude 3.5 API error: ${claudeResponse.status} ${errorText}`);
      }

      console.log("✅ Claude 3.5 réussi");
      const claudeData = await claudeResponse.json();
      return claudeData.content?.[0]?.text || "Erreur lors de la génération de la synthèse.";
    }

    // Logique de choix selon la préférence admin
    try {
      if (adminPreference === 'openai' && openaiKey) {
        // Choix forcé OpenAI
        summary = await callOpenAI();
        usedModel = "OpenAI GPT-5";
      } else if (adminPreference === 'claude-sonnet4' && claudeKey) {
        // Choix forcé Claude Sonnet 4
        summary = await callClaudeSonnet4();
        usedModel = "Anthropic Claude Sonnet 4";
      } else if (adminPreference === 'claude' && claudeKey) {
        // Choix forcé Claude 3.5 Sonnet
        summary = await callClaude();
        usedModel = "Anthropic Claude 3.5 Sonnet";
      } else if (adminPreference === 'gemini' && geminiKey) {
        // Choix forcé Gemini
        summary = await callGemini();
        usedModel = "Google Gemini 1.5 Flash";
      } else {
        // Mode auto : essayer GPT-5 d'abord, puis Claude Sonnet 4, puis Claude 3.5, puis Gemini
        try {
          if (openaiKey) {
            summary = await callOpenAI();
            usedModel = "OpenAI GPT-5";
          } else if (claudeKey) {
            summary = await callClaudeSonnet4();
            usedModel = "Anthropic Claude Sonnet 4";
          } else if (geminiKey) {
            summary = await callGemini();
            usedModel = "Google Gemini 1.5 Flash";
          } else {
            throw new Error("Aucune clé API disponible");
          }
        } catch (primaryError) {
          console.log("API primaire échoué, fallback:", primaryError.message);
          if (openaiKey && claudeKey) {
            // Fallback vers Claude Sonnet 4
            try {
              summary = await callClaudeSonnet4();
              usedModel = "Anthropic Claude Sonnet 4 (fallback)";
            } catch (claudeSonnet4Error) {
              // Fallback vers Claude 3.5 Sonnet
              try {
                summary = await callClaude();
                usedModel = "Anthropic Claude 3.5 Sonnet (fallback)";
              } catch (claudeError) {
                // Dernier recours : Gemini si disponible
                if (geminiKey) {
                  try {
                    summary = await callGemini();
                    usedModel = "Google Gemini 1.5 Flash (fallback)";
                  } catch (geminiError) {
                    throw new Error("Toutes les API ont échoué");
                  }
                } else {
                  throw new Error("Toutes les API ont échoué");
                }
              }
            }
          } else if (openaiKey && geminiKey) {
            // Fallback vers Gemini
            try {
              summary = await callGemini();
              usedModel = "Google Gemini 1.5 Flash (fallback)";
            } catch (fallbackError) {
              throw new Error("Toutes les API ont échoué");
            }
          } else {
            throw new Error("API primaire échoué et pas de fallback disponible");
          }
        }
      }
    } catch (aiError) {
      console.error("Erreur IA:", aiError);
      summaryError = `Erreur lors de la génération de la synthèse (${usedModel || 'modèle IA'}): ${aiError.message}`;
    }

    return new Response(JSON.stringify({
      summary: summary,
      summaryError: summaryError,
      usedModel: usedModel
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

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
