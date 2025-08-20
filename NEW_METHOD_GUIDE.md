# Guide de Conception et d'Implémentation d'un Système de Questionnaire

Ce document détaille l'architecture et le fonctionnement du système de questionnaire utilisé dans le projet FormaNova. Il est conçu pour être un manuel technique réutilisable pour implémenter un système similaire dans d'autres projets.

## 1. Architecture Générale

Le système est basé sur une architecture découplée avec un backend pour la gestion des données et un frontend pour l'interaction utilisateur.

-   **Frontend** : Une application web monopage (SPA) construite avec **React** et **TypeScript**. Elle utilise la bibliothèque **`react-hook-form`** pour une gestion robuste et performante des formulaires.
-   **Backend** : Une API RESTful développée avec **FastAPI**, un framework web Python moderne.
-   **Base de Données** : Une base de données **SQLite**, qui est légère, sans serveur et stockée dans un seul fichier (`formanova.db`). **SQLAlchemy** est utilisé comme ORM pour interagir avec la base de données de manière simple et sécurisée.
-   **Communication** : Le frontend communique avec le backend via des requêtes HTTP (POST pour envoyer les données, GET pour récupérer des statistiques).

## 2. Partie Backend (API FastAPI)

Le backend est responsable de la réception, de la validation et du stockage des réponses des questionnaires.

### Structure du Projet Backend

Le code du backend est organisé de manière modulaire pour une meilleure maintenabilité :

```
formanova-api/
├── app/
│   ├── core/         # Logique de base (ex: authentification)
│   ├── database/     # Configuration de la base de données
│   ├── models/       # Modèles de données SQLAlchemy
│   ├── routers/      # Fichiers de routes de l'API (endpoints)
│   ├── services/     # Logique métier
│   └── main.py       # Point d'entrée de l'application FastAPI
├── requirements.txt  # Dépendances Python
└── formanova.db      # Fichier de la base de données SQLite
```

### Base de Données (SQLite & SQLAlchemy)

-   **Fichier de configuration (`app/database/database.py`)** : Ce fichier configure la connexion à la base de données SQLite et la session SQLAlchemy.
-   **Modèle de données (`app/models/models.py`)** : Le modèle `Submission` définit la structure de la table qui stocke toutes les réponses. L'approche est **générique** : plutôt que d'avoir une colonne pour chaque question, toutes les réponses d'un formulaire sont stockées dans une seule colonne `data` au format JSON. Une colonne `type` permet de différencier les types de questionnaires (ex: 'youth', 'professional').

    ```python
    # app/models/models.py
    from sqlalchemy import Column, Integer, String, Text
    from app.database.database import Base

    class Submission(Base):
        __tablename__ = "submissions"

        id = Column(Integer, primary_key=True, index=True)
        type = Column(String, index=True)  # 'youth' or 'professional'
        data = Column(Text)  # JSON data
        # ... autres colonnes comme created_at
    ```

### Routes de l'API (`app/routers/submissions.py`)

Ce fichier définit les "endpoints" que le frontend peut appeler.

-   **`POST /youth-responses`** et **`POST /professional-responses`** :
    -   Ces routes acceptent les données du formulaire au format JSON.
    -   Elles créent une nouvelle instance du modèle `Submission`.
    -   Le dictionnaire de données est converti en une chaîne JSON et stocké dans le champ `data`.
    -   Le type de soumission ('youth' ou 'professional') est enregistré.
    -   L'objet est sauvegardé dans la base de données.

    ```python
    # app/routers/submissions.py
    import json
    from fastapi import APIRouter, Depends
    from sqlalchemy.orm import Session
    from app.database.database import get_db
    from app.models.models import Submission

    router = APIRouter()

    @router.post("/professional-responses")
    def submit_professional_response(data: dict, db: Session = Depends(get_db)):
        submission = Submission(
            type="professional",
            data=json.dumps(data)
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return {"status": "success", "id": submission.id}
    ```

-   **`GET /stats`** :
    -   Cette route récupère toutes les soumissions de la base de données.
    -   Elle parcourt chaque soumission, décode la chaîne JSON du champ `data`, et agrège les résultats pour calculer des statistiques.
    -   Cela montre la flexibilité de stocker les données en JSON : l'analyse est effectuée à la volée, sans nécessiter de schéma de base de données rigide.

