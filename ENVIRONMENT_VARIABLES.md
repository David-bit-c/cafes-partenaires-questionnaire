# Variables d'environnement - Questionnaire CAP Formations

## Configuration requise

### Base de données D1
- Configurée automatiquement dans Cloudflare Pages
- Aucune variable d'environnement nécessaire

### APIs IA pour synthèse

#### Google Gemini (recommandé)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

#### OpenAI (fallback)
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Logique de fonctionnement

### Configuration des clés API
- **Gemini seul** : Utilise uniquement Gemini
- **OpenAI seul** : Utilise uniquement OpenAI  
- **Les deux** : Gemini avec fallback automatique vers OpenAI
- **Aucune** : Erreur de configuration

### Choix du modèle via interface admin
1. **Auto** : Essaie Gemini → bascule sur OpenAI si échec
2. **Gemini** : Force l'utilisation de Gemini uniquement
3. **OpenAI** : Force l'utilisation d'OpenAI uniquement

## Configuration dans Cloudflare Pages

1. Aller dans **Pages** → **Votre projet** → **Settings** → **Environment variables**
2. Ajouter les variables :
   - `GEMINI_API_KEY` : Votre clé API Google Gemini
   - `OPENAI_API_KEY` : Votre clé API OpenAI (optionnel)

## Sécurité

- Les clés API sont stockées de manière sécurisée dans Cloudflare
- Aucune clé n'est exposée côté client
- L'accès au choix du modèle est protégé par mot de passe admin
