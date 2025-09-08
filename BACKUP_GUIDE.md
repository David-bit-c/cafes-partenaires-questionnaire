# 🔄 Guide de Sauvegarde - CAP Formations

## 🎯 SAUVEGARDES AUTOMATIQUES

### Méthode 1: Via Interface Web (RECOMMANDÉ)
```
URL: https://votre-site.pages.dev/api/backup
```
**Résultat** : Téléchargement automatique d'un fichier JSON avec toutes les données

### Méthode 2: Via Commande
```bash
curl -o backup-$(date +%Y%m%d).json https://votre-site.pages.dev/api/backup
```

---

## 🗓️ PLANNING DE SAUVEGARDE RECOMMANDÉ

### 📅 Fréquence par Volume
- **0-50 questionnaires** : 1x/semaine
- **50-200 questionnaires** : 2x/semaine  
- **200-500 questionnaires** : 1x/jour
- **500+ questionnaires** : 2x/jour

### ⏰ Moments Optimaux
- **Avant** les envois massifs de questionnaires
- **Après** les périodes de forte collecte
- **Avant** toute modification technique majeure

---

## 💾 MÉTHODES DE STOCKAGE

### Option A: Local + Cloud (SÉCURISÉ)
```bash
# Téléchargement local
curl -o backup-$(date +%Y%m%d).json https://votre-site.pages.dev/api/backup

# Upload Google Drive/Dropbox
# (Manuel ou automatisé selon vos outils)
```

### Option B: Script Automatisé
```bash
#!/bin/bash
# backup-auto.sh
DATE=$(date +%Y%m%d-%H%M)
curl -o "backups/backup-$DATE.json" https://votre-site.pages.dev/api/backup
echo "Backup créé: backup-$DATE.json"
```

---

## 🔄 RESTAURATION D'URGENCE

### ⚠️ ATTENTION : PROCÉDURE DESTRUCTIVE
La restauration **REMPLACE** toutes les données existantes.

### Étapes de Restauration
1. **Préparer le fichier** : backup valide au format JSON
2. **Tester d'abord** : Utiliser une base de test si possible
3. **Exécuter** :
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d @backup-file.json \
  https://votre-site.pages.dev/api/backup
```

---

## 📊 VALIDATION DES BACKUPS

### Vérification Automatique
Chaque backup contient :
- **metadata** : Informations sur la sauvegarde
- **data_validation** : Statistiques de qualité
- **submissions** : Données complètes

### Contrôles à Effectuer
```bash
# Vérifier la structure
jq '.metadata.total_records' backup.json

# Contrôler la validité JSON
jq '.data_validation.invalid_json_count' backup.json

# Voir le taux de réussite
jq '.data_validation.valid_json_count / .metadata.total_records' backup.json
```

---

## 🚨 ALERTES ET MONITORING

### Indicateurs à Surveiller
- **Taille backup** : Croissance anormale = problème
- **Records invalides** : > 1% = investigation requise
- **Échecs backup** : 0 tolérance

### Actions si Problème Détecté
1. **Backup immédiat** avant investigation
2. **Vérification logs** Cloudflare
3. **Test restauration** sur environnement test
4. **Contact support** si persistant

---

## 💡 BONNES PRATIQUES

### ✅ À FAIRE
- Conserver **3 backups minimum** (rotation)
- Tester la **restauration** régulièrement
- Sauvegarder **avant toute modification**
- Stocker en **plusieurs emplacements**

### ❌ À ÉVITER
- Compter uniquement sur Cloudflare
- Négliger la validation des backups
- Oublier de nettoyer les anciens backups
- Restaurer sans vérification préalable

---

## 🔧 AUTOMATISATION AVANCÉE

### GitHub Actions (Optionnel)
```yaml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2h du matin tous les jours
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create Backup
        run: |
          curl -o backup-$(date +%Y%m%d).json ${{ secrets.BACKUP_URL }}
          # Upload vers stockage sécurisé
```

### Cron Local
```bash
# Ajouter à crontab -e
0 2 * * * /path/to/backup-script.sh >> /var/log/cap-backup.log 2>&1
```

---

**🎯 Objectif** : Zéro perte de données avec des sauvegardes fiables et testées !
