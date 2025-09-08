// Cloudflare Pages Function pour remplacer l'API FastAPI
// Gère les soumissions de questionnaire avec D1 Database

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Récupération des données du formulaire
    const submissionData = await request.json();
    
    // Validation basique
    if (!submissionData) {
      return new Response(JSON.stringify({ 
        error: "Données de soumission manquantes" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validation unicité email pour éviter les doublons
    if (submissionData.email) {
      const emailCheckStmt = env.DB.prepare(
        "SELECT COUNT(*) as count FROM submissions WHERE json_extract(data, '$.email') = ?"
      );
      
      const emailCheckResult = await emailCheckStmt.bind(submissionData.email).first();
      
      if (emailCheckResult && emailCheckResult.count > 0) {
        return new Response(JSON.stringify({ 
          error: "Cet email a déjà été utilisé pour répondre au questionnaire. Si vous êtes un·e collègue, veuillez utiliser votre propre adresse email professionnelle.",
          errorType: "EMAIL_ALREADY_EXISTS"
        }), {
          status: 409, // Conflict
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // Insertion dans la base D1
    const stmt = env.DB.prepare(
      "INSERT INTO submissions (data) VALUES (?)"
    );
    
    const result = await stmt.bind(JSON.stringify(submissionData)).run();
    
    if (result.success) {
      return new Response(JSON.stringify({
        status: "success",
        id: result.meta.last_row_id
      }), {
        status: 201,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } else {
      throw new Error("Échec de l'insertion en base de données");
    }

  } catch (error) {
    console.error("Erreur lors de la création de soumission:", error);
    
    return new Response(JSON.stringify({
      error: "Erreur serveur lors de la sauvegarde",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // Récupération de toutes les soumissions
    const stmt = env.DB.prepare(
      "SELECT * FROM submissions ORDER BY created_at DESC"
    );
    
    const result = await stmt.all();
    
    if (result.success) {
      // Transformation des données pour compatibilité avec le frontend
      const submissions = result.results.map(row => ({
        id: row.id,
        created_at: row.created_at,
        data: row.data // Le frontend se chargera du parsing JSON
      }));

      return new Response(JSON.stringify(submissions), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } else {
      throw new Error("Échec de la récupération des données");
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des soumissions:", error);
    
    return new Response(JSON.stringify({
      error: "Erreur serveur lors de la récupération",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Gestion des requêtes OPTIONS pour CORS
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
