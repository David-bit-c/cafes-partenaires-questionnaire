// Cloudflare Pages Function pour gérer les rôles professionnels dynamiques
// Endpoint pour récupérer et ajouter des rôles

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // Récupération de tous les rôles dynamiques
    const stmt = env.DB.prepare(
      "SELECT role_name, created_at FROM dynamic_roles ORDER BY created_at DESC"
    );
    
    const result = await stmt.all();
    
    if (!result.success) {
      throw new Error("Échec de la récupération des rôles dynamiques");
    }

    return new Response(JSON.stringify({
      success: true,
      roles: result.results.map(row => row.role_name)
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Erreur récupération rôles:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    
    const { roleName } = await request.json();
    
    if (!roleName || typeof roleName !== 'string' || roleName.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Nom de rôle requis"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const trimmedRoleName = roleName.trim();
    
    // Vérifier si le rôle existe déjà
    const checkStmt = env.DB.prepare(
      "SELECT COUNT(*) as count FROM dynamic_roles WHERE role_name = ?"
    );
    
    const checkResult = await checkStmt.bind(trimmedRoleName).first();
    
    if (checkResult.count > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Rôle déjà existant",
        role: trimmedRoleName
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Ajouter le nouveau rôle
    const insertStmt = env.DB.prepare(
      "INSERT INTO dynamic_roles (role_name, created_at) VALUES (?, datetime('now'))"
    );
    
    const insertResult = await insertStmt.bind(trimmedRoleName).run();
    
    if (!insertResult.success) {
      throw new Error("Échec de l'ajout du rôle");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Rôle ajouté avec succès",
      role: trimmedRoleName
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Erreur ajout rôle:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
