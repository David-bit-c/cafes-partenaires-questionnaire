# GUIDE TECHNIQUE - RÉFÉRENCE DÉVELOPPEMENT
## Projet "Retour sur les cafés partenaires"

**Version :** 1.0 | **Usage :** Référence technique quotidienne

---

## 🚨 ERREURS CRITIQUES À ÉVITER

### 1. Configuration PostCSS/Tailwind
**❌ Erreur :** `[postcss] It looks like you're trying to use 'tailwindcss' directly as a PostCSS plugin`

**✅ Configuration correcte :**
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

### 2. Structure de Données Frontend
**❌ Erreur :** Accès direct aux propriétés
```typescript
// INTERDIT
const value = submission.participatedInCafes;
const challenges = submission.challengesRanking;
```

**✅ Structure correcte :**
```typescript
// OBLIGATOIRE
const value = submission.data.participatedInCafes;
const challenges = submission.data.challengesRanking?.sante_mentale ?? 0;

// Toujours utiliser ?. pour les champs optionnels
submission.data.cafesKnowledge?.forEach(item => { ... });
```

### 3. Configuration Réseau
**❌ Erreur :** Ports et URLs hardcodés
```typescript
// INTERDIT
const API_BASE_URL = "http://127.0.0.1:5174/api";
```

**✅ Configuration dynamique :**
```typescript
// OBLIGATOIRE
const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:5174/api";
```

---

## 🛠️ SCRIPTS D'AUTOMATISATION

### Setup Environnement Complet
```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "🚀 Configuration environnement..."

# Vérification prérequis
node --version || { echo "❌ Node.js requis"; exit 1; }
python3 --version || { echo "❌ Python 3 requis"; exit 1; }

# Variables d'environnement
cat > .env.development << EOF
FRONTEND_PORT=5173
BACKEND_PORT=5174
VITE_API_URL=http://localhost:5174
GEMINI_API_KEY=your_key_here
EOF

# Installation
npm ci
cd formanova-api && pip install -r requirements.txt && cd ..

# Vérification config PostCSS
if ! grep -q "@tailwindcss/postcss" postcss.config.js; then
    echo "❌ Corriger postcss.config.js"
    exit 1
fi

echo "✅ Prêt ! Lancer: npm run dev && uvicorn app.main:app --reload"
```

### Vérification Santé Projet
```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Vérification technique..."

# PostCSS config
if ! grep -q "@tailwindcss/postcss" postcss.config.js; then
    echo "🚨 PostCSS: Configuration incorrecte"
    exit 1
fi

# Structure de données
if grep -r "submission\." src/ --include="*.tsx" | grep -v "submission\.data\."; then
    echo "🚨 Structure: Accès direct aux propriétés détecté"
    exit 1
fi

# Ports hardcodés
if grep -rE "localhost:[0-9]+" src/ --include="*.ts" --include="*.tsx"; then
    echo "⚠️ Réseau: Ports hardcodés détectés"
fi

# Variables d'environnement
if ! grep -q "process.env" src/services/apiService.ts; then
    echo "⚠️ Config: Variables d'environnement non utilisées"
fi

echo "✅ Santé technique OK"
```

---

## 📋 CONFIGURATION STANDARD

### Variables d'Environnement
```bash
# .env.development
FRONTEND_PORT=5173
BACKEND_PORT=5174
VITE_API_URL=http://localhost:5174
GEMINI_API_KEY=your_gemini_key
```

### Package.json - Scripts Utiles
```json
{
  "scripts": {
    "dev": "vite --port ${FRONTEND_PORT:-5173}",
    "setup": "./scripts/setup-dev.sh",
    "health": "./scripts/health-check.sh",
    "clean": "rm -rf node_modules package-lock.json && npm install"
  }
}
```

### Configuration CORS Backend
```python
# formanova-api/app/main.py
import os

origins = [
    f"http://localhost:{os.getenv('FRONTEND_PORT', '5173')}",
    "http://localhost:5173",
    "http://localhost:5175"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔧 TEMPLATES DE CODE

### Service API Robuste
```typescript
// src/services/apiService.ts
const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:5174/api";

