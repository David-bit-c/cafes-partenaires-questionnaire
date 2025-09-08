// Extracteur et catégoriseur d'institutions basé sur les domaines email
// Système extensible pour l'écosystème genevois d'accompagnement des jeunes

/**
 * Base de données des institutions partenaires CAP Formations
 * Organisée par secteurs d'activité
 */
const KNOWN_INSTITUTIONS = {
  // ========== SECTEUR SANTÉ & PSYCHO-SOCIAL ==========
  
  // HUG - Hôpitaux Universitaires de Genève
  'hug.ch': {
    name: 'HUG - Hôpitaux Universitaires de Genève',
    sector: 'Santé publique',
    type: 'Établissement hospitalier public',
    programs: ['JADE', 'UPJA', 'UAP', 'CCEAF', 'CASAA', 'Malatavie', 'UPDM', 'CAMSCO']
  },
  'hcuge.ch': {
    name: 'HUG - Hôpitaux Universitaires de Genève',
    sector: 'Santé publique',
    type: 'Établissement hospitalier public',
    programs: ['JADE', 'UPJA', 'Malatavie', 'CAMSCO']
  },
  
  // Structures santé mentale spécialisées
  'paidos.org': {
    name: 'PAÏDOS',
    sector: 'Santé mentale spécialisée',
    type: 'Organisation spécialisée',
    programs: ['Accompagnement psycho-social']
  },
  'trajets.org': {
    name: 'MOVE ON! (Trajets)',
    sector: 'Santé mentale spécialisée',
    type: 'Organisation spécialisée',
    programs: ['Accompagnement psycho-social']
  },
  'phenix.ch': {
    name: 'Fondation Phénix',
    sector: 'Addictions',
    type: 'Fondation spécialisée',
    programs: ['Prévention addictions']
  },
  'carrefouraddictions.ch': {
    name: 'Carrefour addictions Genève',
    sector: 'Addictions',
    type: 'Centre spécialisé',
    programs: ['Accompagnement addictions']
  },
  'planningsuisse-romand.ch': {
    name: 'Planning familial Genève',
    sector: 'Santé reproductive',
    type: 'Association',
    programs: ['Planning familial']
  },
  'centrelavi-ge.ch': {
    name: 'Centre LAVI',
    sector: 'Aide aux victimes',
    type: 'Centre spécialisé',
    programs: ['Aide aux victimes']
  },

  // ========== SERVICES PUBLICS CANTONAUX ==========
  'ge.ch': {
    name: 'État de Genève',
    sector: 'Services publics cantonaux',
    type: 'Administration cantonale',
    programs: ['SSEJ', 'BCAS']
  },
  'etat.ge.ch': {
    name: 'État de Genève',
    sector: 'Services publics cantonaux',
    type: 'Administration cantonale',
    programs: ['SSEJ']
  },

  // ========== GRANDES ORGANISATIONS MULTI-PROGRAMMES ==========
  
  // Croix-Rouge Genève
  'croix-rouge-ge.ch': {
    name: 'Croix-Rouge Genève',
    sector: 'Humanitaire et social',
    type: 'Organisation humanitaire',
    programs: ['For Me', 'PROPULSE', 'INSERRES']
  },
  
  // OSEO
  'oseo-ge.ch': {
    name: 'OSEO',
    sector: 'Socio-éducatif',
    type: 'Fondation',
    programs: ['For Me', 'Cap Emploi', 'Solidaire', 'ConneXion']
  },
  
  // ASTURAL
  'astural.org': {
    name: 'ASTURAL',
    sector: 'Socio-éducatif',
    type: 'Association',
    programs: ['Atelier ABC', 'Chevrens', 'A2Mains']
  },
  'accroche.ch': {
    name: 'ASTURAL - A2Mains',
    sector: 'Socio-éducatif',
    type: 'Association',
    programs: ['A2Mains']
  },

  // ========== SOUTIEN SCOLAIRE & ORIENTATION ==========
  'ararep.ch': {
    name: 'ARA - Association des Répétitoires Ajeta',
    sector: 'Soutien scolaire',
    type: 'Association',
    programs: ['Répétitoires']
  },
  'uog.ch': {
    name: 'UOG - Université Ouvrière de Genève',
    sector: 'Formation',
    type: 'Association',
    programs: ['Atelier Jeunes']
  },
  'kultura.ch': {
    name: 'KULTURA - Maison Kultura',
    sector: 'Socio-culturel',
    type: 'Association',
    programs: ['Espace Jeunes Espoir']
  },
  'nasca.ch': {
    name: 'For Me - Nasca',
    sector: 'Formation',
    type: 'Association',
    programs: ['For Me']
  },

  // ========== INNOVATION NUMÉRIQUE & INSERTION ==========
  'nolimit.support': {
    name: 'NO LIMIT',
    sector: 'Innovation numérique',
    type: 'Structure innovante',
    programs: ['Ateliers numériques']
  },
  'liftnolimit.com': {
    name: 'LIFT',
    sector: 'Innovation numérique',
    type: 'Entreprise sociale',
    programs: ['Insertion numérique']
  },
  'yojoa.co': {
    name: 'Yojoa',
    sector: 'Innovation sociale',
    type: 'Structure innovante',
    programs: ['Accompagnement jeunes']
  },

  // ========== STRUCTURES ÉDUCATIVES & SOCIALES ==========
  'foj.ch': {
    name: 'FOJ - Foyers',
    sector: 'Éducatif spécialisé',
    type: 'Fondation',
    programs: ['Foyers', 'Ateliers']
  },
  'epi-ge.ch': {
    name: 'EPI',
    sector: 'Éducatif spécialisé',
    type: 'Association',
    programs: ['Accompagnement éducatif']
  },
  'sceneactive.ch': {
    name: 'Scène Active',
    sector: 'Socio-culturel',
    type: 'Association',
    programs: ['Animation socioculturelle']
  },
  'qualife.ch': {
    name: 'Qualife Fondation',
    sector: 'Formation professionnelle',
    type: 'Fondation',
    programs: ['Qualification professionnelle']
  },
  'comptabilis.ch': {
    name: 'Comptabilis',
    sector: 'Formation professionnelle',
    type: 'Association',
    programs: ['Formation comptabilité']
  },
  'jeunesparents.ch': {
    name: 'JeunesParents',
    sector: 'Accompagnement familial',
    type: 'Association',
    programs: ['Soutien parents jeunes']
  },
  'pacifique.ch': {
    name: 'Association Pacifique',
    sector: 'Médiation',
    type: 'Association',
    programs: ['Médiation et prévention']
  },
  'babvia.ch': {
    name: 'BAB-VIA',
    sector: 'Socio-éducatif',
    type: 'Association',
    programs: ['Accompagnement jeunes']
  },
  'capemploi.ch': {
    name: 'Cap Emploi',
    sector: 'Insertion professionnelle',
    type: 'Service OSEO',
    programs: ['Accompagnement emploi']
  },
  'la-loco.ch': {
    name: 'La Loco',
    sector: 'Animation socioculturelle',
    type: 'Association',
    programs: ['Animation quartiers']
  },
  'gardezlelien.ch': {
    name: 'Gardez le Lien',
    sector: 'Prévention',
    type: 'Association',
    programs: ['Prévention radicalisation']
  },
  'jcj.ch': {
    name: 'Juris Conseil Junior',
    sector: 'Conseil juridique',
    type: 'Association',
    programs: ['Conseil juridique jeunes']
  },
  'astrame.ch': {
    name: 'Fondation Astrame',
    sector: 'Handicap',
    type: 'Fondation',
    programs: ['Accompagnement handicap']
  },
  'paco-web.ch': {
    name: 'PAC(O)',
    sector: 'Artistique',
    type: 'Association',
    programs: ['Projets artistiques collaboratifs']
  },
  'ortra-sante-social.ch': {
    name: 'ORTRA Santé Social - Le 28',
    sector: 'Formation professionnelle',
    type: 'Organisation du travail',
    programs: ['Formation santé-social']
  },
  'camarada.ch': {
    name: 'Camarada',
    sector: 'Migration',
    type: 'Association',
    programs: ['Femmes migrantes']
  },
  'labarje.ch': {
    name: 'La Barje',
    sector: 'Socio-culturel',
    type: 'Association',
    programs: ['Animation socioculturelle']
  },
  'amakbro.ch': {
    name: 'Ama-K Bro',
    sector: 'Socio-culturel',
    type: 'Association',
    programs: ['Animation communautaire']
  },
  'lacarteblanche.ch': {
    name: 'La Carte Blanche',
    sector: 'Insertion',
    type: 'Association',
    programs: ['Accompagnement insertion']
  },
  'lorangerie.ch': {
    name: 'Orangerie',
    sector: 'Socio-culturel',
    type: 'Association',
    programs: ['Animation socioculturelle']
  },
  'associationdecouvrir.ch': {
    name: 'Association Découvrir',
    sector: 'Découverte professionnelle',
    type: 'Association',
    programs: ['Orientation professionnelle']
  },
  'autonomia-ge.ch': {
    name: 'Autonomia',
    sector: 'Autonomie',
    type: 'Association',
    programs: ['Développement autonomie']
  },
  'fase.ch': {
    name: 'FASe',
    sector: 'Animation socioculturelle',
    type: 'Fondation',
    programs: ['Animation socioculturelle']
  },
  'amig-ge.ch': {
    name: 'AMIG',
    sector: 'Migration',
    type: 'Association',
    programs: ['Aide aux migrants']
  },
  'csp.ch': {
    name: 'CSP - Centre Social Protestant',
    sector: 'Action sociale',
    type: 'Fondation religieuse',
    programs: ['Action sociale', 'La Renfile']
  },
  'caritas-ge.ch': {
    name: 'Caritas Genève',
    sector: 'Action sociale',
    type: 'Organisation caritative',
    programs: ['Voie 2']
  },
  'realise.ch': {
    name: 'Réalise',
    sector: 'Formation numérique',
    type: 'Association',
    programs: ['Stages et formation web']
  },
  'evase.ch': {
    name: 'EVASE - Trait d\'Union',
    sector: 'Accompagnement spécialisé',
    type: 'Association',
    programs: ['Trait d\'Union']
  },
  'viensvisetdeviens.org': {
    name: 'Viens Vis et Deviens',
    sector: 'Développement personnel',
    type: 'Association',
    programs: ['Développement personnel']
  },
  'radiovostok.ch': {
    name: 'Radio Vostok - Ça dit quoi ?',
    sector: 'Médias communautaires',
    type: 'Association',
    programs: ['Radio jeunes']
  },
  'ozinspire.ch': {
    name: 'Ozinspire',
    sector: 'Innovation sociale',
    type: 'Association',
    programs: ['Innovation sociale']
  },
  'lesateliersnumeriques.ch': {
    name: 'Les Ateliers du Social Numérique',
    sector: 'Innovation numérique',
    type: 'Association',
    programs: ['Mission Minecraft']
  },
  'sportimpact.ch': {
    name: 'Sport Impact',
    sector: 'Sport thérapeutique',
    type: 'Association',
    programs: ['Sport thérapie']
  },
  'monavenir.ch': {
    name: 'Mon Avenir',
    sector: 'Orientation',
    type: 'Association',
    programs: ['Orientation professionnelle']
  },
  'laudace.ch': {
    name: 'L\'Audace',
    sector: 'Insertion',
    type: 'Association',
    programs: ['Accompagnement insertion']
  },
  'certis.ch': {
    name: 'CERTIS - Jovens',
    sector: 'Formation',
    type: 'Centre de formation',
    programs: ['Jovens']
  },
  'trajectoires.ch': {
    name: 'Trajectoires',
    sector: 'Accompagnement',
    type: 'Association',
    programs: ['Accompagnement personnalisé']
  },
  'urban-mediation.ch': {
    name: 'Urban Médiation',
    sector: 'Médiation urbaine',
    type: 'Association',
    programs: ['Médiation urbaine']
  },
  'argonautes.ch': {
    name: 'Argonautes',
    sector: 'Accompagnement',
    type: 'Association',
    programs: ['Accompagnement jeunes']
  },

  // ========== COMMUNES GENEVOISES ==========
  'lancy.ch': {
    name: 'Commune de Lancy',
    sector: 'Services communaux',
    type: 'Administration communale',
    programs: ['Contact Emploi Jeunes']
  }
};

