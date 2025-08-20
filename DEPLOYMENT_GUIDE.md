# Guide de Déploiement - CAP Formations Questionnaire

## ✅ Application Fonctionnelle

L'application est maintenant **entièrement fonctionnelle** avec :
- Interface moderne (cartes blanches, sliders interactifs)
- Backend FastAPI + SQLite opérationnel  
- Build de production prêt

## 🚀 Options de Déploiement

### Option 1: Netlify (Recommandé pour Frontend-only)
1. **Build local:** `npm run build`
2. **Upload:** Glisser le dossier `dist/` sur netlify.com
3. **Configuration:** Le fichier `netlify.toml` est prêt

### Option 2: Vercel (Full-stack)
1. **Connecter GitHub:** Lier votre repo
2. **Configuration:** Le fichier `vercel.json` gère frontend + backend
3. **Variables d'env:** Ajouter `VITE_API_URL` dans les settings

### Option 3: Docker (Hébergement personnel)
```bash
# Build l'image
docker build -t cap-formations .

# Lancer le conteneur
docker run -p 8000:8000 cap-formations
```

### Option 4: Deployment séparé Frontend/Backend

#### Frontend (Netlify/Vercel)
```bash
npm run build
# Upload le dossier dist/
```

#### Backend (Railway/Heroku/DigitalOcean)
```bash
cd formanova-api
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🔧 Variables d'Environnement

Créer un fichier `.env` avec :
```env
VITE_API_URL=https://votre-backend.com/api
GEMINI_API_KEY=optional_pour_ia_future
```

## ⚡ Test Rapide

**Local:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5174  
- Test: Remplir le formulaire → Voir les résultats

**Production:**
- Mettre à jour `VITE_API_URL` vers l'URL backend de production
- Rebuild: `npm run build`

## 🎯 Prochaine Étape Immédiate

**Pour mise en ligne rapide:**
1. Créer compte Netlify
2. `npm run build` 
3. Glisser le dossier `dist/` sur Netlify
4. Backend temporaire: Garder localhost:5174 pour les tests
5. Backend production: Déployer sur Railway/Heroku après

L'application est **prête à être mise en ligne** ! 🚀