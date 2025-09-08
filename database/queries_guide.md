# Guide de Requêtes SQL - Analyses par Institution
## Base de données CAP Formations - Questionnaire Cafés Partenaires

Ce guide vous fournit toutes les requêtes SQL nécessaires pour analyser vos données par institution via la base D1 Cloudflare.

## 📊 **Vue d'ensemble des données**

### Aperçu général des institutions
```sql
-- Répartition des réponses par institution
SELECT * FROM repartition_institutions;
```

### Découvrir les nouvelles institutions non répertoriées
```sql
-- Identifier les domaines inconnus
SELECT 
    email_domain,
    COUNT(*) as nombre_reponses,
    GROUP_CONCAT(DISTINCT role_professionnel) as roles_identifies
FROM submissions_with_institutions 
WHERE institution_deduite = 'Structure non répertoriée'
GROUP BY email_domain
ORDER BY nombre_reponses DESC;
```

## 🏥 **Analyses par Secteur**

### Comparaison des perceptions par secteur d'activité
```sql
-- Moyennes des impacts perçus par secteur
SELECT * FROM moyennes_par_secteur;
```

### Focus secteur santé publique vs privée
```sql
-- Comparaison HUG vs structures santé mentale privées
SELECT 
    CASE 
        WHEN institution_deduite = 'HUG - Hôpitaux Universitaires de Genève' THEN 'HUG (Public)'
        WHEN secteur_activite = 'Santé mentale spécialisée' THEN 'Santé mentale privée'
        ELSE 'Autre'
    END as categorie_sante,
    COUNT(*) as nombre_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_impact_sante_mentale,
    ROUND(AVG(CAST(impact_addictions AS REAL)), 2) as avg_impact_addictions
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
  AND (institution_deduite = 'HUG - Hôpitaux Universitaires de Genève' 
       OR secteur_activite = 'Santé mentale spécialisée')
GROUP BY categorie_sante;
```

## 🏢 **Analyses par Institution Spécifique**

### Toutes les réponses d'une institution
```sql
-- Exemple : Toutes les réponses HUG
SELECT 
    id,
    created_at,
    role_professionnel,
    participation_cafes,
    impact_sante_mentale,
    impact_precarite,
    data -- données complètes JSON
FROM submissions_with_institutions 
WHERE institution_deduite = 'HUG - Hôpitaux Universitaires de Genève';
```

### Comparaison entre grandes organisations
```sql
-- HUG vs OSEO vs Croix-Rouge
SELECT 
    institution_deduite,
    COUNT(*) as nb_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
    ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as avg_precarite,
    ROUND(AVG(CAST(impact_decrochage AS REAL)), 2) as avg_decrochage
FROM submissions_with_institutions 
WHERE institution_deduite IN (
    'HUG - Hôpitaux Universitaires de Genève',
    'OSEO',
    'Croix-Rouge Genève'
)
GROUP BY institution_deduite;
```

### Institutions avec perceptions atypiques
```sql
-- Identifier les institutions avec des perceptions très différentes de la moyenne
WITH moyennes_globales AS (
    SELECT 
        ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as global_sante_mentale,
        ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as global_precarite
    FROM submissions_with_institutions 
    WHERE inclure_stats_institutionnelles = 1
)
SELECT 
    i.institution_deduite,
    i.avg_sante_mentale,
    g.global_sante_mentale,
    (i.avg_sante_mentale - g.global_sante_mentale) as ecart_sante_mentale,
    i.nombre_reponses
FROM moyennes_par_institution i
CROSS JOIN moyennes_globales g
WHERE i.nombre_reponses >= 3
  AND ABS(i.avg_sante_mentale - g.global_sante_mentale) > 1.0
ORDER BY ABS(i.avg_sante_mentale - g.global_sante_mentale) DESC;
```

## 🏛️ **Analyses Public vs Privé**

### Comparaison secteur public vs structures privées
```sql
SELECT * FROM comparaison_public_prive;
```

### Services publics vs grandes fondations
```sql
-- État/Communes vs Fondations majeures
SELECT 
    CASE 
        WHEN type_structure IN ('Administration cantonale', 'Administration communale') THEN 'Services publics'
        WHEN institution_deduite IN ('OSEO', 'Qualife Fondation', 'FASe', 'FOJ - Foyers') THEN 'Grandes fondations'
        ELSE 'Autre'
    END as categorie,
    COUNT(*) as nombre_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
    ROUND(AVG(CAST(impact_precarite AS REAL)), 2) as avg_precarite
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
GROUP BY categorie
HAVING categorie != 'Autre';
```

