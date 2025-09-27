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
    
    // Utiliser l'API de synthèse existante
    const response = await fetch(`${new URL(env.API_BASE_URL || 'https://cafes-partenaires-questionnaire.pages.dev').origin}/api/synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'gpt-4', // Utiliser GPT-4 pour meilleure précision
        max_tokens: 200
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API synthèse: ${response.status}`);
    }
    
    const result = await response.json();
    const classification = parseLLMResponse(result.synthesis || result.text || '');
    
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
    
    // Communes
    'lancy.ch': 'Communes',
    'plan-les-ouates.ch': 'Communes',
    'carouge.ch': 'Communes',
    'vernier.ch': 'Communes',
    'meyrin.ch': 'Communes',
    
    // Associations
    'for-pro.ch': 'Associations',
    'mbg.ch': 'Associations',
    'sceneactive.ch': 'Associations',
    'radiovostok.ch': 'Associations',
    
    // Entreprises
    'groupe-serbeco.ch': 'Entreprises',
    'fegpac.ch': 'Entreprises',
    
    // Emails personnels
    'gmail.com': 'Personnel',
    'hotmail.com': 'Personnel',
    'yahoo.com': 'Personnel',
    'outlook.com': 'Personnel'
  };
  
  return staticRules[domain] || null;
}
