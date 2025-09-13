// Cloudflare Pages Function pour l'export enrichi des données
// Support CSV et Excel avec anonymisation des emails et enrichissement institutionnel

/**
 * Point d'entrée principal pour l'export des données
 * Supporte les formats CSV et Excel
 * URL: /api/export?format=csv ou /api/export?format=excel
 */
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';
    
    // Validation du format
    if (!['csv', 'excel'].includes(format)) {
      return new Response(JSON.stringify({
        error: "Format non supporté. Utilisez 'csv' ou 'excel'"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Récupération des données de la base
    const stmt = env.DB.prepare("SELECT * FROM submissions ORDER BY created_at DESC");
    const result = await stmt.all();
    
    if (!result.success) {
      throw new Error("Échec de la récupération des données");
    }

    if (result.results.length === 0) {
      return new Response(JSON.stringify({
        error: "Aucune donnée à exporter"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Traitement et enrichissement des données
    const enrichedData = enrichSubmissionsForExport(result.results);
    
    // Génération de l'export selon le format
    if (format === 'csv') {
      return generateCSVExport(enrichedData);
    } else {
      return generateExcelExport(enrichedData);
    }

  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    
    return new Response(JSON.stringify({
      error: `Erreur serveur lors de l'export: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Enrichit les soumissions avec les informations institutionnelles
 * et anonymise les emails pour l'export
 */
function enrichSubmissionsForExport(rawSubmissions) {
  const enrichedSubmissions = [];
  
  rawSubmissions.forEach((submission, index) => {
    try {
      const parsedData = JSON.parse(submission.data);
      const institutionInfo = categorizeInstitution(parsedData.email);
      
      // Création de l'enregistrement enrichi anonymisé
      const enrichedRecord = {
        // Métadonnées
        id: submission.id,
        date_soumission: new Date(submission.created_at).toLocaleDateString('fr-CH'),
        heure_soumission: new Date(submission.created_at).toLocaleTimeString('fr-CH'),
        
        // Informations institutionnelles (anonymisées)
        email_domain: institutionInfo.email_domain,
        institution_deduite: institutionInfo.institution_deduite,
        secteur_activite: institutionInfo.secteur_activite,
        type_structure: institutionInfo.type_structure,
        programmes: institutionInfo.programmes,
        statut_institution: institutionInfo.status,
        
        // Données du questionnaire
        participation_cafes: parsedData.participatedInCafes,
        role_professionnel: parsedData.professionalRole === 'Autre' ? 
          parsedData.professionalRoleOther || 'Autre (non précisé)' : 
          parsedData.professionalRole,
        
        // Retours sur les cafés (si applicable)
        cafes_connaissance: parsedData.cafesKnowledge ? parsedData.cafesKnowledge.join(', ') : null,
        cafes_communication: parsedData.cafesCommunication,
        cafes_communication_raison: parsedData.cafesCommunicationReason,
        cafes_appreciation: parsedData.cafesEnjoyment ? parsedData.cafesEnjoyment.join(', ') : null,
        cafes_appreciation_autre: parsedData.cafesEnjoymentOther,
        
        // Problématiques observées
        defis_observes: parsedData.observedChallenges ? parsedData.observedChallenges.join(', ') : null,
        defis_observes_autre: parsedData.observedChallengesOther,
        
        // Classement des problématiques (impact perçu 1-7)
        impact_sante_mentale: parsedData.challengesRanking?.sante_mentale,
        impact_precarite: parsedData.challengesRanking?.precarite,
        impact_decrochage: parsedData.challengesRanking?.decrochage,
        impact_migration: parsedData.challengesRanking?.migration,
        impact_addictions: parsedData.challengesRanking?.addictions,
        impact_conflits: parsedData.challengesRanking?.conflits,
        
        // Évolution des problématiques
        problematiques_emergentes: parsedData.challengesHasEmerged ? parsedData.challengesHasEmerged.join(', ') : null,
        nouvelles_problematiques: parsedData.emergingChallengesDescription,
        
        // Facteurs de rupture et maintien
        skip_section_rupture: parsedData.skipRuptureSection ? 'Oui' : 'Non',
        facteurs_favorables_reprise: parsedData.ruptureFactorsFavorable ? parsedData.ruptureFactorsFavorable.join(', ') : null,
        facteurs_risques_abandon: parsedData.ruptureFactorsNegative ? parsedData.ruptureFactorsNegative.join(', ') : null,
        autres_facteurs_rupture: parsedData.ruptureFactorsOther,
        
        // Obstacles professionnels
        obstacles_accompagnement: parsedData.specializationObstacles
      };
      
      enrichedSubmissions.push(enrichedRecord);
      
    } catch (parseError) {
      console.error(`Erreur parsing soumission ${submission.id}:`, parseError);
      // Ajouter un enregistrement d'erreur pour traçabilité
      enrichedSubmissions.push({
        id: submission.id,
        date_soumission: new Date(submission.created_at).toLocaleDateString('fr-CH'),
        erreur: 'Données corrompues',
        raw_data: submission.data.substring(0, 100) + '...'
      });
    }
  });
  
  return enrichedSubmissions;
}

/**
 * Catégorise une institution basée sur son email
 * Version simplifiée pour l'API (copie des fonctions principales)
 */
function categorizeInstitution(email) {
  const domain = extractDomain(email);
  
  if (!domain) {
    return {
      email_domain: null,
      institution_deduite: 'Email invalide',
      secteur_activite: null,
      type_structure: null,
      programmes: null,
      status: 'error'
    };
  }

  // Emails personnels
  const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'bluewin.ch'];
  if (publicDomains.includes(domain)) {
    return {
      email_domain: domain,
      institution_deduite: 'Email personnel (inconnu)',
      secteur_activite: null,
      type_structure: 'Personnel',
      programmes: null,
      status: 'personal'
    };
  }

  // Base des institutions connues (version allégée)
  const knownInstitutions = getKnownInstitutions();
  const institutionInfo = knownInstitutions[domain];
  
  if (institutionInfo) {
    return {
      email_domain: domain,
      institution_deduite: institutionInfo.name,
      secteur_activite: institutionInfo.sector,
      type_structure: institutionInfo.type,
      programmes: institutionInfo.programs ? institutionInfo.programs.join(', ') : null,
      status: 'known'
    };
  }

  // Institution inconnue
  return {
    email_domain: domain,
    institution_deduite: domain,
    secteur_activite: 'À catégoriser',
    type_structure: 'Structure non répertoriée',
    programmes: null,
    status: 'unknown'
  };
}

function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Génère un export CSV
 */
function generateCSVExport(data) {
  if (data.length === 0) {
    return new Response("Aucune donnée à exporter", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // En-têtes CSV
  const headers = Object.keys(data[0]);
  let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
  
  // Données
  data.forEach(row => {
    const csvRow = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += csvRow + '\n';
  });

  const filename = `export_questionnaire_cafes_${new Date().toISOString().split('T')[0]}.csv`;
  
  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*"
    }
  });
}

/**
 * Génère un export Excel (format TSV pour compatibilité)
 */
function generateExcelExport(data) {
  if (data.length === 0) {
    return new Response("Aucune donnée à exporter", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // En-têtes TSV (Tab Separated Values - compatible Excel)
  const headers = Object.keys(data[0]);
  let tsvContent = headers.join('\t') + '\n';
  
  // Données
  data.forEach(row => {
    const tsvRow = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t');
    tsvContent += tsvRow + '\n';
  });

  const filename = `export_questionnaire_cafes_${new Date().toISOString().split('T')[0]}.xls`;
  
  return new Response(tsvContent, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*"
    }
  });
}

/**
 * Base des institutions connues (version API)
 */
function getKnownInstitutions() {
  return {
    // HUG
    'hug.ch': { name: 'HUG', sector: 'Santé publique', type: 'Établissement hospitalier public', programs: ['JADE', 'UPJA', 'UAP', 'CCEAF'] },
    'hcuge.ch': { name: 'HUG', sector: 'Santé publique', type: 'Établissement hospitalier public', programs: ['JADE', 'UPJA'] },
    
    // Services publics
    'ge.ch': { name: 'État de Genève', sector: 'Services publics cantonaux', type: 'Administration cantonale', programs: ['SSEJ', 'BCAS'] },
    'etat.ge.ch': { name: 'État de Genève', sector: 'Services publics cantonaux', type: 'Administration cantonale', programs: ['SSEJ'] },
    
    // Grandes organisations
    'croix-rouge-ge.ch': { name: 'Croix-Rouge Genève', sector: 'Humanitaire et social', type: 'Organisation humanitaire', programs: ['For Me', 'PROPULSE'] },
    'oseo-ge.ch': { name: 'OSEO', sector: 'Socio-éducatif', type: 'Fondation', programs: ['For Me', 'Cap Emploi'] },
    'astural.org': { name: 'ASTURAL', sector: 'Socio-éducatif', type: 'Association', programs: ['Atelier ABC', 'Chevrens'] },
    
    // Santé spécialisée
    'paidos.org': { name: 'PAÏDOS', sector: 'Santé mentale spécialisée', type: 'Organisation spécialisée', programs: [] },
    'trajets.org': { name: 'MOVE ON! (Trajets)', sector: 'Santé mentale spécialisée', type: 'Organisation spécialisée', programs: [] },
    'phenix.ch': { name: 'Fondation Phénix', sector: 'Addictions', type: 'Fondation spécialisée', programs: [] },
    
    // Innovation numérique
    'nolimit.support': { name: 'NO LIMIT', sector: 'Innovation numérique', type: 'Structure innovante', programs: [] },
    'liftnolimit.com': { name: 'LIFT', sector: 'Innovation numérique', type: 'Entreprise sociale', programs: [] },
    'yojoa.co': { name: 'Yojoa', sector: 'Innovation sociale', type: 'Structure innovante', programs: [] },
    
    // Structures principales (version allégée pour l'API)
    'foj.ch': { name: 'FOJ', sector: 'Éducatif spécialisé', type: 'Fondation', programs: [] },
    'qualife.ch': { name: 'Qualife Fondation', sector: 'Formation professionnelle', type: 'Fondation', programs: [] },
    'fase.ch': { name: 'FASe', sector: 'Animation socioculturelle', type: 'Fondation', programs: [] },
    'lancy.ch': { name: 'Commune de Lancy', sector: 'Services communaux', type: 'Administration communale', programs: [] }
  };
}

// Gestion CORS pour OPTIONS
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
