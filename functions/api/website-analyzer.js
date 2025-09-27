// Service d'analyse de sites web pour classification LLM
// functions/api/website-analyzer.js

/**
 * Récupère le contenu d'un site web pour analyse LLM
 * @param {string} domain - Le domaine à analyser (ex: "fase.ch")
 * @returns {Promise<string>} - Contenu textuel du site
 */
export async function fetchWebsiteContent(domain) {
  try {
    console.log(`🔍 Analyse du site: ${domain}`);
    
    const response = await fetch(`https://${domain}`, {
      timeout: 5000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; InstitutionClassifier/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extraire le texte principal
    const title = extractTitle(html);
    const description = extractDescription(html);
    const bodyText = extractBodyText(html);
    
    const content = `${title} | ${description} | ${bodyText}`;
    console.log(`✅ Contenu extrait pour ${domain}: ${content.length} caractères`);
    
    return content;
  } catch (error) {
    console.error(`❌ Erreur récupération ${domain}:`, error.message);
    return `Site ${domain} non accessible: ${error.message}`;
  }
}

/**
 * Extrait le titre de la page
 */
function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

/**
 * Extrait la meta description
 */
function extractDescription(html) {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  return descMatch ? descMatch[1].trim() : '';
}

/**
 * Extrait le texte principal du body
 */
function extractBodyText(html) {
  // Supprimer scripts, styles, et autres éléments non-textuels
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limiter à 2000 caractères pour éviter des prompts trop longs
  return text.substring(0, 2000);
}

/**
 * Normalise un domaine (supprime www, mail, etc.)
 * @param {string} email - Email complet
 * @returns {string} - Domaine principal normalisé
 */
export function extractMainDomain(email) {
  if (!email || typeof email !== 'string') return '';
  
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return '';
  
  // Supprimer les sous-domaines courants
  return domain.replace(/^(www\.|mail\.|smtp\.|webmail\.|imap\.|pop\.)/, '');
}

/**
 * Détermine si un domaine est "suspect" (nécessite classification LLM)
 * @param {string} domain - Domaine à vérifier
 * @returns {boolean} - True si suspect
 */
export function isSuspiciousDomain(domain) {
  const suspiciousPatterns = [
    /\.(org|asso|foundation|fund)$/i,  // Organisations
    /\.(gov|ch)$/i,                    // Gouvernemental
    /\.(edu|school|univ)$/i,           // Éducation
    /^[a-z]+-[a-z]+\.ch$/i             // Format commune (ex: plan-les-ouates.ch)
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(domain));
}

/**
 * Valide une classification LLM
 * @param {Object} classification - Résultat de classification
 * @returns {boolean} - True si valide
 */
export function isValidClassification(classification) {
  const validTypes = [
    'HUG', 'État de Genève', 'Hospice Général', 'FASE', 
    'Communes', 'Associations', 'Entreprises', 'Éducation', 
    'Personnel', 'Autres'
  ];
  
  return classification && 
         classification.institution_type && 
         validTypes.includes(classification.institution_type) &&
         classification.confidence >= 0.5;
}
