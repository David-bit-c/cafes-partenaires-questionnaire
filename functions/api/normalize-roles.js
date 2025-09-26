// Cloudflare Pages Function pour normaliser les rôles existants en écriture inclusive
// ATTENTION: Script de maintenance - à utiliser avec prudence

export async function onRequestPost(context) {
  try {
    const { env } = context;
    
    // Fonction de normalisation (même logique que frontend)
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

    // Récupérer tous les rôles dynamiques
    const stmt = env.DB.prepare("SELECT id, role_name FROM dynamic_roles ORDER BY id ASC");
    const result = await stmt.all();

    if (!result.success) {
      throw new Error("Échec de la récupération des rôles dynamiques");
    }

    const roles = result.results;
    const normalizedRoles = [];
    const updates = [];

    // Normaliser chaque rôle
    for (const role of roles) {
      const normalized = normalizeToInclusive(role.role_name);
      if (normalized !== role.role_name) {
        normalizedRoles.push({
          id: role.id,
          original: role.role_name,
          normalized: normalized
        });
        updates.push({
          id: role.id,
          normalized: normalized
        });
      }
    }

    // Appliquer les mises à jour
    let updateCount = 0;
    for (const update of updates) {
      const updateStmt = env.DB.prepare(
        "UPDATE dynamic_roles SET role_name = ? WHERE id = ?"
      );
      const updateResult = await updateStmt.bind(update.normalized, update.id).run();
      
      if (updateResult.success) {
        updateCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Normalisation terminée: ${updateCount} rôles mis à jour`,
      totalRoles: roles.length,
      normalizedRoles: normalizedRoles,
      updateCount: updateCount
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Erreur normalisation rôles:", error);
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
