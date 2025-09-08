-- =============================================================================
-- VUES SQL ENRICHIES POUR ANALYSES PAR INSTITUTION
-- Base de données CAP Formations - Questionnaire Cafés Partenaires
-- =============================================================================

-- Vue principale : submissions enrichies avec informations institutionnelles
CREATE VIEW IF NOT EXISTS submissions_with_institutions AS
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
    
    -- Catégorisation des institutions
    CASE 
        -- HUG - Hôpitaux Universitaires de Genève
        WHEN json_extract(s.data, '$.email') LIKE '%@hug.ch' OR json_extract(s.data, '$.email') LIKE '%@hcuge.ch' 
            THEN 'HUG - Hôpitaux Universitaires de Genève'
        
        -- Services publics cantonaux
        WHEN json_extract(s.data, '$.email') LIKE '%@ge.ch' OR json_extract(s.data, '$.email') LIKE '%@etat.ge.ch' 
            THEN 'État de Genève'
        
        -- Grandes organisations multi-programmes
        WHEN json_extract(s.data, '$.email') LIKE '%@croix-rouge-ge.ch' 
            THEN 'Croix-Rouge Genève'
        WHEN json_extract(s.data, '$.email') LIKE '%@oseo-ge.ch' 
            THEN 'OSEO'
        WHEN json_extract(s.data, '$.email') LIKE '%@astural.org' OR json_extract(s.data, '$.email') LIKE '%@accroche.ch'
            THEN 'ASTURAL'
        
        -- Santé mentale spécialisée
        WHEN json_extract(s.data, '$.email') LIKE '%@paidos.org' 
            THEN 'PAÏDOS'
        WHEN json_extract(s.data, '$.email') LIKE '%@trajets.org' 
            THEN 'MOVE ON! (Trajets)'
        WHEN json_extract(s.data, '$.email') LIKE '%@phenix.ch' 
            THEN 'Fondation Phénix'
        WHEN json_extract(s.data, '$.email') LIKE '%@carrefouraddictions.ch' 
            THEN 'Carrefour addictions Genève'
        
        -- Innovation numérique
        WHEN json_extract(s.data, '$.email') LIKE '%@nolimit.support' 
            THEN 'NO LIMIT'
        WHEN json_extract(s.data, '$.email') LIKE '%@liftnolimit.com' 
            THEN 'LIFT'
        WHEN json_extract(s.data, '$.email') LIKE '%@yojoa.co' 
            THEN 'Yojoa'
        
        -- Structures éducatives principales
        WHEN json_extract(s.data, '$.email') LIKE '%@foj.ch' 
            THEN 'FOJ - Foyers'
        WHEN json_extract(s.data, '$.email') LIKE '%@qualife.ch' 
            THEN 'Qualife Fondation'
        WHEN json_extract(s.data, '$.email') LIKE '%@fase.ch' 
            THEN 'FASe'
        WHEN json_extract(s.data, '$.email') LIKE '%@epi-ge.ch' 
            THEN 'EPI'
        
        -- Communes genevoises
        WHEN json_extract(s.data, '$.email') LIKE '%@lancy.ch' 
            THEN 'Commune de Lancy'
        
        -- Autres structures connues
        WHEN json_extract(s.data, '$.email') LIKE '%@uog.ch' 
            THEN 'UOG - Université Ouvrière de Genève'
        WHEN json_extract(s.data, '$.email') LIKE '%@kultura.ch' 
            THEN 'KULTURA - Maison Kultura'
        WHEN json_extract(s.data, '$.email') LIKE '%@nasca.ch' 
            THEN 'For Me - Nasca'
        WHEN json_extract(s.data, '$.email') LIKE '%@csp.ch' 
            THEN 'CSP - Centre Social Protestant'
        WHEN json_extract(s.data, '$.email') LIKE '%@caritas-ge.ch' 
            THEN 'Caritas Genève'
        
        -- Emails personnels
        WHEN json_extract(s.data, '$.email') LIKE '%@gmail.com' 
            OR json_extract(s.data, '$.email') LIKE '%@hotmail.com' 
            OR json_extract(s.data, '$.email') LIKE '%@outlook.com' 
            OR json_extract(s.data, '$.email') LIKE '%@yahoo.com' 
            OR json_extract(s.data, '$.email') LIKE '%@bluewin.ch'
            THEN 'Email personnel (inconnu)'
        
        -- Institution inconnue
        WHEN json_extract(s.data, '$.email') IS NOT NULL 
            THEN 'Structure non répertoriée'
        
        ELSE 'Email invalide'
    END as institution_deduite,
    
    -- Secteur d'activité
    CASE 
        WHEN json_extract(s.data, '$.email') LIKE '%@hug.ch' OR json_extract(s.data, '$.email') LIKE '%@hcuge.ch' 
            THEN 'Santé publique'
        WHEN json_extract(s.data, '$.email') LIKE '%@ge.ch' OR json_extract(s.data, '$.email') LIKE '%@etat.ge.ch' 
            THEN 'Services publics cantonaux'
        WHEN json_extract(s.data, '$.email') LIKE '%@croix-rouge-ge.ch' 
            THEN 'Humanitaire et social'
        WHEN json_extract(s.data, '$.email') LIKE '%@oseo-ge.ch' OR json_extract(s.data, '$.email') LIKE '%@astural.org'
            THEN 'Socio-éducatif'
        WHEN json_extract(s.data, '$.email') LIKE '%@paidos.org' OR json_extract(s.data, '$.email') LIKE '%@trajets.org'
            THEN 'Santé mentale spécialisée'
        WHEN json_extract(s.data, '$.email') LIKE '%@phenix.ch' OR json_extract(s.data, '$.email') LIKE '%@carrefouraddictions.ch'
            THEN 'Addictions'
        WHEN json_extract(s.data, '$.email') LIKE '%@nolimit.support' OR json_extract(s.data, '$.email') LIKE '%@liftnolimit.com' OR json_extract(s.data, '$.email') LIKE '%@yojoa.co'
            THEN 'Innovation numérique'
        WHEN json_extract(s.data, '$.email') LIKE '%@foj.ch' OR json_extract(s.data, '$.email') LIKE '%@epi-ge.ch'
            THEN 'Éducatif spécialisé'
        WHEN json_extract(s.data, '$.email') LIKE '%@qualife.ch' 
            THEN 'Formation professionnelle'
        WHEN json_extract(s.data, '$.email') LIKE '%@fase.ch' 
            THEN 'Animation socioculturelle'
        WHEN json_extract(s.data, '$.email') LIKE '%@lancy.ch' 
            THEN 'Services communaux'
        WHEN json_extract(s.data, '$.email') LIKE '%@gmail.com' OR json_extract(s.data, '$.email') LIKE '%@hotmail.com' 
            THEN NULL
        ELSE 'À catégoriser'
    END as secteur_activite,
    
    -- Type de structure
    CASE 
        WHEN json_extract(s.data, '$.email') LIKE '%@hug.ch' OR json_extract(s.data, '$.email') LIKE '%@hcuge.ch' 
            THEN 'Établissement hospitalier public'
        WHEN json_extract(s.data, '$.email') LIKE '%@ge.ch' OR json_extract(s.data, '$.email') LIKE '%@etat.ge.ch' 
            THEN 'Administration cantonale'
        WHEN json_extract(s.data, '$.email') LIKE '%@lancy.ch' 
            THEN 'Administration communale'
        WHEN json_extract(s.data, '$.email') LIKE '%@croix-rouge-ge.ch' 
            THEN 'Organisation humanitaire'
        WHEN json_extract(s.data, '$.email') LIKE '%@oseo-ge.ch' OR json_extract(s.data, '$.email') LIKE '%@qualife.ch' OR json_extract(s.data, '$.email') LIKE '%@fase.ch' OR json_extract(s.data, '$.email') LIKE '%@foj.ch'
            THEN 'Fondation'
        WHEN json_extract(s.data, '$.email') LIKE '%@phenix.ch' 
            THEN 'Fondation spécialisée'
        WHEN json_extract(s.data, '$.email') LIKE '%@yojoa.co' OR json_extract(s.data, '$.email') LIKE '%@nolimit.support'
            THEN 'Structure innovante'
        WHEN json_extract(s.data, '$.email') LIKE '%@liftnolimit.com'
            THEN 'Entreprise sociale'
        WHEN json_extract(s.data, '$.email') LIKE '%@gmail.com' OR json_extract(s.data, '$.email') LIKE '%@hotmail.com' 
            THEN 'Personnel'
        ELSE 'Association'
    END as type_structure,
    
    -- Indicateur pour inclusion dans statistiques institutionnelles
    CASE 
        WHEN json_extract(s.data, '$.email') LIKE '%@gmail.com' 
            OR json_extract(s.data, '$.email') LIKE '%@hotmail.com' 
            OR json_extract(s.data, '$.email') LIKE '%@outlook.com'
            OR json_extract(s.data, '$.email') IS NULL
            THEN 0
        ELSE 1
    END as inclure_stats_institutionnelles,
    
    -- Extraction des données clés du questionnaire pour faciliter les requêtes
    json_extract(s.data, '$.participatedInCafes') as participation_cafes,
    json_extract(s.data, '$.professionalRole') as role_professionnel,
    json_extract(s.data, '$.challengesRanking.sante_mentale') as impact_sante_mentale,
    json_extract(s.data, '$.challengesRanking.precarite') as impact_precarite,
    json_extract(s.data, '$.challengesRanking.decrochage') as impact_decrochage,
    json_extract(s.data, '$.challengesRanking.migration') as impact_migration,
    json_extract(s.data, '$.challengesRanking.addictions') as impact_addictions,
    json_extract(s.data, '$.challengesRanking.conflits') as impact_conflits

