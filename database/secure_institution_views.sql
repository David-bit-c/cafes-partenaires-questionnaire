-- =============================================================================
-- VUES SQL SÉCURISÉES POUR ANALYSES PAR INSTITUTION
-- Version renforcée avec protection injection SQL
-- =============================================================================

-- Supprimer anciennes vues si existantes
DROP VIEW IF EXISTS submissions_with_institutions;
DROP VIEW IF EXISTS repartition_institutions;
DROP VIEW IF EXISTS moyennes_par_secteur;
DROP VIEW IF EXISTS moyennes_par_institution;
DROP VIEW IF EXISTS comparaison_public_prive;

-- Vue principale sécurisée avec validation stricte
CREATE VIEW submissions_with_institutions AS
SELECT 
    s.id,
    s.created_at,
    s.data,
    
    -- Extraction sécurisée email avec validation
    CASE 
        WHEN json_extract(s.data, '$.email') IS NULL 
          OR json_extract(s.data, '$.email') = '' 
          OR typeof(json_extract(s.data, '$.email')) != 'text'
        THEN NULL
        WHEN instr(json_extract(s.data, '$.email'), '@') = 0 
        THEN NULL
        ELSE lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1)))
    END as email_domain,
    
    -- Classification institution avec validation
    CASE 
        -- Domaines publics (exclus des stats)
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) IN (
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'bluewin.ch',
            'icloud.com', 'protonmail.com', 'pm.me', 'gmx.ch', 'hispeed.ch'
        ) THEN 'Email Personnel'
        
        -- Institutions partenaires validées
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) LIKE '%ge.ch' 
        THEN 'État de Genève'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) = 'hospice-general.ch' 
        THEN 'Hospice Général'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) = 'caritas-geneve.ch' 
        THEN 'Caritas Genève'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) = 'astural.ch' 
        THEN 'Astural'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) = 'fegpa.ch' 
        THEN 'FEGPA'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) = 'avocats-geneve.ch' 
        THEN 'Ordre des Avocats'
        
        -- Autres domaines validés comme institutions
        WHEN json_extract(s.data, '$.email') IS NOT NULL 
          AND instr(json_extract(s.data, '$.email'), '@') > 0
          AND length(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) > 3
        THEN 'Institution Non-Répertoriée'
        
        ELSE 'Email Invalide'
    END as institution,
    
    -- Secteur sécurisé
    CASE 
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) LIKE '%ge.ch' 
        THEN 'Public'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) IN (
            'hospice-general.ch', 'caritas-geneve.ch'
        ) THEN 'Associatif'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) IN (
            'astural.ch', 'fegpa.ch', 'avocats-geneve.ch'
        ) THEN 'Professionnel'
        WHEN lower(trim(substr(json_extract(s.data, '$.email'), instr(json_extract(s.data, '$.email'), '@') + 1))) IN (
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'bluewin.ch',
            'icloud.com', 'protonmail.com', 'pm.me', 'gmx.ch', 'hispeed.ch'
        ) THEN 'Personnel'
        ELSE 'Autre'
    END as secteur,
    
    -- Validation données questionnaire avec sécurisation
    CASE 
        WHEN json_valid(s.data) = 0 THEN 'Données Corrompues'
        WHEN json_extract(s.data, '$.currentFunction') IS NULL THEN 'Fonction Manquante'
        ELSE 'Valide'
    END as statut_donnees

FROM submissions s
WHERE json_valid(s.data) = 1  -- Seulement données JSON valides
  AND json_extract(s.data, '$.email') IS NOT NULL;

-- Vue répartition avec compteurs sécurisés
CREATE VIEW repartition_institutions AS
SELECT 
    institution,
    secteur,
    COUNT(*) as nombre_reponses,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM submissions_with_institutions WHERE institution != 'Email Personnel'), 2) as pourcentage,
    MIN(created_at) as premiere_reponse,
    MAX(created_at) as derniere_reponse
FROM submissions_with_institutions
WHERE institution != 'Email Personnel'  -- Exclure emails personnels
  AND institution != 'Email Invalide'   -- Exclure emails invalides
  AND statut_donnees = 'Valide'         -- Seulement données valides
GROUP BY institution, secteur
ORDER BY nombre_reponses DESC;