export const apiService = {
  async getSubmissions(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/submissions`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        submissions: data.map((s: any) => ({
          id: s.id,
          submittedAt: s.created_at,
          data: s.data // Structure importante
        })),
        summary: '',
        summaryError: ''
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
```

### Composant avec Protection Données
```typescript
// Exemple: Traitement sécurisé des données
const ResultsDashboard: React.FC<Props> = ({ submissions }) => {
  const processedData = useMemo(() => {
    return submissions.map(submission => {
      // ✅ Accès sécurisé aux données
      const participatedInCafes = submission.data.participatedInCafes;
      
      // ✅ Protection contre undefined
      const challenges = submission.data.challengesRanking || {};
      const cafesKnowledge = submission.data.cafesKnowledge || [];
      
      // ✅ Valeurs par défaut
      const impact = challenges.sante_mentale ?? 0;
      
      return {
        participated: participatedInCafes,
        challenges: Object.entries(challenges),
        knowledge: cafesKnowledge
      };
    });
  }, [submissions]);

  // Reste du composant...
};
```

### Types TypeScript Stricts
```typescript
// types.ts - Définitions précises
export interface SubmissionData {
  // OBLIGATOIRE - Toujours présent
  participatedInCafes: 'Oui' | 'Non';
  professionalRole: string;
  email: string;
  
  // CONDITIONNEL - Seulement si participatedInCafes === 'Oui'
  cafesKnowledge?: ('equipes' | 'partenaires')[];
  cafesCommunication?: 'Oui' | 'Non';
  cafesCommunicationReason?: string;
  
  // OPTIONNEL - Peut être undefined
  challengesRanking?: {
    sante_mentale: number;
    precarite: number;
    decrochage: number;
    migration: number;
    addictions: number;
    conflits: number;
  };
  
  observedChallenges?: string[];
  observedChallengesOther?: string;
}

export interface Submission {
  id: string;
  submittedAt: string;
  data: SubmissionData; // Structure claire
}
```

---

## 🐛 DÉBOGAGE RAPIDE

### Problème: PostCSS ne fonctionne pas
```bash
# 1. Vérifier configuration
cat postcss.config.js | grep -E "(tailwindcss|@tailwindcss)"

# 2. Si incorrect, corriger:
cat > postcss.config.js << EOF
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
EOF

# 3. Redémarrer
npm run dev
```

### Problème: Page blanche après soumission
```bash
# 1. Console browser (F12) - chercher erreurs JS
# 2. Vérifier structure de données:
grep -r "submission\." src/ | grep -v "submission\.data"

# 3. Si résultats trouvés, corriger:
# submission.property → submission.data.property
```

### Problème: CORS Error
```bash
# 1. Vérifier ports
lsof -i :5173 && lsof -i :5174

# 2. Vérifier config backend
grep -A 3 "allow_origins" formanova-api/app/main.py

# 3. Redémarrer backend si modifié
cd formanova-api && uvicorn app.main:app --reload
```

### Problème: Serveur ne démarre pas
```bash
# 1. Nettoyer
rm -rf node_modules package-lock.json
npm install

# 2. Vérifier ports libres
kill -9 $(lsof -ti:5173,5174)

# 3. Variables d'environnement
source .env.development
export FRONTEND_PORT=5173
export BACKEND_PORT=5174

# 4. Relancer
npm run dev
```

---

## 📦 COMMANDES UTILES

### Installation Clean
```bash
# Frontend
rm -rf node_modules package-lock.json
npm ci

# Backend
cd formanova-api
pip install --upgrade pip
pip install -r requirements.txt
```

### Tests de Configuration
```bash
# Vérifier structure projet
find . -name "*.tsx" -exec grep -l "submission\." {} \; | head -5

# Vérifier imports
find src/ -name "*.ts*" -exec grep -l "import.*from.*\\.\\." {} \;

# Vérifier variables d'environnement
grep -r "process\.env" src/
```

### Nettoyage Ports
```bash
# Voir qui utilise les ports
lsof -i :5173
lsof -i :5174

# Killer les processus
kill -9 $(lsof -ti:5173)
kill -9 $(lsof -ti:5174)

# Vérifier libération
lsof -i :5173,5174 || echo "Ports libres"
```

---

## 🔍 VALIDATION AVANT COMMIT

### Checklist Technique
```bash
# 1. Build réussit
npm run build

# 2. Pas d'erreurs TypeScript
npx tsc --noEmit

# 3. Structure de données correcte
./scripts/health-check.sh

# 4. Variables d'env utilisées
grep -c "process.env" src/services/apiService.ts
# Doit retourner > 0

# 5. Pas de console.log oubliés
grep -r "console\.log" src/ --include="*.ts*" || echo "Clean"
```

### Tests Fonctionnels Minimum
1. **Démarrage serveurs** : Frontend + Backend sans erreur
2. **Parcours Oui** : Questionnaire → Soumission → Résultats
3. **Parcours Non** : Questionnaire → Soumission → Résultats  
4. **Synthèse IA** : Génération sans crash (si > 3 réponses)

---

## 🗂️ STRUCTURE DE FICHIERS RECOMMANDÉE

```
projet/
├── scripts/
│   ├── setup-dev.sh
│   ├── health-check.sh
│   └── deploy.sh
├── src/
│   ├── services/
│   │   └── apiService.ts (avec variables d'env)
│   ├── components/
│   │   └── ResultsDashboard.tsx (avec protection données)
│   └── types.ts (interfaces strictes)
├── formanova-api/
│   ├── app/
│   │   └── main.py (CORS dynamique)
│   └── requirements.txt
├── .env.development
├── postcss.config.js (configuration correcte)
└── package.json (scripts utiles)
```

---

**💡 Référence technique condensée - Consultez avant chaque session de développement**

**Dernière mise à jour :** Janvier 2025