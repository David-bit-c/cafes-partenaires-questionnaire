# 🚨 Plan de Récupération d'Urgence - CAP Formations

## 🎯 SCÉNARIOS DE CATASTROPHE

### 🔴 Scénario 1: Perte Complète Base D1
**Cause** : Suppression accidentelle, corruption, problème Cloudflare  
**Impact** : Perte de tous les questionnaires  
**Probabilité** : Très faible  
**RTO** : 2 heures max  

### 🟠 Scénario 2: Corruption Partielle Données
**Cause** : Bug code, problème réseau pendant écriture  
**Impact** : Questionnaires récents corrompus  
**Probabilité** : Faible  
**RTO** : 30 minutes  

### 🟡 Scénario 3: Site Web Inaccessible
**Cause** : Problème déploiement, Cloudflare Pages down  
**Impact** : Collecte questionnaires impossible  
**Probabilité** : Modérée  
**RTO** : 15 minutes  

### 🟢 Scénario 4: Lenteur/Dégradation
**Cause** : Surcharge, problème performance  
**Impact** : Expérience utilisateur dégradée  
**Probabilité** : Élevée en période de pic  
**RTO** : 5 minutes  

---

## 🔧 PROCÉDURES DE RÉCUPÉRATION

### 🔴 URGENCE: Récupération Base D1

#### Étape 1: Évaluation Rapide (5 min)
```bash
# Test connectivité
curl -s https://votre-site.pages.dev/api/health

# Si erreur 503/404, aller étape 2
# Si 200 mais données manquantes, aller étape 3
```

#### Étape 2: Vérification Infrastructure
1. **Cloudflare Dashboard** → D1 Database
2. **Vérifier statut** : Service disponible ?
3. **Console D1** : `SELECT COUNT(*) FROM submissions;`
4. **Si 0 records** : Base vidée → Restauration backup

#### Étape 3: Restauration d'Urgence
```bash
# Localiser dernier backup valide
ls -la backups/ | head -5

# Restaurer (ATTENTION: efface tout)
curl -X POST \
  -H "Content-Type: application/json" \
  -d @backup-YYYYMMDD.json \
  https://votre-site.pages.dev/api/backup

# Vérifier restauration
curl -s https://votre-site.pages.dev/api/health | jq '.checks.data_statistics'
```

#### Étape 4: Tests Post-Restauration
- [ ] Soumettre questionnaire test
- [ ] Vérifier dashboard résultats
- [ ] Tester export données
- [ ] Valider vues SQL

**⏱️ Temps total: 15-30 minutes**

---

### 🟠 CORRUPTION: Nettoyage Données

#### Diagnostic Corruption
```bash
# Rapport intégrité
curl -s https://votre-site.pages.dev/api/health | jq '.checks.data_integrity'

# Si valid_json_percentage < 85%, action requise
```

#### Nettoyage Sélectif
```sql
-- Via Cloudflare D1 Console
-- Identifier enregistrements corrompus
SELECT id, created_at, length(data), 
       CASE WHEN json_valid(data) THEN 'OK' ELSE 'CORRUPT' END as status
FROM submissions 
WHERE json_valid(data) = 0;

-- Backup avant suppression
-- Puis supprimer corrompus (si acceptable)
DELETE FROM submissions WHERE json_valid(data) = 0;
```

#### Restauration Partielle
```bash
# Si corruption trop importante
# Restaurer depuis backup + re-saisie données perdues
```

---

### 🟡 SITE INACCESSIBLE: Rollback/Réparation

#### Diagnostic Rapide
1. **Status Cloudflare** : [cloudflarestatus.com](https://cloudflarestatus.com)
2. **GitHub Actions** : Échec build récent ?
3. **Pages Dashboard** : Logs d'erreur ?

#### Rollback Déploiement
```bash
# Via Cloudflare Dashboard
Pages → Deployments → [Previous working] → Rollback

# Ou via Git
git log --oneline -5
git reset --hard [COMMIT_WORKING]
git push --force-with-lease
```

#### Solution Alternative d'Urgence
```html
<!-- Page de maintenance simple -->
<!DOCTYPE html>
<html>
<head><title>Maintenance CAP Formations</title></head>
<body>
  <h1>🔧 Maintenance en cours</h1>
  <p>Le questionnaire sera à nouveau disponible sous peu.</p>
  <p>Merci de revenir dans 15-30 minutes.</p>
</body>
</html>
```

---

### 🟢 DÉGRADATION: Optimisation d'Urgence

#### Actions Immédiates
```bash
# Vérifier charges
curl -s https://votre-site.pages.dev/api/health | jq '.checks[].response_time_ms'

# Si > 1000ms, problème performance
```

#### Optimisations Temporaires
1. **Désactiver** features non-critiques
2. **Réduire** fréquence requêtes dashboard
3. **Simplifier** requêtes SQL complexes
4. **Cache** résultats temporairement

---

## 📞 CONTACTS D'URGENCE

### Support Technique
- **Cloudflare Support** : [support.cloudflare.com](https://support.cloudflare.com)
- **GitHub Support** : Si problème repository

### Escalade Interne
1. **Administrateur technique** (vous)
2. **Responsable CAP Formations**
3. **Direction** (si impact majeur)

### Développeur/Consultant
- **Contact** : [À définir]
- **Disponibilité** : [À définir]
- **SLA** : [À définir]

---

## 📋 CHECKLIST POST-INCIDENT

### ✅ Vérifications Techniques
- [ ] Service complètement restauré
- [ ] Tous tests fonctionnels passent
- [ ] Performance normale
- [ ] Monitoring confirme santé
- [ ] Backup post-incident créé

### 📝 Documentation
- [ ] Incident documenté (cause, impact, durée)
- [ ] Actions correctives notées
- [ ] Améliorations identifiées
- [ ] Procédures mises à jour

### 🔄 Améliorations
- [ ] Analyse cause racine
- [ ] Prévention répétition
- [ ] Tests procédures récupération
- [ ] Formation équipe

---

## 🎯 MÉTRIQUES DE RÉCUPÉRATION

### Objectifs (SLA)
- **RTO** (Recovery Time Objective)
  - Critique: 2h max
  - Important: 30min max
  - Normal: 15min max

- **RPO** (Recovery Point Objective)
  - Perte données: 0 (grâce backups)
  - Questionnaires en cours: Acceptable

### Indicateurs de Succès
- ✅ Service restauré dans RTO
- ✅ Aucune donnée perdue
- ✅ Utilisateurs peuvent continuer
- ✅ Confiance préservée

---

## 💡 PRÉVENTION

### Bonnes Pratiques Opérationnelles
- **Backups automatiques** quotidiens
- **Monitoring proactif** 24/7
- **Tests récupération** mensuels
- **Formation équipe** régulière

### Redondance Future
- **Base secondaire** (optionnel)
- **Monitoring externe** (recommandé)
- **Documentation à jour** (critique)

---

**🚨 EN CAS D'URGENCE: Rester calme, suivre procédures, documenter !**
