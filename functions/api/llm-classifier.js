// Service de classification LLM pour institutions
// functions/api/llm-classifier.js

import { isValidClassification } from './website-analyzer.js';

/**
 * Classe une institution en utilisant un LLM
 * @param {string} domain - Domaine à classifier
 * @param {string} websiteContent - Contenu du site web
 * @param {Object} env - Environnement Cloudflare
 * @returns {Promise<Object>} - Classification avec confiance
 */
export async function classifyWithLLM(domain, websiteContent, env) {
  try {
    console.log(`🤖 Classification LLM pour: ${domain}`);
    
    const prompt = buildClassificationPrompt(domain, websiteContent);
    
    // Appel direct aux APIs IA (pas via l'API summary qui a sa propre logique)
    const classification = await callLLMDirectly(prompt, env);
    
    if (isValidClassification(classification)) {
      console.log(`✅ Classification réussie pour ${domain}: ${classification.institution_type} (confiance: ${classification.confidence})`);
      return classification;
    } else {
      console.warn(`⚠️ Classification invalide pour ${domain}:`, classification);
      return { institution_type: 'Autres', confidence: 0.3 };
    }
    
  } catch (error) {
    console.error(`❌ Erreur classification LLM pour ${domain}:`, error);
    return { institution_type: 'Autres', confidence: 0.1 };
  }
}

/**
 * Appel direct aux APIs IA pour classification
 */
async function callLLMDirectly(prompt, env) {
  const openaiKey = env.OPENAI_API_KEY;
  const claudeKey = env.CLAUDE_API_KEY;
  const geminiKey = env.GEMINI_API_KEY;
  
  // Essayer OpenAI en premier
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return parseLLMResponse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('Erreur OpenAI:', error);
    }
  }
  
  // Fallback vers Claude
  if (claudeKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return parseLLMResponse(data.content[0].text);
      }
    } catch (error) {
      console.error('Erreur Claude:', error);
    }
  }
  
  // Fallback vers Gemini
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return parseLLMResponse(data.candidates[0].content.parts[0].text);
      }
    } catch (error) {
      console.error('Erreur Gemini:', error);
    }
  }
  
  throw new Error('Aucune API IA disponible');
}

/**
 * Construit le prompt pour la classification LLM
 */
function buildClassificationPrompt(domain, websiteContent) {
  return `Analyse ce site web et classe l'institution par sa MISSION:

Site: ${domain}
Contenu: ${websiteContent}

Classe dans une de ces catégories selon l'ACTIVITÉ PRINCIPALE:
- "HUG" (hôpital, santé publique, centre hospitalier)
- "État de Genève" (administration cantonale, services publics)
- "Hospice Général" (institution sociale publique, aide sociale)
- "FASE" (fondation sociale, animation socioculturelle, maisons de quartier)
- "Communes" (collectivités locales, municipalités genevoises)
- "Associations" (structures associatives professionnelles, ONG)
- "Entreprises" (structures commerciales, sociétés privées)
- "Éducation" (formation, école, centre de formation)
- "Personnel" (emails personnels: gmail, hotmail, yahoo)
- "Autres" (non classé, incertain)

IMPORTANT: 
- Analyse la MISSION et l'ACTIVITÉ, pas le statut public/privé
- Les fondations philanthropiques = catégorie selon leur mission
- Les associations professionnelles = "Associations"
- Les entreprises commerciales = "Entreprises"

Réponds UNIQUEMENT en JSON valide:
{"institution_type": "FASE", "confidence": 0.95}`;
}

/**
 * Parse la réponse LLM en objet de classification
 */
