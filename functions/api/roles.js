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

// Fonction de normalisation pour l'écriture inclusive (même logique que frontend)
function normalizeToInclusive(roleName) {
  if (!roleName || typeof roleName !== 'string') return roleName;
  
  const patterns = {
    'Référent': 'Référent·e',
    'Coordinateur': 'Coordinateur·trice',
    'Formateur': 'Formateur·trice',
    'Conseiller': 'Conseiller·ère',
    'Animateur': 'Animateur·trice',
    'Assistant': 'Assistant·e',
    'Chargé': 'Chargé·e',
    'Directeur': 'Directeur·trice',
    'Éducateur': 'Éducateur·trice',
    'Enseignant': 'Enseignant·e',
    'Infirmier': 'Infirmier·ère',
    'Intervenant': 'Intervenant·e',
    'Maître': 'Maître·sse',
    'Mentor': 'Mentor·e',
    'Représentant': 'Représentant·e',
    'Travailleur': 'Travailleur·euse',
    'Curateur': 'Curateur·trice',
    'Tuteur': 'Tuteur·trice',
    'Responsable': 'Responsable·e',
    'Spécialiste': 'Spécialiste·e',
    'Psychologue': 'Psychologue·e',
    'Psychopédagogue': 'Psychopédagogue·e'
  };
  
  let normalizedRole = roleName.trim();
  
  for (const [masculin, inclusif] of Object.entries(patterns)) {
    if (normalizedRole.startsWith(masculin + ' ')) {
      normalizedRole = normalizedRole.replace(masculin, inclusif);
      break;
    }
  }
  
  return normalizedRole;
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

    // Normaliser le rôle en écriture inclusive
    const normalizedRoleName = normalizeToInclusive(roleName.trim());

    // Vérifier si le rôle existe déjà (avec le nom normalisé)
    const checkStmt = env.DB.prepare(
      "SELECT COUNT(*) as count FROM dynamic_roles WHERE role_name = ?"
    );
    
    const checkResult = await checkStmt.bind(normalizedRoleName).first();
    
    if (checkResult.count > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Rôle déjà existant",
        role: normalizedRoleName
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
    
    const insertResult = await insertStmt.bind(normalizedRoleName).run();
    
    if (!insertResult.success) {
      throw new Error("Échec de l'ajout du rôle");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Rôle ajouté avec succès",
      role: normalizedRoleName
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
