// Script de migration pour classifier tous les domaines existants
// functions/api/migrate-classifications.js

import { fetchWebsiteContent, extractMainDomain } from './website-analyzer.js';
import { classifyWithLLM, getStaticClassification } from './llm-classifier.js';

export async function onRequestPost(context) {
  try {
    const { env } = context;
    
    console.log("🚀 Début de la migration des classifications...");
    
    // 1. Créer la table si elle n'existe pas
    await createClassificationTable(env);
    
    // 2. Récupérer tous les domaines uniques
    const submissions = await env.DB.prepare("SELECT data FROM submissions").all();
    const domains = new Set();
    
    submissions.results.forEach(sub => {
      try {
        const data = JSON.parse(sub.data);
        if (data.email) {
          const domain = extractMainDomain(data.email);
          if (domain) domains.add(domain);
        }
      } catch (error) {
        console.error("Erreur parsing soumission:", error);
      }
    });
    
    console.log(`📊 ${domains.size} domaines uniques trouvés`);
    
    // 3. Classifier chaque domaine
    let classified = 0;
    let cached = 0;
    let llmUsed = 0;
    let errors = 0;
    
    for (const domain of domains) {
      try {
        // Vérifier si déjà classé
        const existing = await env.DB.prepare(
          "SELECT institution_type FROM institution_classifications WHERE domain = ?"
        ).bind(domain).first();
        
        if (existing) {
          cached++;
          continue;
        }
        
        // Classification
        let institutionType;
        let confidence = 0.8;
        let websiteContent = '';
        
        // Essayer d'abord les règles statiques
        const staticClassification = getStaticClassification(domain);
        if (staticClassification) {
          institutionType = staticClassification;
          confidence = 1.0;
          console.log(`📝 Règle statique: ${domain} → ${institutionType}`);
        } else {
          // Utiliser LLM
          websiteContent = await fetchWebsiteContent(domain);
          const classification = await classifyWithLLM(domain, websiteContent, env);
          institutionType = classification.institution_type;
          confidence = classification.confidence;
          llmUsed++;
          console.log(`🤖 LLM: ${domain} → ${institutionType} (confiance: ${confidence})`);
        }
        
        // Sauvegarder dans le cache
        await env.DB.prepare(`
          INSERT INTO institution_classifications 
          (domain, institution_type, confidence_score, classification_date, website_content, submission_count, last_updated)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `).bind(
          domain,
          institutionType,
          confidence,
          new Date().toISOString(),
          websiteContent,
          new Date().toISOString()
        ).run();
        
        classified++;
        
        // Pause pour éviter de surcharger les APIs
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erreur classification ${domain}:`, error);
        errors++;
      }
    }
    
    const result = {
      success: true,
      message: "Migration terminée",
      stats: {
        totalDomains: domains.size,
        classified: classified,
        cached: cached,
        llmUsed: llmUsed,
        errors: errors
      },
      timestamp: new Date().toISOString()
    };
    
    console.log("✅ Migration terminée:", result);
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur migration:", error);
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

async function createClassificationTable(env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS institution_classifications (
        domain TEXT PRIMARY KEY,
        institution_type TEXT NOT NULL,
        institution_name TEXT,
        confidence_score REAL DEFAULT 0.8,
        classification_date TEXT NOT NULL,
        website_content TEXT,
        submission_count INTEGER DEFAULT 1,
        last_updated TEXT NOT NULL
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_institution_type 
      ON institution_classifications(institution_type)
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_submission_count 
      ON institution_classifications(submission_count)
    `).run();
    
    console.log("✅ Table institution_classifications créée");
  } catch (error) {
    console.error("❌ Erreur création table:", error);
    throw error;
  }
}
