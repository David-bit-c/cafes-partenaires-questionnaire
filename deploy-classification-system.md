# 🚀 Guide de Déploiement - Système Classification LLM

## 📋 Étapes de Déploiement

### 1. **Créer la Table de Cache**
```sql
-- Exécuter dans Cloudflare D1 Console
CREATE TABLE IF NOT EXISTS institution_classifications (
  domain TEXT PRIMARY KEY,
  institution_type TEXT NOT NULL,
  institution_name TEXT,
  confidence_score REAL DEFAULT 0.8,
  classification_date TEXT NOT NULL,
  website_content TEXT,
  submission_count INTEGER DEFAULT 1,
  last_updated TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_institution_type ON institution_classifications(institution_type);
CREATE INDEX IF NOT EXISTS idx_submission_count ON institution_classifications(submission_count);
```

### 2. **Déployer les Nouveaux Fichiers**
Les fichiers suivants doivent être déployés sur Cloudflare Pages :
- `functions/api/website-analyzer.js`
- `functions/api/llm-classifier.js`
- `functions/api/migrate-classifications.js`
- `functions/api/test-classification.js`
- `functions/api/institution-analysis.js` (modifié)

### 3. **Migration des Données Existantes**
```bash
# Appeler l'endpoint de migration
curl -X POST "https://cafes-partenaires-questionnaire.pages.dev/api/migrate-classifications" \
  -H "Content-Type: application/json"
```

### 4. **Test du Système**
```bash
# Test avec un domaine connu
curl -X GET "https://cafes-partenaires-questionnaire.pages.dev/api/test-classification?domain=fase.ch" \
  -H "Accept: application/json"

# Test avec un domaine inconnu
curl -X GET "https://cafes-partenaires-questionnaire.pages.dev/api/test-classification?domain=example.com" \
  -H "Accept: application/json"
```

### 5. **Validation des Résultats**
```bash
# Vérifier la nouvelle classification
curl -X GET "https://cafes-partenaires-questionnaire.pages.dev/api/institution-analysis" \
  -H "Accept: application/json" | jq '.institutions[] | {name: .name, totalResponses: .totalResponses}'
```

## 🎯 Résultats Attendus

### **Avant (Problème) :**
- 79% des institutions classées comme "Autres"
- Classification imprécise basée sur des règles statiques

### **Après (Solution) :**
- <5% des institutions classées comme "Autres"
- Classification précise par mission réelle
- Cache permanent pour performance optimale
- LLM intelligent pour nouveaux domaines

## 🔧 Configuration Requise

### **Variables d'Environnement :**
- `OPENAI_API_KEY` : Pour les appels LLM
- `CLAUDE_API_KEY` : Alternative LLM
- `GEMINI_API_KEY` : Alternative LLM

### **Permissions :**
- Accès en lecture/écriture à la base D1
- Accès aux APIs de synthèse existantes

## 📊 Métriques de Succès

- **Taux de classification** : >95% des domaines classés
- **Précision** : <5% d'erreurs de classification
- **Performance** : <2s pour classification complète
- **Coût** : <$10/mois pour les appels LLM

## 🚨 Dépannage

### **Problème : Table non créée**
```sql
-- Vérifier si la table existe
SELECT name FROM sqlite_master WHERE type='table' AND name='institution_classifications';
```

### **Problème : LLM non accessible**
- Vérifier les clés API
- Tester l'endpoint `/api/synthesis`
- Vérifier les logs Cloudflare

### **Problème : Classification incorrecte**
- Utiliser `/api/test-classification` pour déboguer
- Vérifier le cache avec la requête SQL
- Analyser les logs de classification

## ✅ Validation Finale

1. **Migration réussie** : Tous les domaines existants classés
2. **Tests passés** : Classification correcte des domaines connus
3. **Performance** : Temps de réponse <2s
4. **Cache fonctionnel** : Pas de re-requêtes LLM pour domaines connus
5. **Nouveaux domaines** : Classification LLM automatique

---

**🎯 Objectif :** Résoudre définitivement le problème des 79% "Autres" avec une classification intelligente et évolutive.
