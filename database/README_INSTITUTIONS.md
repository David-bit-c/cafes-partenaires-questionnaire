# 🗄️ Analyses par Institution - Base de Données
## CAP Formations - Questionnaire Cafés Partenaires

Ce dossier contient tous les outils pour analyser vos données de questionnaire par institution, directement au niveau base de données.

## 📁 **Contenu du Dossier**

| Fichier | Description |
|---------|-------------|
| `create_institution_views.sql` | Script SQL pour créer toutes les vues enrichies |
| `queries_guide.md` | Guide complet des requêtes d'analyse |
| `setup_institution_views.js` | Script automatique (optionnel) |
| `README_INSTITUTIONS.md` | Ce guide d'utilisation |

## 🚀 **Installation (À faire une seule fois)**

### **Étape 1 : Créer les vues SQL**

**Méthode recommandée - Interface Cloudflare :**

1. Connectez-vous à https://dash.cloudflare.com
2. Allez dans **D1** → sélectionnez votre base `cafes-partenaires-db`
3. Cliquez sur l'onglet **"Console"**
4. Copiez-collez **tout le contenu** du fichier `create_institution_views.sql`
5. Cliquez **"Execute"**

✅ **Vues créées :** `submissions_with_institutions`, `repartition_institutions`, `moyennes_par_secteur`, `moyennes_par_institution`, `comparaison_public_prive`

### **Étape 2 : Vérifier l'installation**

Testez avec cette requête simple :
```sql
SELECT * FROM repartition_institutions LIMIT 5;
```

Vous devriez voir la répartition des réponses par institution.

## 📊 **Utilisation Quotidienne**

### **Accès à la base de données**
1. Dashboard Cloudflare → D1 → `cafes-partenaires-db` → **Console**
2. Copiez une requête du `queries_guide.md`
3. Exécutez et copiez les résultats

### **Exemples de requêtes rapides**

#### **Vue d'ensemble**
```sql
-- Répartition par institution
SELECT * FROM repartition_institutions;
```

#### **Comparaison HUG vs OSEO**
```sql
SELECT 
    institution_deduite,
    COUNT(*) as nb_reponses,
    ROUND(AVG(CAST(impact_sante_mentale AS REAL)), 2) as avg_sante_mentale
FROM submissions_with_institutions 
WHERE institution_deduite IN ('HUG - Hôpitaux Universitaires de Genève', 'OSEO')
GROUP BY institution_deduite;
```

#### **Toutes les réponses d'une institution**
```sql
-- Remplacez 'HUG - Hôpitaux Universitaires de Genève' par l'institution souhaitée
SELECT * FROM submissions_with_institutions 
WHERE institution_deduite = 'HUG - Hôpitaux Universitaires de Genève';
```

## 🎯 **Cas d'Usage Principaux**

### **1. Analyses Comparatives**
- HUG vs structures privées santé mentale
- Services publics vs grandes fondations  
- Innovation numérique vs socio-éducatif traditionnel

### **2. Extractions Ciblées**
- Toutes les réponses d'une institution spécifique
- Données par secteur d'activité
- Comparaisons public/privé

### **3. Découverte de Patterns**
- Institutions avec perceptions atypiques
- Évolution temporelle par institution
- Couverture par secteur

## 📈 **Institutions Cartographiées**

### **Santé Publique**
- HUG - Hôpitaux Universitaires de Genève
- État de Genève (services cantonaux)

### **Grandes Organisations**
- OSEO (multi-programmes)
- Croix-Rouge Genève  
- ASTURAL

### **Santé Mentale Spécialisée**
- PAÏDOS
- MOVE ON! (Trajets)
- Fondation Phénix
- Carrefour addictions Genève

### **Innovation Numérique**
- NO LIMIT
- LIFT
- Yojoa

### **+ 60 autres institutions** répertoriées dans le système

## ⚡ **Fonctionnalités Avancées**

### **Détection Automatique Nouveaux Partenaires**
```sql
-- Identifier domaines non répertoriés
SELECT email_domain, COUNT(*) as nombre_reponses
FROM submissions_with_institutions 
WHERE institution_deduite = 'Structure non répertoriée'
GROUP BY email_domain;
```

### **Exclusion Emails Personnels**
Toutes les vues excluent automatiquement :
- gmail.com, hotmail.com, outlook.com, yahoo.com, bluewin.ch
- Via le flag `inclure_stats_institutionnelles = 1`

### **Export pour Analyses Externes**
Les résultats des requêtes peuvent être :
- Copiés depuis l'interface Cloudflare
- Exportés via l'API d'export déjà implémentée
- Intégrés dans vos outils d'analyse (Excel, SPSS, R, etc.)

## 🔧 **Maintenance**

### **Ajout d'une Nouvelle Institution**
1. Identifiez le domaine : `SELECT * FROM submissions_with_institutions WHERE institution_deduite = 'Structure non répertoriée'`
2. Modifiez le fichier `create_institution_views.sql`
3. Ajoutez le CASE WHEN pour le nouveau domaine
4. Re-exécutez le script SQL modifié

### **Mise à Jour des Vues**
Si vous modifiez les vues :
```sql
-- Supprimer puis recréer
DROP VIEW IF EXISTS submissions_with_institutions;
-- Puis exécuter le nouveau script create_institution_views.sql
```

## 📞 **Support**

### **Guide Complet**
Consultez `queries_guide.md` pour :
- 20+ requêtes prêtes à l'emploi
- Analyses sectorielles approfondies
- Comparaisons institutionnelles
- Requêtes de découverte

### **Résolution de Problèmes**
- **Vues manquantes** : Re-exécutez `create_institution_views.sql`
- **Données incohérentes** : Vérifiez les emails avec des typos
- **Performances lentes** : Limitez avec `LIMIT 100` pour les tests

---

## 🎉 **Vous êtes prêt !**

Avec ces outils, vous pouvez maintenant :
✅ **Analyser par institution** sans interface web  
✅ **Comparer les perceptions** entre structures  
✅ **Extraire des données ciblées** pour analyses externes  
✅ **Découvrir des patterns** institutionnels  

**Commencez par :** `SELECT * FROM repartition_institutions;`