/**
 * Domaines d'emails personnels à exclure des statistiques institutionnelles
 */
const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'yahoo.fr',
  'bluewin.ch',
  'sunrise.ch',
  'swissonline.ch',
  'vtx.ch',
  'green.ch',
  'hispeed.ch'
];

/**
 * Extrait le domaine d'un email
 * @param {string} email - Adresse email
 * @returns {string|null} - Domaine extrait ou null
 */
export const extractDomain = (email) => {
  if (!email || typeof email !== 'string') return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};

/**
 * Détermine si un domaine est un email personnel
 * @param {string} domain - Domaine à vérifier
 * @returns {boolean} - True si email personnel
 */
export const isPersonalEmail = (domain) => {
  return PUBLIC_EMAIL_DOMAINS.includes(domain);
};

/**
 * Catégorise une institution basée sur son domaine email
 * @param {string} email - Adresse email complète
 * @returns {Object} - Informations sur l'institution
 */
export const categorizeInstitution = (email) => {
  const domain = extractDomain(email);
  
  if (!domain) {
    return {
      email_domain: null,
      institution_deduite: 'Email invalide',
      secteur_activite: null,
      type_structure: null,
      programmes: null,
      includeInStats: false,
      status: 'error'
    };
  }

  // Vérification email personnel
  if (isPersonalEmail(domain)) {
    return {
      email_domain: domain,
      institution_deduite: 'Email personnel (inconnu)',
      secteur_activite: null,
      type_structure: 'Personnel',
      programmes: null,
      includeInStats: false,
      status: 'personal'
    };
  }

  // Recherche dans la base des institutions connues
  const institutionInfo = KNOWN_INSTITUTIONS[domain];
  
  if (institutionInfo) {
    return {
      email_domain: domain,
      institution_deduite: institutionInfo.name,
      secteur_activite: institutionInfo.sector,
      type_structure: institutionInfo.type,
      programmes: institutionInfo.programs ? institutionInfo.programs.join(', ') : null,
      includeInStats: true,
      status: 'known'
    };
  }

  // Institution inconnue - système extensible
  return {
    email_domain: domain,
    institution_deduite: domain,
    secteur_activite: 'À catégoriser',
    type_structure: 'Structure non répertoriée',
    programmes: null,
    includeInStats: true,
    status: 'unknown'
  };
};

