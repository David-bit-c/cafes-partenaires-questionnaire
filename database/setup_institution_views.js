// Script pour appliquer les vues SQL enrichies avec institutions
// À exécuter pour créer toutes les vues d'analyse par institution

/**
 * Script de création des vues SQL pour l'analyse par institution
 * Utilise l'API D1 de Cloudflare pour créer les vues enrichies
 */

// Vous pouvez exécuter ce script de deux manières :
// 1. Via l'interface Cloudflare D1 Console (méthode recommandée)
// 2. Via un endpoint temporaire dans l'application

// =============================================================================
// MÉTHODE 1 : VIA CLOUDFLARE D1 CONSOLE (RECOMMANDÉE)
// =============================================================================

/*
Instructions pour appliquer les vues via l'interface Cloudflare :

1. Connectez-vous à https://dash.cloudflare.com
2. Allez dans "D1" → sélectionnez votre base "cafes-partenaires-db"
3. Cliquez sur l'onglet "Console"
4. Copiez-collez le contenu du fichier create_institution_views.sql
5. Cliquez "Execute"

Les 4 vues suivantes seront créées :
- submissions_with_institutions (vue principale)
- repartition_institutions
- moyennes_par_secteur  
- moyennes_par_institution
- comparaison_public_prive
*/

// =============================================================================
// MÉTHODE 2 : VIA ENDPOINT TEMPORAIRE (POUR AUTOMATISATION)
// =============================================================================

export async function onRequestPost(context) {
  try {
    const { env } = context;
    
    console.log('🚀 Début de la création des vues institutionnelles...');
    
    // Lecture du fichier SQL des vues
    const sqlCommands = [
      // Vue principale submissions_with_institutions
      `CREATE VIEW IF NOT EXISTS submissions_with_institutions AS
      SELECT 
          s.id,
          s.created_at,
          s.data,
          
          -- Extraction email et domaine
          json_extract(s.data, '$.email') as email_complet,
          CASE 
              WHEN json_extract(s.data, '$.email') IS NULL THEN NULL
              WHEN instr(json_extract(s.data, '$.email'), '@') = 0 THEN NULL
              ELSE lower(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))
          END as email_domain,
          
          -- Catégorisation des institutions (version abrégée pour l'endpoint)
          CASE 
              WHEN json_extract(s.data, '$.email') LIKE '%@hug.ch' OR json_extract(s.data, '$.email') LIKE '%@hcuge.ch' 
                  THEN 'HUG - Hôpitaux Universitaires de Genève'
              WHEN json_extract(s.data, '$.email') LIKE '%@ge.ch' OR json_extract(s.data, '$.email') LIKE '%@etat.ge.ch' 
                  THEN 'État de Genève'
              WHEN json_extract(s.data, '$.email') LIKE '%@croix-rouge-ge.ch' 
                  THEN 'Croix-Rouge Genève'
              WHEN json_extract(s.data, '$.email') LIKE '%@oseo-ge.ch' 
                  THEN 'OSEO'
              WHEN json_extract(s.data, '$.email') LIKE '%@astural.org'
                  THEN 'ASTURAL'
              WHEN json_extract(s.data, '$.email') LIKE '%@gmail.com' OR json_extract(s.data, '$.email') LIKE '%@hotmail.com' 
                  THEN 'Email personnel (inconnu)'
              WHEN json_extract(s.data, '$.email') IS NOT NULL 
                  THEN 'Structure non répertoriée'
              ELSE 'Email invalide'
          END as institution_deduite,
          
          -- Indicateur pour inclusion dans statistiques
          CASE 
              WHEN json_extract(s.data, '$.email') LIKE '%@gmail.com' 
                  OR json_extract(s.data, '$.email') LIKE '%@hotmail.com' 
                  OR json_extract(s.data, '$.email') IS NULL
                  THEN 0
              ELSE 1
          END as inclure_stats_institutionnelles,
          
          -- Données clés extraites
          json_extract(s.data, '$.participatedInCafes') as participation_cafes,
          json_extract(s.data, '$.professionalRole') as role_professionnel,
          json_extract(s.data, '$.challengesRanking.sante_mentale') as impact_sante_mentale,
          json_extract(s.data, '$.challengesRanking.precarite') as impact_precarite
      FROM submissions s`,
      
      // Vue répartition institutions
      `CREATE VIEW IF NOT EXISTS repartition_institutions AS
      SELECT 
          institution_deduite,
          COUNT(*) as nombre_reponses,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM submissions_with_institutions WHERE inclure_stats_institutionnelles = 1), 2) as pourcentage
      FROM submissions_with_institutions 
      WHERE inclure_stats_institutionnelles = 1
      GROUP BY institution_deduite
      ORDER BY nombre_reponses DESC`,
      
      // Vue moyennes par institution
      `CREATE VIEW IF NOT EXISTS moyennes_par_institution AS
      SELECT 
          institution_deduite,
          COUNT(*) as nombre_reponses,
          ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
          ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as avg_precarite
      FROM submissions_with_institutions 
      WHERE inclure_stats_institutionnelles = 1
      GROUP BY institution_deduite
      HAVING COUNT(*) >= 2
      ORDER BY nombre_reponses DESC`
    ];
    
    const results = [];
    
    for (const sql of sqlCommands) {
      try {
        const result = await env.DB.prepare(sql).run();
        results.push({
          sql: sql.substring(0, 50) + '...',
          success: result.success,
          meta: result.meta
        });
        console.log(`✅ Vue créée avec succès`);
      } catch (error) {
        console.error(`❌ Erreur création vue:`, error);
        results.push({
          sql: sql.substring(0, 50) + '...',
          success: false,
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({
      message: "Création des vues institutionnelles terminée",
      results: results,
      next_steps: [
        "Utilisez les requêtes du guide queries_guide.md",
        "Testez avec : SELECT * FROM repartition_institutions;",
        "Supprimez cet endpoint après utilisation"
      ]
    }, null, 2), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la création des vues:', error);
    
    return new Response(JSON.stringify({
      error: `Erreur serveur: ${error.message}`,
      recommendation: "Utilisez plutôt l'interface Cloudflare D1 Console"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

// =============================================================================
// INSTRUCTIONS D'UTILISATION
// =============================================================================

/*
🎯 COMMENT UTILISER CE SCRIPT :

OPTION A - Interface Cloudflare (Recommandée) :
1. Dashboard Cloudflare → D1 → cafes-partenaires-db → Console
2. Copier le contenu de create_institution_views.sql
3. Exécuter dans la console

OPTION B - Endpoint temporaire :
1. Déployez ce fichier comme /functions/api/setup-views.js
2. Appelez POST /api/setup-views
3. Supprimez l'endpoint après utilisation

VÉRIFICATION :
Une fois les vues créées, testez avec :
SELECT * FROM repartition_institutions LIMIT 5;

UTILISATION :
Consultez queries_guide.md pour toutes les requêtes d'analyse
*/
