// =============================================================================
// SYSTÈME DE SAUVEGARDE AUTOMATIQUE - CLOUDFLARE D1
// Protection contre la perte de données pour CAP Formations
// =============================================================================

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // Génération du timestamp pour le fichier de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-cafes-partenaires-${timestamp}.json`;
    
    // Récupération complète des données
    const stmt = env.DB.prepare(`
      SELECT 
        id,
        created_at,
        data,
        -- Métadonnées pour validation
        length(data) as data_size,
        CASE 
          WHEN json_valid(data) THEN 'valid'
          ELSE 'invalid'
        END as json_status
      FROM submissions 
      ORDER BY created_at ASC
    `);
    
    const result = await stmt.all();
    
    if (!result.success) {
      throw new Error("Échec de la récupération des données pour backup");
    }
    
    // Préparation du backup enrichi
    const backupData = {
      metadata: {
        backup_date: new Date().toISOString(),
        total_records: result.results.length,
        database_version: "1.0",
        source: "cloudflare-d1",
        project: "cap-formations-questionnaire"
      },
      data_validation: {
        valid_json_count: result.results.filter(r => r.json_status === 'valid').length,
        invalid_json_count: result.results.filter(r => r.json_status === 'invalid').length,
        total_data_size: result.results.reduce((sum, r) => sum + (r.data_size || 0), 0)
      },
      submissions: result.results.map(row => ({
        id: row.id,
        created_at: row.created_at,
        data: row.data,
        data_size: row.data_size,
        json_status: row.json_status
      }))
    };
    
    // Retour du backup au format JSON
    return new Response(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${backupFileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error("Erreur lors de la création du backup:", error);
    
    return new Response(JSON.stringify({
      error: "Échec de la création du backup",
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Endpoint pour restauration d'urgence (à utiliser avec précaution)
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const backupData = await request.json();
    
    // Validation du format de backup
    if (!backupData.metadata || !backupData.submissions) {
      throw new Error("Format de backup invalide");
    }
    
    // ATTENTION : Cette opération REMPLACE toutes les données
    // À utiliser uniquement en cas de récupération d'urgence
    
    // Nettoyage de la table existante
    await env.DB.prepare("DELETE FROM submissions").run();
    
    // Restauration des données
    for (const submission of backupData.submissions) {
      const stmt = env.DB.prepare(
        "INSERT INTO submissions (id, created_at, data) VALUES (?, ?, ?)"
      );
      await stmt.bind(submission.id, submission.created_at, submission.data).run();
    }
    
    return new Response(JSON.stringify({
      status: "success",
      message: "Backup restauré avec succès",
      restored_records: backupData.submissions.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Erreur lors de la restauration:", error);
    
    return new Response(JSON.stringify({
      error: "Échec de la restauration",
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