## 3. Partie Frontend (React)

Le frontend est conçu pour être interactif et fournir une expérience utilisateur fluide.

### Gestion du Formulaire avec `react-hook-form`

La bibliothèque `react-hook-form` est au cœur de la gestion des formulaires. Elle offre des performances élevées (en minimisant les re-rendus) et un écosystème de validation puissant.

### Hook Personnalisé (`src/hooks/useProfessionalSurveyForm.ts`)

Pour encapsuler la logique complexe du formulaire, un hook personnalisé est créé. C'est une pratique exemplaire qui rend le composant principal plus lisible et la logique réutilisable.

-   **`useForm`** : Le hook `useForm` de `react-hook-form` est utilisé pour enregistrer les champs, gérer la validation, et suivre l'état de soumission.
-   **`watch`** : La fonction `watch` est utilisée pour surveiller les changements de valeur de certains champs en temps réel. Cela permet de créer des formulaires dynamiques où l'affichage de certaines questions dépend des réponses à d'autres (par exemple, afficher un champ de texte "Autre" si l'utilisateur sélectionne l'option "Autre").
-   **`handleSubmit`** : Cette fonction enveloppe la logique de soumission. Elle s'assure que la validation est passée avant d'exécuter la fonction `onSubmit`.
-   **Logique `onSubmit`** :
    -   À l'intérieur de `onSubmit`, les données du formulaire sont envoyées au backend via une requête `fetch` ou `axios` vers l'endpoint FastAPI approprié (ex: `/professional-responses`).
    -   La fonction gère les cas de succès et d'erreur, par exemple en affichant un message à l'utilisateur.

### Composant de Formulaire (`src/components/ProfessionalSurveyForm.tsx`)

Ce composant est responsable de l'affichage du formulaire.

-   Il appelle le hook personnalisé (`useProfessionalSurveyForm`) pour obtenir toutes les fonctions et les états nécessaires (`register`, `handleSubmit`, `errors`, etc.).
-   Chaque champ du formulaire (`Input`, `RadioGroup`, `CheckboxGroup`) est lié à `react-hook-form` en utilisant l'opérateur de décomposition (`{...formFields.fieldName}`).
-   L'affichage conditionnel est utilisé pour les champs dynamiques, basé sur les valeurs surveillées exportées par le hook (ex: `showOtherCanton`).

## 4. Instructions pour la Réutilisation

Pour adapter ce système à un nouveau projet, suivez ces étapes :

1.  **Backend (FastAPI)** :
    a.  **Copier la structure** : Réutilisez la structure des dossiers `app/`, `database/`, `models/`, `routers/`.
    b.  **Définir les dépendances** : Créez un fichier `requirements.txt` avec `fastapi`, `uvicorn`, `sqlalchemy`, et `pydantic`.
    c.  **Créer de nouvelles routes** : Dans `app/routers/`, créez un nouveau fichier de routes pour votre nouveau questionnaire (ex: `app/routers/new_survey_routes.py`). Définissez un nouvel endpoint POST (ex: `/new-survey-responses`) qui stockera les données avec un type distinct.
    d.  **Mettre à jour `main.py`** : Importez et incluez le nouveau routeur dans l'application FastAPI principale.

2.  **Frontend (React)** :
    a.  **Créer un nouveau hook** : Créez un nouveau hook personnalisé (ex: `useNewSurveyForm.ts`). Définissez l'interface TypeScript des champs de votre nouveau formulaire et la logique de validation. Adaptez la fonction `onSubmit` pour qu'elle appelle le nouvel endpoint de votre API.
    b.  **Créer un nouveau composant de formulaire** : Créez un nouveau composant (ex: `NewSurveyForm.tsx`). Utilisez votre nouveau hook pour construire l'interface du formulaire.
    c.  **Intégrer le formulaire** : Placez votre nouveau composant de formulaire dans la page où il doit apparaître.

Cette architecture modulaire et générique permet de créer, déployer et maintenir des systèmes de questionnaires complexes de manière efficace et évolutive.