FROM submissions s;

-- =============================================================================
-- VUES SPÉCIALISÉES POUR ANALYSES RAPIDES
-- =============================================================================

-- Vue : Répartition par institution (uniquement institutions valides)
CREATE VIEW IF NOT EXISTS repartition_institutions AS
SELECT 
    institution_deduite,
    secteur_activite,
    type_structure,
    COUNT(*) as nombre_reponses,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM submissions_with_institutions WHERE inclure_stats_institutionnelles = 1), 2) as pourcentage
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
GROUP BY institution_deduite, secteur_activite, type_structure
ORDER BY nombre_reponses DESC;

-- Vue : Moyennes par secteur d'activité
CREATE VIEW IF NOT EXISTS moyennes_par_secteur AS
SELECT 
    secteur_activite,
    COUNT(*) as nombre_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
    ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as avg_precarite,
    ROUND(AVG(CAST(impact_decrochage AS REAL)), 2) as avg_decrochage,
    ROUND(AVG(CAST(impact_migration AS REAL)), 2) as avg_migration,
    ROUND(AVG(CAST(impact_addictions AS REAL)), 2) as avg_addictions,
    ROUND(AVG(CAST(impact_conflits AS REAL)), 2) as avg_conflits
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1 
  AND secteur_activite IS NOT NULL