/**
 * Analyse un ensemble de soumissions pour extraire les informations institutionnelles
 * @param {Array} submissions - Array des soumissions
 * @returns {Object} - Analyse des institutions
 */
export const analyzeInstitutions = (submissions) => {
  const analysis = {
    total: submissions.length,
    byStatus: { known: 0, unknown: 0, personal: 0, error: 0 },
    bySector: {},
    byType: {},
    unknownDomains: new Set(),
    institutionStats: {}
  };

  submissions.forEach(submission => {
    if (!submission.data?.email) return;

    const institutionInfo = categorizeInstitution(submission.data.email);
    
    // Comptage par statut
    analysis.byStatus[institutionInfo.status]++;
    
    // Secteurs (uniquement institutions valides)
    if (institutionInfo.secteur_activite && institutionInfo.includeInStats) {
      analysis.bySector[institutionInfo.secteur_activite] = 
        (analysis.bySector[institutionInfo.secteur_activite] || 0) + 1;
    }
    
    // Types de structures
    if (institutionInfo.type_structure) {
      analysis.byType[institutionInfo.type_structure] = 
        (analysis.byType[institutionInfo.type_structure] || 0) + 1;
    }
    
    // Domaines inconnus pour extension future
    if (institutionInfo.status === 'unknown') {
      analysis.unknownDomains.add(institutionInfo.email_domain);
    }
    
    // Statistiques par institution
    if (institutionInfo.includeInStats) {
      const instName = institutionInfo.institution_deduite;
      analysis.institutionStats[instName] = 
        (analysis.institutionStats[instName] || 0) + 1;
    }
  });

  return {
    ...analysis,
    unknownDomains: Array.from(analysis.unknownDomains),
    coverageRate: (analysis.byStatus.known / analysis.total) * 100
  };
};

/**
 * Enrichit les données de soumission avec les informations institutionnelles
 * @param {Array} submissions - Array des soumissions
 * @returns {Array} - Soumissions enrichies
 */
export const enrichSubmissionsWithInstitutions = (submissions) => {
  return submissions.map(submission => {
    const institutionInfo = categorizeInstitution(submission.data?.email);
    
    return {
      ...submission,
      institution_info: institutionInfo
    };
  });
};

export default {
  extractDomain,
  isPersonalEmail,
  categorizeInstitution,
  analyzeInstitutions,
  enrichSubmissionsWithInstitutions,
  KNOWN_INSTITUTIONS,
  PUBLIC_EMAIL_DOMAINS
};
