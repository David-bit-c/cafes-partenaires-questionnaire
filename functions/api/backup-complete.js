// Cloudflare Pages Function pour un backup complet incluant les rôles dynamiques
// Backup de toutes les tables : submissions + dynamic_roles

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // Récupération des soumissions
    const submissionsStmt = env.DB.prepare(
      "SELECT * FROM submissions ORDER BY created_at DESC"
    );
    const submissionsResult = await submissionsStmt.all();
    
    if (!submissionsResult.success) {
      throw new Error("Échec de la récupération des soumissions");
    }

    // Récupération des rôles dynamiques
    const rolesStmt = env.DB.prepare(
      "SELECT * FROM dynamic_roles ORDER BY created_at ASC"
    );
    const rolesResult = await rolesStmt.all();
    
    if (!rolesResult.success) {
      throw new Error("Échec de la récupération des rôles dynamiques");
    }

    // Validation des données
    const submissions = submissionsResult.results;
    const dynamicRoles = rolesResult.results;
    
    // Validation JSON des soumissions
    let validSubmissions = 0;
    let invalidSubmissions = 0;
    
    for (const submission of submissions) {
      try {
        JSON.parse(submission.data);
        validSubmissions++;
      } catch (error) {
        invalidSubmissions++;
        console.error(`Soumission invalide ID ${submission.id}:`, error.message);
      }
    }

    // Création du backup complet
    const completeBackup = {
      metadata: {
        backup_date: new Date().toISOString(),
        total_submissions: submissions.length,
        total_dynamic_roles: dynamicRoles.length,
        valid_submissions: validSubmissions,
        invalid_submissions: invalidSubmissions,
        database_version: "1.0",
        source: "cloudflare-d1",
        project: "cap-formations-questionnaire",
        backup_type: "complete"
      },
      submissions: submissions,
      dynamic_roles: dynamicRoles,
      data_validation: {
        submissions_json_success_rate: `${((validSubmissions / submissions.length) * 100).toFixed(2)}%`,
        total_tables: 2,
        tables_included: ["submissions", "dynamic_roles"]
      }
    };

    // Validation finale
    if (submissions.length === 0) {
      console.warn("⚠️ Aucune soumission trouvée");
    }
    
    if (dynamicRoles.length === 0) {
      console.warn("⚠️ Aucun rôle dynamique trouvé");
    }

    console.log(`✅ Backup complet créé: ${submissions.length} soumissions, ${dynamicRoles.length} rôles dynamiques`);

    return new Response(JSON.stringify(completeBackup, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Content-Disposition": `attachment; filename="backup_complet_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création du backup complet:", error);
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
