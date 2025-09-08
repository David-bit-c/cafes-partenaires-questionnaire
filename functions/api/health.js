// =============================================================================
// ENDPOINT DE SANTÉ ET MONITORING - CAP FORMATIONS
// Surveillance continue de l'état du système
// =============================================================================

export async function onRequestGet(context) {
  try {
    const { env } = context;
    const startTime = Date.now();
    
    // Tests de santé de la base de données
    const healthChecks = {};
    
    // 1. Test de connectivité D1
    try {
      const pingResult = await env.DB.prepare("SELECT 1 as ping").first();
      healthChecks.database_connectivity = {
        status: pingResult?.ping === 1 ? 'healthy' : 'degraded',
        response_time_ms: Date.now() - startTime
      };
    } catch (error) {
      healthChecks.database_connectivity = {
        status: 'critical',
        error: error.message
      };
    }
    
    // 2. Statistiques de données
    try {
      const statsStart = Date.now();
      const countResult = await env.DB.prepare("SELECT COUNT(*) as total FROM submissions").first();
      const recentResult = await env.DB.prepare(
        "SELECT COUNT(*) as recent FROM submissions WHERE created_at > datetime('now', '-24 hours')"
      ).first();
      
      healthChecks.data_statistics = {
        status: 'healthy',
        total_submissions: countResult?.total || 0,
        last_24h_submissions: recentResult?.recent || 0,
        query_time_ms: Date.now() - statsStart
      };
    } catch (error) {
      healthChecks.data_statistics = {
        status: 'warning',
        error: error.message
      };
    }
    
    // 3. Validation de l'intégrité des données
    try {
      const integrityStart = Date.now();
      const integrityResult = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN json_valid(data) THEN 1 ELSE 0 END) as valid_json,
          SUM(CASE WHEN json_extract(data, '$.email') IS NOT NULL THEN 1 ELSE 0 END) as with_email
        FROM submissions
      `).first();
      
      const validPercentage = integrityResult.total > 0 
        ? (integrityResult.valid_json / integrityResult.total * 100).toFixed(2)
        : 100;
      
      healthChecks.data_integrity = {
        status: validPercentage >= 95 ? 'healthy' : validPercentage >= 85 ? 'warning' : 'critical',
        valid_json_percentage: validPercentage,
        total_records: integrityResult.total,
        records_with_email: integrityResult.with_email,
        check_time_ms: Date.now() - integrityStart
      };
    } catch (error) {
      healthChecks.data_integrity = {
        status: 'error',
        error: error.message
      };
    }
    
    // 4. Test des vues SQL institutions (si installées)
    try {
      const viewsStart = Date.now();
      const viewTest = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='view' AND name LIKE '%institution%'"
      ).first();
      
      healthChecks.sql_views = {
        status: viewTest?.count > 0 ? 'healthy' : 'not_installed',
        views_count: viewTest?.count || 0,
        check_time_ms: Date.now() - viewsStart
      };
    } catch (error) {
      healthChecks.sql_views = {
        status: 'error',
        error: error.message
      };
    }
    
    // Calcul du statut global
    const allStatuses = Object.values(healthChecks).map(check => check.status);
    const globalStatus = allStatuses.includes('critical') ? 'critical' 
                      : allStatuses.includes('warning') ? 'warning'
                      : allStatuses.includes('degraded') ? 'degraded'
                      : 'healthy';
    
    // Réponse complète
    const healthReport = {
      timestamp: new Date().toISOString(),
      global_status: globalStatus,
      total_check_time_ms: Date.now() - startTime,
      checks: healthChecks,
      recommendations: generateRecommendations(healthChecks)
    };
    
    // Code de statut HTTP basé sur la santé globale
    const httpStatus = globalStatus === 'critical' ? 503 
                     : globalStatus === 'warning' || globalStatus === 'degraded' ? 207
                     : 200;
    
    return new Response(JSON.stringify(healthReport, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error("Erreur critique lors du health check:", error);
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      global_status: 'critical',
      error: "Health check failed",
      details: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Génération de recommandations basées sur l'état du système
function generateRecommendations(checks) {
  const recommendations = [];
  
  // Vérifications de la base de données
  if (checks.database_connectivity?.status !== 'healthy') {
    recommendations.push({
      priority: 'critical',
      message: 'Problème de connectivité base de données - Vérifier Cloudflare D1',
      action: 'Contacter support Cloudflare si persistant'
    });
  }
  
  // Intégrité des données
  if (checks.data_integrity?.status === 'critical') {
    recommendations.push({
      priority: 'high',
      message: 'Intégrité des données compromise - Corruption possible',
      action: 'Créer backup immédiat et investiguer'
    });
  } else if (checks.data_integrity?.status === 'warning') {
    recommendations.push({
      priority: 'medium',
      message: 'Quelques enregistrements JSON invalides détectés',
      action: 'Vérifier les soumissions récentes'
    });
  }
  
  // Vues SQL
  if (checks.sql_views?.status === 'not_installed') {
    recommendations.push({
      priority: 'low',
      message: 'Vues SQL institutions non installées',
      action: 'Exécuter create_institution_views.sql si analyses par institution requises'
    });
  }
  
  // Performance
  const totalTime = checks.database_connectivity?.response_time_ms || 0;
  if (totalTime > 1000) {
    recommendations.push({
      priority: 'medium',
      message: 'Temps de réponse base de données élevé',
      action: 'Vérifier charge et optimiser requêtes si nécessaire'
    });
  }
  
  return recommendations;
}
