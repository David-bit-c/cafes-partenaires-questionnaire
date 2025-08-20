# 🚀 Déploiement Cloudflare Pages - CAP Formations

## 📋 Prérequis

1. **Compte Cloudflare** gratuit : [cloudflare.com](https://cloudflare.com)
2. **Repository GitHub** avec le code
3. **Wrangler CLI** (optionnel) : `npm install -g wrangler`

## 🎯 Méthode 1: Déploiement via Dashboard (Recommandé)

### Étape 1: Connecter GitHub
1. Aller sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages** → **Create a project** → **Connect to Git**
3. Authoriser Cloudflare à accéder à votre GitHub
4. Sélectionner le repository `cap-formations-questionnaire`

### Étape 2: Configuration Build
```yaml
Build command: npm run build
Build output directory: dist
Root directory: (leave empty)
Environment variables:
  - NODE_VERSION: 18
  - VITE_API_URL: https://your-backend-url.com/api
```

### Étape 3: Déploiement Automatique
- ✅ **Push sur main** → Déploiement auto
- ✅ **Pull requests** → Preview automatique  
- ✅ **URL personnalisée** disponible

## ⚡ Méthode 2: CLI Wrangler (Développeurs)

### Installation & Login
```bash
npm install -g wrangler
wrangler login
```

### Déploiement Direct
```bash
# Build du projet
npm run build

# Déploiement
wrangler pages deploy dist --project-name cap-formations-questionnaire
```

### Déploiement Continu
```bash
# Lier le projet
wrangler pages project create cap-formations-questionnaire

# Auto-déploiement sur chaque push
git push # → Déploiement automatique
```

## 🔧 Configuration Backend

### Option A: Backend séparé (Recommandé)
1. Déployer le backend Python sur **Railway/Heroku**
2. Mettre à jour `VITE_API_URL` dans Cloudflare
3. Configurer CORS pour accepter votre domaine Cloudflare

### Option B: Cloudflare Workers (Avancé)
```bash
cd formanova-api
wrangler deploy
# Configure automatiquement l'API sur Cloudflare Workers
```

## 🌐 URLs & Domaines

### URLs par défaut
- **Production**: `https://cap-formations-questionnaire.pages.dev`
- **Preview**: `https://[branch].cap-formations-questionnaire.pages.dev`

### Domaine personnalisé
1. **Pages** → **Custom domains**
2. Ajouter `questionnaire.cap-formations.com`
3. DNS automatiquement configuré

## 📊 Monitoring & Analytics

### Métriques incluses
- ✅ **Web Analytics** gratuit
- ✅ **Core Web Vitals**
- ✅ **Geographic insights**
- ✅ **Real User Monitoring**

### Activation
```bash
# Dans le dashboard Cloudflare
Pages → Analytics → Enable Web Analytics
```

## 🔒 Sécurité & Performance

### Fonctionnalités automatiques
- ✅ **SSL/TLS** automatique
- ✅ **CDN global** (200+ locations)
- ✅ **DDoS protection**
- ✅ **Compression automatique**
- ✅ **HTTP/2 & HTTP/3**

### Optimisations
```toml
# wrangler.toml (déjà configuré)
[build]
command = "npm run build"
watch_dir = "src"

[[pages]]
directory = "dist"
```

## 🚀 Démarrage Rapide (2 minutes)

1. **Fork/Clone** ce repository
2. **Push sur GitHub**
3. **Cloudflare Dashboard** → Pages → Connect Git
4. **Configure build** : `npm run build` + `dist`
5. **Deploy** ! 

Votre site sera en ligne à : `https://votre-projet.pages.dev`

## 💡 Conseils Pro

### Performance
- Images automatiquement optimisées
- Cache agressif pour les assets statiques
- Compression Brotli activée

### Développement
- **Preview URLs** pour chaque PR
- **Rollback** instantané vers versions précédentes
- **A/B testing** avec traffic splitting

### Monitoring
```bash
# Logs en temps réel
wrangler pages deployment tail

# Métriques
wrangler pages deployment list
```

## 🆘 Troubleshooting

### Build fails
```bash
# Tester localement d'abord
npm run build
npm run preview
```

### Variables d'environnement
```bash
# Via CLI
wrangler pages secret put VITE_API_URL

# Via Dashboard
Pages → Settings → Environment variables
```

### Performance
- Utiliser le **Cache API** pour les données
- Optimiser les images avec **Cloudflare Images**
- Activer **Argo Smart Routing** (payant mais ultra-rapide)

---

**🎯 Résultat**: Site ultra-rapide, sécurisé, avec déploiement automatique et analytics intégrés !