GROUP BY secteur_activite
ORDER BY nombre_reponses DESC;

-- Vue : Moyennes par institution (institutions avec plus de 2 réponses)
CREATE VIEW IF NOT EXISTS moyennes_par_institution AS
SELECT 
    institution_deduite,
    secteur_activite,
    COUNT(*) as nombre_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
    ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as avg_precarite,
    ROUND(AVG(CAST(impact_decrochage AS REAL)), 2) as avg_decrochage,
    ROUND(AVG(CAST(impact_migration AS REAL)), 2) as avg_migration,
    ROUND(AVG(CAST(impact_addictions AS REAL)), 2) as avg_addictions,
    ROUND(AVG(CAST(impact_conflits AS REAL)), 2) as avg_conflits
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
GROUP BY institution_deduite, secteur_activite
HAVING COUNT(*) >= 2
ORDER BY nombre_reponses DESC;

-- Vue : Comparaison publique vs privé
CREATE VIEW IF NOT EXISTS comparaison_public_prive AS
SELECT 
    CASE 
        WHEN type_structure IN ('Établissement hospitalier public', 'Administration cantonale', 'Administration communale') 
            THEN 'Public'
        WHEN type_structure IN ('Fondation', 'Association', 'Organisation humanitaire')
            THEN 'Privé non-lucratif'
        WHEN type_structure IN ('Entreprise sociale', 'Structure innovante')
            THEN 'Privé innovant'
        ELSE 'Autre'
    END as categorie_structure,
    COUNT(*) as nombre_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
    ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as avg_precarite,
    ROUND(AVG(CAST(impact_decrochage AS REAL)), 2) as avg_decrochage
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
GROUP BY categorie_structure
ORDER BY nombre_reponses DESC;
