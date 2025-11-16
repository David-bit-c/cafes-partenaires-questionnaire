// API pour vider le cache des 30 domaines reclassifiés
// Permet de forcer la reclassification avec les nouvelles règles statiques

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Sécurité : vérifier le code d'accès
    const body = await request.json();
    const accessCode = body.code;
    
    if (accessCode !== 'CAP_CLEAR_CACHE_2025') {
      return new Response(JSON.stringify({ 
        error: 'Code d\'accès invalide' 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log('🗑️ Nettoyage du cache pour les 30 domaines reclassifiés...');
    
    // Liste des 30 domaines à reclassifier
    const domainsToReclassify = [
      // Phase 1 : Entreprises (24 domaines)
      'righi-sa.ch',
      'menuiserie-legna.ch',
      'entreprisemontefusco.ch',
      'mazzoli.ch',
      'belmontecarrelages.ch',
      'storemania.ch',
      'gatto-sa.ch',
      'stormatic.ch',
      'gri-sa.ch',
      'macullo.ch',
      'fragastores.ch',
      'hts.swiss',
      'menuiserie-fabbi.com',
      'jfarina.ch',
      'modulancy.ch',
      'm-nobs.ch',
      'piretti.ch',
      'caragnano.ch',
      'cuivretout.ch',
      'bagattinisa.ch',
      'gpisa.ch',
      'nobile.ch',
      'fretcargo.com',
      'ch.dsv.com',
      
      // Phase 2 : Associations (4 domaines)
      'filinea.ch',
      'pro-geneve.ch',
      'paco-web.ch',
      'phenix.ch',
      
      // Phase 2 : Communes (1 domaine)
      'geneve.ch',
      
      // Phase 2 : FASE (1 domaine)
      'fase.cj'
    ];
    
    let deletedCount = 0;
    let errors = 0;
    const results = [];
    
    // Supprimer chaque domaine du cache
    for (const domain of domainsToReclassify) {
      try {
        const result = await env.DB.prepare(
          "DELETE FROM institution_classifications WHERE domain = ?"
        ).bind(domain).run();
        
        if (result.success) {
          deletedCount++;
          results.push({ domain, status: 'deleted' });
          console.log(`✅ Cache vidé pour: ${domain}`);
        } else {
          errors++;
          results.push({ domain, status: 'error', message: 'Failed to delete' });
          console.log(`⚠️ Erreur pour: ${domain}`);
        }
      } catch (error) {
        errors++;
        results.push({ domain, status: 'error', message: error.message });
        console.error(`❌ Erreur pour ${domain}:`, error);
      }
    }
    
    const summary = {
      success: true,
      message: 'Cache nettoyé avec succès',
      totalDomains: domainsToReclassify.length,
      deletedCount,
      errors,
      timestamp: new Date().toISOString(),
      nextStep: 'Les domaines seront reclassifiés automatiquement lors de la prochaine requête à /api/institution-analysis'
    };
    
    console.log('✅ Nettoyage terminé:', summary);
    
    return new Response(JSON.stringify({
      ...summary,
      details: results
    }, null, 2), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du cache:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Erreur lors du nettoyage du cache",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Gestion CORS
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