---

## 5. Analyse et Interprétation des Données avec l'IA

La véritable puissance de ce système réside dans sa capacité à non seulement collecter des données, mais aussi à les interpréter en utilisant une intelligence artificielle pour fournir des informations exploitables.

### Architecture de l'Analyse

-   **API d'Analyse (`app/routers/analysis.py`)** : Un endpoint dédié (`POST /analyze`) est mis en place. Il reçoit une question en langage naturel (ex: "Quel est le principal obstacle rencontré par les jeunes ?") et un type de données (`youth`, `professional`, ou `all`).
-   **Service d'Analyse (`app/services/ai_analysis.py`)** : Ce service est le cerveau de l'opération. Il orchestre la préparation des données et l'appel à l'IA.
-   **PandasAI** : C'est la bibliothèque clé qui fait le lien entre les données brutes et le modèle de langage (LLM). Elle traduit une question en langage naturel en code Pandas exécutable.
-   **Modèle de Langage (LLM)** : Le système utilise un modèle OpenAI (comme `gpt-3.5-turbo`) pour comprendre et répondre à la question posée.

### Flux de Travail de l'Analyse

Voici comment une question est traitée, de l'utilisateur à la réponse :

1.  **Préparation des Données (`prepare_data_for_analysis`)** :
    a.  Le service charge les soumissions depuis la base de données SQLite.
    b.  Les données JSON de chaque soumission sont décodées et structurées.
    c.  Deux **DataFrames Pandas** distincts sont créés : un pour les réponses des "jeunes" et un pour les "professionnels". Cette structure est idéale pour l'analyse de données tabulaires.

2.  **Traitement de la Question (`analyze_data`)** :
    a.  Le service reçoit la question en langage naturel de l'utilisateur via l'API.
    b.  Il sélectionne le ou les DataFrames appropriés en fonction du `data_type` demandé. Si `all` est choisi, il fusionne les deux DataFrames.
    c.  Un léger prétraitement est appliqué pour rendre les données plus digestes pour l'IA (par exemple, convertir les listes en chaînes de caractères).

3.  **Interaction avec PandasAI** :
    a.  Une instance de `SmartDataframe` de PandasAI est créée à partir du DataFrame préparé.
    b.  Le `SmartDataframe` est configuré avec le LLM (OpenAI) et des paramètres comme la langue (`fr`).
    c.  La méthode **`.chat(question)`** est appelée. C'est ici que la magie opère :
        -   PandasAI envoie la structure du DataFrame et la question au LLM.
        -   Le LLM génère du code Python (spécifique à Pandas) pour répondre à la question.
        -   PandasAI exécute ce code sur le DataFrame localement.
        -   Le résultat (texte, chiffre ou graphique) est retourné.

4.  **Gestion des Résultats** :
    -   Si le résultat est du texte ou un chiffre, il est renvoyé directement au frontend.
    -   Si PandasAI génère un **graphique** (par exemple, un diagramme à barres), il est sauvegardé sur le serveur. L'API renvoie alors une **URL** vers ce graphique, que le frontend peut afficher.

### Comment l'Intégrer dans un Nouveau Projet

1.  **Dépendances** : Ajoutez `pandas`, `pandasai`, et `openai` à votre `requirements.txt`.
2.  **Variables d'Environnement** : Assurez-vous d'avoir une clé `OPENAI_API_KEY` dans votre fichier `.env`.
3.  **Adapter le Service d'Analyse** :
    -   Copiez le service `ai_analysis.py`.
    -   Modifiez la fonction `prepare_data_for_analysis` pour qu'elle corresponde à la manière dont vos nouvelles données sont structurées (si elle diffère).
    -   Ajustez les suggestions de questions (`get_question_suggestions`) pour qu'elles soient pertinentes pour votre nouveau jeu de données.
4.  **Créer l'Endpoint** : Réutilisez la structure de `analysis.py` pour exposer la fonctionnalité d'analyse via votre API.

Cette approche complète transforme un simple système de collecte de données en une puissante plateforme d'analyse interactive, capable de fournir des insights profonds sans avoir à écrire manuellement des requêtes complexes. 
