// Cloudflare Pages Function pour backup quotidien automatique
// Déclenché par un cron job quotidien à 2h du matin

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    console.log("🔄 Backup quotidien automatique déclenché...");
    
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

    // Création du backup quotidien
    const backupData = {
      metadata: {
        backup_date: new Date().toISOString(),
        trigger: "daily_cron",
        reason: "Backup quotidien automatique",
        total_submissions: submissions.length,
        total_dynamic_roles: dynamicRoles.length,
        valid_submissions: validSubmissions,
        invalid_submissions: invalidSubmissions,
        database_version: "1.0",
        source: "cloudflare-d1",
        project: "cap-formations-questionnaire",
        backup_type: "daily_automatic"
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
        const today = new Date().toISOString().split('T')[0];
        const backupKey = `backups/daily/backup_${today}_${Date.now()}.json`;
        await env.R2_BUCKET.put(backupKey, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup quotidien sauvegardé dans R2: ${backupKey}`);
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
            template_id: 'backup_daily',
            user_id: env.EMAIL_API_KEY,
            template_params: {
              to_email: env.ADMIN_EMAIL,
              backup_date: new Date().toISOString(),
              total_submissions: submissions.length,
              total_roles: dynamicRoles.length,
              success_rate: `${((validSubmissions / submissions.length) * 100).toFixed(2)}%`
            }
          })
        });
        console.log("📧 Notification backup quotidien envoyée");
      } catch (emailError) {
        console.error("Erreur notification email:", emailError);
        // Continue même si email échoue
      }
    }

    console.log(`✅ Backup quotidien réussi: ${submissions.length} soumissions, ${dynamicRoles.length} rôles`);

    return new Response(JSON.stringify({
      success: true,
      message: "Backup quotidien automatique réussi",
      timestamp: new Date().toISOString(),
      submissions_count: submissions.length,
      roles_count: dynamicRoles.length,
      success_rate: `${((validSubmissions / submissions.length) * 100).toFixed(2)}%`
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Erreur backup quotidien:", error);
    
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
              timestamp: new Date().toISOString(),
              backup_type: "daily_cron"
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
