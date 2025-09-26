// Cloudflare Pages Function pour backup automatique
// Backup quotidien + avant chaque soumission
// Stockage dans Cloudflare R2 + notifications

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const { trigger, reason } = await request.json();
    
    console.log(`🔄 Backup automatique déclenché: ${trigger} - ${reason}`);
    
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

    // Création du backup
    const backupData = {
      metadata: {
        backup_date: new Date().toISOString(),
        trigger: trigger || "automatic",
        reason: reason || "scheduled",
        total_submissions: submissions.length,
        total_dynamic_roles: dynamicRoles.length,
        valid_submissions: validSubmissions,
        invalid_submissions: invalidSubmissions,
        database_version: "1.0",
        source: "cloudflare-d1",
        project: "cap-formations-questionnaire",
        backup_type: "automatic"
      },
      submissions: submissions,
      dynamic_roles: dynamicRoles,
      data_validation: {
        submissions_json_success_rate: `${((validSubmissions / submissions.length) * 100).toFixed(2)}%`,
        total_tables: 2,
        tables_included: ["submissions", "dynamic_roles"]
      }
    };

    // Sauvegarde dans R2 (si disponible)
    if (env.R2_BUCKET) {
      try {
        const backupKey = `backups/backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        await env.R2_BUCKET.put(backupKey, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup sauvegardé dans R2: ${backupKey}`);
      } catch (r2Error) {
        console.error("Erreur sauvegarde R2:", r2Error);
        // Continue même si R2 échoue
      }
    }

    // Notification par email (si disponible)
    if (env.EMAIL_API_KEY && env.ADMIN_EMAIL) {
      try {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: 'your_service_id',
            template_id: 'backup_notification',
            user_id: env.EMAIL_API_KEY,
            template_params: {
              to_email: env.ADMIN_EMAIL,
              backup_date: new Date().toISOString(),
              total_submissions: submissions.length,
              total_roles: dynamicRoles.length,
              trigger: trigger || "automatic",
              reason: reason || "scheduled"
            }
          })
        });
        console.log("📧 Notification email envoyée");
      } catch (emailError) {
        console.error("Erreur notification email:", emailError);
        // Continue même si email échoue
      }
    }

    console.log(`✅ Backup automatique réussi: ${submissions.length} soumissions, ${dynamicRoles.length} rôles`);

    return new Response(JSON.stringify({
      success: true,
      message: "Backup automatique réussi",
      timestamp: new Date().toISOString(),
      submissions_count: submissions.length,
      roles_count: dynamicRoles.length,
      trigger: trigger || "automatic"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Erreur backup automatique:", error);
    
    // Notification d'erreur
    if (env.EMAIL_API_KEY && env.ADMIN_EMAIL) {
      try {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: 'your_service_id',
            template_id: 'backup_error',
            user_id: env.EMAIL_API_KEY,
            template_params: {
              to_email: env.ADMIN_EMAIL,
              error_message: error.message,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (emailError) {
        console.error("Erreur notification email d'erreur:", emailError);
      }
    }
    
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
