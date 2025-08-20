// Cloudflare Pages Function pour remplacer l'API FastAPI
// Gère les soumissions de questionnaire avec D1 Database

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Récupération des données du formulaire
    const submissionData = await request.json();
    
    // Validation basique
    if (!submissionData || !submissionData.data) {
      return new Response(JSON.stringify({ 
        error: "Données de soumission manquantes" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Insertion dans la base D1
    const stmt = env.DB.prepare(
      "INSERT INTO submissions (data) VALUES (?)"
    );
    
    const result = await stmt.bind(JSON.stringify(submissionData.data)).run();
    
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