## 💡 **Analyses Innovation vs Traditionnel**

### Structures innovantes vs traditionnelles
```sql
-- Innovation numérique vs structures établies
SELECT 
    CASE 
        WHEN secteur_activite = 'Innovation numérique' THEN 'Innovation numérique'
        WHEN secteur_activite IN ('Éducatif spécialisé', 'Socio-éducatif') THEN 'Socio-éducatif traditionnel'
        ELSE 'Autre'
    END as approche,
    COUNT(*) as nombre_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale,
    ROUND(AVG(CAST(impact_decrochage AS REAL)), 2) as avg_decrochage
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
GROUP BY approche
HAVING approche != 'Autre';
```

## 📈 **Analyses Facteurs de Rupture par Institution**

### Facteurs favorables par secteur
```sql
-- Facteurs favorisant la reprise par institution
SELECT 
    institution_deduite,
    secteur_activite,
    COUNT(*) as nb_reponses,
    json_extract(data, '$.ruptureFactorsFavorable') as facteurs_favorables,
    json_extract(data, '$.ruptureFactorsNegative') as facteurs_negatifs
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
  AND json_extract(data, '$.skipRuptureSection') != 'true'
  AND institution_deduite IN ('HUG - Hôpitaux Universitaires de Genève', 'OSEO', 'Croix-Rouge Genève');
```

## 🔍 **Requêtes de Découverte**

### Identifier les patterns par institution
```sql
-- Participation aux cafés par institution
SELECT 
    institution_deduite,
    participation_cafes,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY institution_deduite), 1) as pourcentage
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
  AND institution_deduite IN (
      SELECT institution_deduite 
      FROM submissions_with_institutions 
      WHERE inclure_stats_institutionnelles = 1
      GROUP BY institution_deduite 
      HAVING COUNT(*) >= 3
  )
GROUP BY institution_deduite, participation_cafes
ORDER BY institution_deduite, participation_cafes;
```

### Export enrichi par institution
```sql
-- Export complet pour une institution spécifique
SELECT 
    id,
    created_at,
    email_domain,
    institution_deduite,
    secteur_activite,
    type_structure,
    role_professionnel,
    participation_cafes,
    impact_sante_mentale,
    impact_precarite,
    impact_decrochage,
    impact_migration,
    impact_addictions,
    impact_conflits,
    json_extract(data, '$.observedChallenges') as defis_observes,
    json_extract(data, '$.ruptureFactorsFavorable') as facteurs_favorables,
    json_extract(data, '$.specializationObstacles') as obstacles_accompagnement
FROM submissions_with_institutions 
WHERE institution_deduite = 'HUG - Hôpitaux Universitaires de Genève';
-- Remplacez 'HUG - Hôpitaux Universitaires de Genève' par l'institution souhaitée
```

## 📋 **Requêtes de Suivi et Monitoring**

### Évolution temporelle par institution
```sql
-- Répartition des réponses par mois et institution
SELECT 
    strftime('%Y-%m', created_at) as mois,
    institution_deduite,
    COUNT(*) as nombre_reponses
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
GROUP BY strftime('%Y-%m', created_at), institution_deduite
ORDER BY mois, nombre_reponses DESC;
```

### Couverture par secteur
```sql
-- Vérifier la représentativité par secteur
SELECT 
    secteur_activite,
    COUNT(DISTINCT institution_deduite) as nb_institutions_distinctes,
    COUNT(*) as total_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_impact
FROM submissions_with_institutions 
WHERE inclure_stats_institutionnelles = 1
  AND secteur_activite IS NOT NULL
GROUP BY secteur_activite
ORDER BY total_reponses DESC;
```

---

## 🚀 **Comment utiliser ces requêtes**

### Via interface Cloudflare D1
1. Connectez-vous à votre dashboard Cloudflare
2. Allez dans D1 Database → votre base `cafes-partenaires-db`
3. Utilisez l'onglet "Console" pour exécuter les requêtes

### Export des résultats
- Copiez les résultats depuis l'interface Cloudflare
- Ou utilisez l'API d'export déjà implémentée pour un export complet

### Personnalisation
- Remplacez les noms d'institutions dans les clauses WHERE
- Ajustez les seuils (ex: `>= 3` réponses minimum)
- Modifiez les regroupements selon vos analyses

---

**Note :** Toutes ces requêtes excluent automatiquement les emails personnels des statistiques institutionnelles grâce au flag `inclure_stats_institutionnelles = 1`.
