Instructions for Cursor (version version généralisée et réutilisable)
## Code Explanations
- Explain each section of code in a simple and accessible way (detailed by default; concise if explicitly requested with "explain simply").
- Break down explanations by paragraph or functional block.
- Avoid overly complex jargon without explanation.
- Specify the purpose of each function/method.
- Indicate why certain approaches were chosen (only for detailed explanations).

## Explanation Format
- Start with "📝 Explanation:"
- Use bullet points for important points.
- Include concrete examples only if relevant or requested.
- End with a conclusion summarizing the purpose (omit for concise explanations).

## Documentation and Iteration Process - Key Principles
1️⃣ Consult and update CHANGELOG.md before major changes (if applicable)
   • Review CHANGELOG.md before changes >50 lines or new files to avoid reintroducing errors.
   • Document immediately only for significant changes; group minor changes (<20 lines) daily.
2️⃣ Automated tagging in CHANGELOG.md
   • Tags EUREKA and NEED HELP added automatically via "Documentation Machine pour IA" rules.
   • Manual tagging optional if needed.
3️⃣ Structure steps to avoid unnecessary iterations
   • Document errors and corrections in machine_doc.md (automatic) to avoid repetition.
   • Check history only for major changes or if requested.
4️⃣ Continuous improvement
   • Each session builds an evolving knowledge base via machine_doc.md and CHANGELOG.md (if used).

## Error Logging
- Log all errors in `errors.log` at the project root.
- Format: [TIMESTAMP] [ERROR] Description of the error.
- Example: [2024-03-25T14:32:00Z] [ERROR] Port already in use.
- Append new errors without overwriting existing content.

## Error Resolution Map
- When an error is logged in `errors.log`, suggest an action based on the following map:
  - PORT_ALREADY_IN_USE: [ACTION=RESTART_SERVER] Kill processes using the port and restart the server (use the deployment command specified in "Project-Specific Context").
  - BUILD_ERROR: [ACTION=CHECK_BUILD] Run the project’s build command (e.g., `npm run build`) to identify and fix build issues.
  - RENDERING_ERROR: [ACTION=CHECK_LOGS] Review `errors.log` for details and verify component rendering logic.
  - DEPLOYMENT_FAILED: [ACTION=CHECK_DEPLOYMENT] Verify deployment configuration and retry deployment (use the deployment command specified in "Project-Specific Context").
- If the error is not in the map, suggest logging a detailed description in `machine_doc.md` with a [NEED HELP] tag in CHANGELOG.md.

## Context Categories
### General Development Guidelines
- Tone: Professional, educational, clear, concise.
- Architecture: Component-based (or project-specific), mobile-first (if applicable), responsive, accessible.
- Processes:
  - Error Fixing: Document in CHANGELOG.md (automatic if used), use EUREKA/NEED HELP tags, analyze logs, test incrementally.
  
  -  Solution Design & Debt Reduction:
    - **Guideline:** Always investigate to identify the **root cause** of issues before implementing fixes.
    - **Action:** Explicitly compare potential solutions. Evaluate them for robustness, maintainability, and adherence to standards/best practices.
    - **Preference:** Strongly prioritize solutions that **resolve the root cause** using **standard, robust, and maintainable** methods.
    - **Avoid:** Implementing temporary **workarounds** that only mask symptoms, rely on fragile assumptions (e.g., hardcoded values, environment-specific configurations), or introduce significant technical debt. Justify any necessary deviation. 
  
  - 
  - GitHub Push: Document in CHANGELOG.md (if applicable), ensure tests pass, descriptive commits.
  - Comments: Purpose at file top, inline for complex logic, JSDoc for functions.


### Project-Specific Context (customize per project)
- Project Overview: "Questionnaire pour les retours des cafés partenaires de CAP Formations."
- Tech Stack: "Frontend: React + TypeScript, Vite, Tailwind CSS. Backend: Python + FastAPI, SQLAlchemy, SQLite."
- Our .env variables: "Frontend (Vite): `VITE_BACKEND_URL=http://localhost:5174`. Backend (FastAPI): Utilise les arguments de ligne de commande pour le port."
- File Structure: "Frontend: `/src`, `/public`. Backend: `/formanova-api`."
- Deployment Command: "Développement local uniquement pour l'instant. Lancement via deux commandes distinctes: `npm run dev -- --port 5173` pour le frontend et `source formanova-api/venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 5174 --reload --app-dir formanova-api` pour le backend."
- Other: "L'application est conçue pour être éventuellement déployée en ligne, mais les étapes actuelles se concentrent sur le développement local."

## Documentation Machine pour IA
[CONTEXTE] Gestion de deux documents : un document machine pour IA et un CHANGELOG narratif pour humains (si suivi souhaité).
[ACTION]
### Partie 1 : Document machine
1. Générer uniquement si : a) nouveau fichier dans le langage principal (e.g., *.jsx/*.tsx, *.py), b) modification >100 lignes, c) explicitement demandé ("générer doc machine").
2. Ignorer les modifications mineures (<100 lignes, cosmetic) sauf si demandé.
3. Stocker dans `machine_doc.md` à la racine, avec une section par module/composant.
4. Ajouter un identifiant unique : [ID] YYYYMMDD-NNN (e.g., [ID] 20240322-001).
5. [OUTPUT] Structure minimale : [ID] + [TIMESTAMP] + [CHANGE] + [RESULT].

### Partie 1.1 : Accessibility Check (on demand)
1. On command "run accessibility check", perform a basic accessibility audit:
   - Check for sufficient color contrast (e.g., text vs background).
   - Check for missing ARIA labels on interactive elements (e.g., buttons, forms).
2. Document results in `machine_doc.md` under a section ## Accessibility Audit.
3. [OUTPUT] Example:
   ## Accessibility Audit
   [ID] 20240325-001 [TIMESTAMP] 2024-03-25T15:00:00Z [CHANGE] Accessibility check on Home page [RESULT] Insufficient contrast on button (ratio 3:1, required 4.5:1); missing ARIA label on Contact form.

### Partie 1.2 : Deployment (on demand)
1. On command "deploy project", execute the project-specific deployment command:
   - Use the command specified in "Project-Specific Context" (e.g., `vercel deploy`).
2. Document the result in `machine_doc.md` under a section ## Deployment Log.
3. [OUTPUT] Example:
   ## Deployment Log
   [ID] 20240325-002 [TIMESTAMP] 2024-03-25T16:00:00Z [CHANGE] Deployment via specified command [RESULT] Success: Deployment completed.

### Partie 2 : CHANGELOG narratif (if applicable)
1. Une fois par jour or à la demande ("générer changelog"), lire `machine_doc.md`.
2. Extraire les [CHANGE] du jour et reformuler en phrases simples.
3. Ajouter une référence à l’ID machine_doc (e.g., "Détails : machine_doc.md#[ID] 20240322-001").
4. Si [RESULT] indique une résolution réussie, ajouter [EUREKA]; si problème persistant, ajouter [NEED HELP].
5. Ajouter (append) à la fin de `CHANGELOG.md` sans modifier le contenu existant.
6. Créer une nouvelle section par jour si nécessaire (e.g., ## 2024-03-22).

## Priority
Apply these instructions to each code generation, except for minor changes (<20 lines or cosmetic), where a concise explanation suffices unless detailed output is requested.