function parseLLMResponse(responseText) {
  try {
    // Essayer de parser directement le JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: chercher des patterns dans le texte
    const typeMatch = responseText.match(/"institution_type":\s*"([^"]+)"/);
    const confidenceMatch = responseText.match(/"confidence":\s*([0-9.]+)/);
    
    if (typeMatch) {
      return {
        institution_type: typeMatch[1],
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8
      };
    }
    
    // Dernier recours: chercher des mots-clés
    const keywords = {
      'hôpital': 'HUG',
      'hospital': 'HUG',
      'santé': 'HUG',
      'health': 'HUG',
      'état': 'État de Genève',
      'canton': 'État de Genève',
      'administration': 'État de Genève',
      'hospice': 'Hospice Général',
      'aide sociale': 'Hospice Général',
      'fase': 'FASE',
      'animation': 'FASE',
      'socioculturel': 'FASE',
      'commune': 'Communes',
      'municipalité': 'Communes',
      'association': 'Associations',
      'ong': 'Associations',
      'entreprise': 'Entreprises',
      'société': 'Entreprises',
      'formation': 'Éducation',
      'école': 'Éducation',
      'gmail': 'Personnel',
      'hotmail': 'Personnel',
      'yahoo': 'Personnel'
    };
    
    const lowerText = responseText.toLowerCase();
    for (const [keyword, type] of Object.entries(keywords)) {
      if (lowerText.includes(keyword)) {
        return { institution_type: type, confidence: 0.7 };
      }
    }
    
    return { institution_type: 'Autres', confidence: 0.3 };
    
  } catch (error) {
    console.error('Erreur parsing réponse LLM:', error);
    return { institution_type: 'Autres', confidence: 0.1 };
  }
}

/**
 * Règles statiques pour domaines connus (évite les appels LLM)
 */
export function getStaticClassification(domain) {
  const staticRules = {
    // HUG
    'hug.ch': 'HUG',
    'hcuge.ch': 'HUG',
    
    // État de Genève
    'ge.ch': 'État de Genève',
    'etat.ge.ch': 'État de Genève',
    
    // Hospice Général
    'hospicegeneral.ch': 'Hospice Général',
    
    // FASE
    'fase.ch': 'FASE',
    'fase.cj': 'FASE',  // Erreur de frappe commune
    
    // Communes
    'lancy.ch': 'Communes',
    'plan-les-ouates.ch': 'Communes',
    'carouge.ch': 'Communes',
    'vernier.ch': 'Communes',
    'meyrin.ch': 'Communes',
    'geneve.ch': 'Communes',  // Ville de Genève
    
    // Associations
    'for-pro.ch': 'Associations',
    'mbg.ch': 'Associations',
    'sceneactive.ch': 'Associations',
    'radiovostok.ch': 'Associations',
    // Fondations et entreprises sociales (ajout 16/11/2025)
    'filinea.ch': 'Associations',  // Entreprise sociale à but non lucratif
    'pro-geneve.ch': 'Associations',  // Fondation réinsertion d'intérêt public
    'paco-web.ch': 'Associations',
    'phenix.ch': 'Associations',  // Fondation Phénix - santé mentale
    
    // Entreprises
    'groupe-serbeco.ch': 'Entreprises',
    'fegpac.ch': 'Entreprises',
    // Entreprises du bâtiment et construction (ajout 16/11/2025)
    'righi-sa.ch': 'Entreprises',
    'menuiserie-legna.ch': 'Entreprises',
    'entreprisemontefusco.ch': 'Entreprises',
    'mazzoli.ch': 'Entreprises',
    'belmontecarrelages.ch': 'Entreprises',
    'storemania.ch': 'Entreprises',
    'gatto-sa.ch': 'Entreprises',
    'stormatic.ch': 'Entreprises',
    'gri-sa.ch': 'Entreprises',
    'macullo.ch': 'Entreprises',
    'fragastores.ch': 'Entreprises',
    'hts.swiss': 'Entreprises',
    'menuiserie-fabbi.com': 'Entreprises',
    'jfarina.ch': 'Entreprises',
    'modulancy.ch': 'Entreprises',
    'm-nobs.ch': 'Entreprises',
    'piretti.ch': 'Entreprises',
    'caragnano.ch': 'Entreprises',
    'cuivretout.ch': 'Entreprises',
    'bagattinisa.ch': 'Entreprises',
    'gpisa.ch': 'Entreprises',
    'nobile.ch': 'Entreprises',
    'fretcargo.com': 'Entreprises',
    'ch.dsv.com': 'Entreprises',
    
    // Emails personnels
    'gmail.com': 'Personnel',
    'hotmail.com': 'Personnel',
    'yahoo.com': 'Personnel',
    'outlook.com': 'Personnel'
  };
  
  return staticRules[domain] || null;
}