-- Vue moyennes par secteur sécurisée
CREATE VIEW moyennes_par_secteur AS
SELECT 
    secteur,
    COUNT(*) as nombre_reponses,
    
    -- Calculs sécurisés avec validation
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.workSatisfaction')) = 'integer' 
              AND json_extract(data, '$.workSatisfaction') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.workSatisfaction') AS REAL)
            ELSE NULL 
        END
    ), 2) as satisfaction_travail_moyenne,
    
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.formationImpact')) = 'integer' 
              AND json_extract(data, '$.formationImpact') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.formationImpact') AS REAL)
            ELSE NULL 
        END
    ), 2) as impact_formation_moyen,
    
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.overallSatisfaction')) = 'integer' 
              AND json_extract(data, '$.overallSatisfaction') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.overallSatisfaction') AS REAL)
            ELSE NULL 
        END
    ), 2) as satisfaction_globale_moyenne

FROM submissions_with_institutions
WHERE secteur != 'Personnel'  -- Exclure emails personnels
  AND statut_donnees = 'Valide'
GROUP BY secteur
HAVING COUNT(*) >= 2  -- Minimum 2 réponses pour statistiques fiables
ORDER BY nombre_reponses DESC;

-- Vue moyennes par institution sécurisée  
CREATE VIEW moyennes_par_institution AS
SELECT 
    institution,
    secteur,
    COUNT(*) as nombre_reponses,
    
    -- Moyennes sécurisées avec validation de type et plage
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.workSatisfaction')) = 'integer' 
              AND json_extract(data, '$.workSatisfaction') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.workSatisfaction') AS REAL)
            ELSE NULL 
        END
    ), 2) as satisfaction_travail_moyenne,
    
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.formationImpact')) = 'integer' 
              AND json_extract(data, '$.formationImpact') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.formationImpact') AS REAL)
            ELSE NULL 
        END
    ), 2) as impact_formation_moyen

FROM submissions_with_institutions
WHERE institution NOT IN ('Email Personnel', 'Email Invalide')
  AND statut_donnees = 'Valide'
GROUP BY institution, secteur
HAVING COUNT(*) >= 3  -- Minimum 3 réponses pour anonymat et fiabilité
ORDER BY nombre_reponses DESC;

-- Vue comparaison public/privé sécurisée
CREATE VIEW comparaison_public_prive AS
SELECT 
    CASE 
        WHEN secteur = 'Public' THEN 'Secteur Public'
        WHEN secteur IN ('Associatif', 'Professionnel') THEN 'Secteur Privé/Associatif'
        ELSE 'Autre'
    END as type_secteur,
    
    COUNT(*) as nombre_reponses,
    
    -- Moyennes avec validation stricte
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.workSatisfaction')) = 'integer' 
              AND json_extract(data, '$.workSatisfaction') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.workSatisfaction') AS REAL)
            ELSE NULL 
        END
    ), 2) as satisfaction_travail,
    
    ROUND(AVG(
        CASE 
            WHEN typeof(json_extract(data, '$.formationImpact')) = 'integer' 
              AND json_extract(data, '$.formationImpact') BETWEEN 1 AND 5
            THEN CAST(json_extract(data, '$.formationImpact') AS REAL)
            ELSE NULL 
        END
    ), 2) as impact_formation,
    
    -- Écart-type pour mesurer la dispersion
    ROUND(
        SQRT(AVG(
            (CAST(json_extract(data, '$.workSatisfaction') AS REAL) - 
             (SELECT AVG(CAST(json_extract(data, '$.workSatisfaction') AS REAL)) 
              FROM submissions_with_institutions 
              WHERE secteur IN ('Public', 'Associatif', 'Professionnel')
                AND statut_donnees = 'Valide'
                AND typeof(json_extract(data, '$.workSatisfaction')) = 'integer'
                AND json_extract(data, '$.workSatisfaction') BETWEEN 1 AND 5)
            ) * (CAST(json_extract(data, '$.workSatisfaction') AS REAL) - 
                (SELECT AVG(CAST(json_extract(data, '$.workSatisfaction') AS REAL)) 
                 FROM submissions_with_institutions 
                 WHERE secteur IN ('Public', 'Associatif', 'Professionnel')
                   AND statut_donnees = 'Valide'
                   AND typeof(json_extract(data, '$.workSatisfaction')) = 'integer'
                   AND json_extract(data, '$.workSatisfaction') BETWEEN 1 AND 5)
                )
        )), 2
    ) as ecart_type_satisfaction

FROM submissions_with_institutions
WHERE secteur IN ('Public', 'Associatif', 'Professionnel')
  AND statut_donnees = 'Valide'
GROUP BY type_secteur
HAVING COUNT(*) >= 5  -- Minimum 5 réponses pour comparaison fiable
ORDER BY nombre_reponses DESC;
