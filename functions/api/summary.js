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

    // Traitement des données (remplace pandas)
    const allData = [];
    for (const submission of result.results) {
      try {
        const parsedData = JSON.parse(submission.data);
        allData.push(parsedData);
      } catch (e) {
        console.error("Erreur parsing JSON:", submission.id, e);
        continue;
      }
    }

    if (allData.length === 0) {
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
    const dataAnalysis = analyzeData(allData);
    
    // Prompt identique à FastAPI
    const prompt = `
    Tu es un assistant expert en analyse de données de questionnaires.
    Voici les résultats bruts d'un questionnaire de satisfaction concernant des "cafés partenaires".

    **Tâche :**
    1. Analyse les données ci-dessous.
    2. Rédige une synthèse claire et concise (environ 150-200 mots).
    3. Met en évidence :
        - Les attentes principales des participants.
        - Le niveau de satisfaction général.
        - Les suggestions d'amélioration les plus fréquentes ou pertinentes.

    **Données Brutes :**
    ${dataAnalysis}

    **Format de la réponse attendue :**
    Une synthèse rédigée sous forme de texte fluide.
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
