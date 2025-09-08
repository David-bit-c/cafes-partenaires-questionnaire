# 📊 Guide de Monitoring - CAP Formations

## 🎯 SURVEILLANCE EN TEMPS RÉEL

### Endpoint de Santé Principal
```
GET https://votre-site.pages.dev/api/health
```

**Statuts Possibles :**
- ✅ `200` : Système en parfaite santé
- ⚠️ `207` : Problèmes mineurs détectés
- 🔴 `503` : Problèmes critiques

---

## 📋 CONTRÔLES AUTOMATIQUES

### 🔗 Connectivité Base de Données
- **Test** : Requête ping vers D1
- **Seuil** : < 500ms réponse
- **Action** : Alert si > 1000ms

### 📊 Statistiques de Données
- **Métrique** : Nombre total/24h de soumissions
- **Surveillance** : Croissance anormale
- **Alert** : Aucune soumission pendant 48h

### 🔍 Intégrité des Données
- **Test** : Validation JSON de tous les enregistrements
- **Seuil Critique** : < 85% données valides
- **Seuil Warning** : < 95% données valides

### 🗄️ Vues SQL Institutions
- **Vérification** : Présence des vues d'analyse
- **Status** : Installées/Non-installées
- **Impact** : Pas critique, juste informatif

---

## 🚨 ALERTES ET NOTIFICATIONS

### Méthode 1: Monitoring Manuel
```bash
# Vérification rapide quotidienne
curl -s https://votre-site.pages.dev/api/health | jq '.global_status'

# Résultat attendu: "healthy"
```

### Méthode 2: Script d'Alerte
```bash
#!/bin/bash
# health-monitor.sh

HEALTH_URL="https://votre-site.pages.dev/api/health"
STATUS=$(curl -s $HEALTH_URL | jq -r '.global_status')

if [ "$STATUS" != "healthy" ]; then
    echo "ALERT: Système CAP Formations en état: $STATUS"
    echo "Détails: $HEALTH_URL"
    # Envoyer email/SMS/Slack selon votre infrastructure
fi
```

### Méthode 3: Monitoring Externe (RECOMMANDÉ)

#### UptimeRobot (Gratuit)
1. Créer compte sur [uptimerobot.com](https://uptimerobot.com)
2. Ajouter monitor HTTP(S)
3. URL: `https://votre-site.pages.dev/api/health`
4. Interval: 5 minutes
5. Alertes: Email/SMS si status ≠ 200

#### Pingdom/StatusCake
- Configuration similaire
- Surveillance 24/7
- Alertes multi-canaux

---

## 📈 MÉTRIQUES À SURVEILLER

### 🔢 Métriques Critiques
| Métrique | Seuil Normal | Seuil Alert |
|----------|--------------|-------------|
| Temps réponse DB | < 500ms | > 1000ms |
| Données valides | > 95% | < 85% |
| Soumissions/24h | Variable | 0 pendant 48h |
| Connectivité | 100% | < 99% |

### 📊 Tendances à Analyser
- **Croissance soumissions** : Pic = période de collecte
- **Performance DB** : Dégradation = besoin optimisation
- **Erreurs JSON** : Spike = problème frontend

---

## 🔧 ACTIONS CORRECTIVES

### 🟢 Statut "Warning"
1. **Vérifier** : Logs dans Cloudflare Dashboard
2. **Analyser** : Recommandations dans réponse health
3. **Surveiller** : Évolution sur 2-4 heures
4. **Backup** : Créer sauvegarde par précaution

### 🔴 Statut "Critical"
1. **BACKUP IMMÉDIAT** : `/api/backup`
2. **Investigation** : Cloudflare D1 Console
3. **Rollback** : Si récent déploiement
4. **Support** : Contact Cloudflare si persistant

---

## 🎛️ DASHBOARD PERSONNALISÉ

### Option A: Simple (JSON)
```bash
# Créer rapport quotidien
curl -s https://votre-site.pages.dev/api/health | jq '{
  status: .global_status,
  total_records: .checks.data_statistics.total_submissions,
  last_24h: .checks.data_statistics.last_24h_submissions,
  data_quality: .checks.data_integrity.valid_json_percentage
}'
```

### Option B: Grafana/Dashboard
```yaml
# Exemple configuration Grafana
- targets:
    - expr: 'probe_success{job="cap-formations-health"}'
      legendFormat: "Service Status"
    - expr: 'probe_duration_seconds{job="cap-formations-health"}'
      legendFormat: "Response Time"
```

---

## 📞 ESCALADE ET SUPPORT

### Niveau 1: Auto-Diagnostic
1. Consulter `/api/health`
2. Lire `recommendations`
3. Appliquer actions suggérées

### Niveau 2: Investigation
1. Cloudflare Dashboard → D1 → Metrics
2. Pages → Analytics → Function Logs
3. GitHub → Actions (si déploiement récent)

### Niveau 3: Support Expert
1. **Backup des données** (obligatoire)
2. **Documentation du problème** (timestamps, erreurs)
3. **Contact** : Support Cloudflare ou développeur

---

## 💡 BONNES PRATIQUES

### ✅ À FAIRE
- **Vérifier santé** quotidiennement
- **Configurer alertes** externes
- **Suivre les tendances** hebdomadaires
- **Tester réponse** incidents

### ❌ À ÉVITER
- Ignorer les warnings
- Attendre que ça devienne critique
- Modifier sans backup
- Paniquer sans investigation

---

**🎯 Objectif** : Détection précoce et résolution rapide de tout problème !
