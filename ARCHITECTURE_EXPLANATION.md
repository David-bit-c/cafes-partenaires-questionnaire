# Architecture de l'Application "Retour sur les Cafés Partenaires"

## 1. Vue d'ensemble

Cette application est une "single-page application" (SPA) full-stack conçue pour recueillir et analyser les retours des professionnels sur l'initiative "Cafés Partenaires". Elle est composée de deux parties distinctes mais connectées :

1.  **Un Frontend React** : Construit avec Vite, il offre une interface moderne et réactive pour remplir le questionnaire et visualiser les résultats.
2.  **Un Backend FastAPI** : Une API Python légère et performante qui gère la réception, le stockage et la distribution des données des soumissions.

L'ensemble du projet est pensé pour être simple, robuste et facilement maintenable.

---

## 2. Architecture Frontend (React + Vite)

Le frontend est le cœur de l'interaction utilisateur. Il est construit sur un écosystème moderne basé sur Vite.

### a. Configuration et Build

-   **Build Tool** : **Vite** est utilisé pour le serveur de développement (avec Hot-Reload) et pour le build de production. La configuration dans `vite.config.ts` gère les variables d'environnement (notamment la clé API pour Gemini) et les alias de chemin.
-   **Dépendances Clés** (`package.json`) :
    -   `react` & `react-dom` : La base de l'interface utilisateur.
    -   `react-hook-form` : Pour une gestion robuste et performante des formulaires complexes.
    -   `recharts` : Pour la création de graphiques interactifs et de visualisations de données.
    -   `tailwindcss` : Pour le système de design et de style.

### b. Structure des Fichiers `src/`

-   **`App.tsx`** : Le composant racine qui gère la navigation principale entre la page du questionnaire et la page des résultats.
-   **`components/`** : Contient tous les composants React.
    -   `QuestionnaireForm.tsx` : Le composant central qui contient toute la logique du formulaire multi-étapes, y compris la navigation conditionnelle entre les sections.
    -   `ResultsDashboard.tsx` : Le composant qui affiche les données agrégées. Il contient la logique de traitement des données brutes pour les transformer en formats compatibles avec les graphiques `recharts`.
    -   `ui/` : Regroupe les composants d'interface de base, comme les `Card`.
    -   `icons.tsx` : Centralise toutes les icônes SVG utilisées dans l'application.
-   **`services/`** : Isole la communication avec les API externes.
    -   `apiService.ts` : Contient les fonctions `fetch` pour communiquer avec le backend FastAPI (récupérer et envoyer les soumissions).
-   **`types.ts`** : Fichier crucial qui définit les structures de données TypeScript, notamment l'interface `Submission`, assurant la cohérence des données à travers toute l'application.

### c. Design System (Tailwind CSS)

-   La configuration se trouve dans `tailwind.config.js`.
-   Le projet utilise un système de **theming basé sur des variables CSS**, ce qui permet de définir une palette de couleurs (`primary`, `secondary`, `destructive`, etc.) de manière centralisée et flexible.
-   Des **animations personnalisées** (`keyframes`) sont définies pour créer une expérience utilisateur dynamique et fluide.
-   Le plugin `tailwindcss-animate` est utilisé pour faciliter l'implémentation de ces animations.

---

### Note sur l’évolution du filtre MultiSelect (2024)

- Le composant `MultiSelect` (utilisé dans `ResultsDashboard.tsx`) a fait l’objet d’un audit approfondi pour garantir une expérience utilisateur optimale.
- Après plusieurs retours utilisateurs, la gestion des événements de sélection a été revue : le handler de sélection est désormais basé sur `onClick` (et non plus `onSelect`), ce qui assure la compatibilité avec tous les navigateurs et environnements.
- L’accessibilité et l’ergonomie ont été renforcées : ajout du curseur main (`cursor-pointer`), vérification des attributs d’accessibilité, et contrôle de l’absence de styles bloquants.
- Malgré ces corrections, un problème de sélection persiste en local pour une raison indéterminée (cache navigateur ou spécificité de l’environnement de développement).
- Ce composant reste robuste, réutilisable et documenté pour toute évolution future.

---

## 3. Architecture Backend (FastAPI)

Le backend est une API Python simple mais puissante, construite avec le framework FastAPI.

### a. Point d'Entrée (`main.py`)

-   **Initialisation de FastAPI** : Le fichier `main.py` crée l'instance de l'application FastAPI.
-   **CORS (Cross-Origin Resource Sharing)** : Il configure le middleware `CORSMiddleware` pour autoriser les requêtes provenant du serveur de développement frontend (ex: `http://localhost:5173`), ce qui est essentiel pour la communication entre le front et le back en local.
-   **Création de la Base de Données** : Au démarrage, l'instruction `Base.metadata.create_all(bind=engine)` s'assure que toutes les tables définies dans les modèles SQLAlchemy sont créées dans la base de données si elles n'existent pas.
-   **Routage** : Il inclut le routeur défini dans `routers/submissions.py`, rendant les endpoints de ce dernier accessibles.

### b. Gestion des Données

-   **Base de Données (`database.py`)** :
    -   Le projet utilise **SQLite** comme système de base de données, ce qui est parfait pour un déploiement simple et une gestion locale des données.
    -   Il configure l'engine `SQLAlchemy` et la gestion des sessions de base de données via la dépendance `get_db`.
-   **Modèle de Données (`models.py`)** :
    -   Définit la table `submissions_cafes_partenaires` via un modèle SQLAlchemy (`Submission`).
    -   La table contient une colonne `data` de type `Text`. Cette colonne stocke l'intégralité des réponses du formulaire sous forme de **chaîne JSON**. Cette approche est très flexible, car elle permet de modifier le questionnaire sans avoir besoin de changer le schéma de la base de données.
-   **Endpoints de l'API (`routers/submissions.py`)** :
    -   `POST /api/submissions` : Cet endpoint reçoit les données du formulaire envoyées par le frontend. Il prend le dictionnaire de données, le convertit en une chaîne JSON, et le sauvegarde dans la colonne `data` de la table `submissions`.
    -   `GET /api/submissions` : Cet endpoint récupère toutes les soumissions de la base de données, lit la chaîne JSON de la colonne `data`, la reconvertit en un objet Python/JSON, et renvoie la liste complète au frontend pour affichage sur le dashboard.

## 4. Flux de Données Complet

1.  L'utilisateur remplit le **`QuestionnaireForm.tsx`** dans le frontend React.
2.  À la soumission, les données du formulaire sont envoyées via `apiService.ts` à l'endpoint `POST /api/submissions` du backend FastAPI.
3.  Le backend reçoit les données, les sérialise en JSON et les enregistre dans la base de données **SQLite**.
4.  Lorsque l'utilisateur consulte la page des résultats, le frontend appelle l'endpoint `GET /api/submissions`.
5.  Le backend récupère toutes les soumissions, les désérialise et les renvoie au frontend.
6.  Le composant **`ResultsDashboard.tsx`** reçoit les données brutes, les traite et les utilise pour afficher des graphiques pertinents avec `recharts`.
