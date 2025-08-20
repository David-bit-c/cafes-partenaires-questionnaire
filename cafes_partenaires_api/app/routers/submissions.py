import os
import pandas as pd
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

import google.generativeai as genai

from app.database.database import get_db
from app.models.models import Submission

router = APIRouter(
    tags=["Submissions"],
)

# Pydantic model for submission data validation
class SubmissionCreate(BaseModel):
    data: Dict[str, Any]

@router.post("/submissions", response_model=SubmissionCreate, status_code=201)
def create_submission(submission: SubmissionCreate, db: Session = Depends(get_db)):
    """
    Crée une nouvelle soumission et la sauvegarde dans la base de données.
    """
    try:
        # Pydantic a déjà validé que 'data' est un dict, il suffit de le convertir en JSON string pour la DB
        db_submission = Submission(data=json.dumps(submission.data))
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        return submission
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création de la soumission : {e}")

@router.get("/submissions")
def get_submissions(db: Session = Depends(get_db)):
    """
    Récupère toutes les soumissions de la base de données.
    """
    submissions = db.query(Submission).order_by(Submission.created_at.desc()).all()
    return submissions

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """
    Génère une synthèse des soumissions en utilisant l'API Gemini de Google.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"summary": "", "summaryError": "Aucune clé GEMINI_API_KEY trouvée dans l'environnement."}

    submissions_query = db.query(Submission).all()
    if not submissions_query:
        return {"summary": "Pas de données de soumission à analyser.", "summaryError": ""}

    all_data = []
    for s in submissions_query:
        try:
            parsed_data = json.loads(s.data)
            all_data.append(parsed_data)
        except json.JSONDecodeError:
            continue

    if not all_data:
        return {"summary": "Aucune donnée valide à analyser.", "summaryError": ""}

    df = pd.DataFrame(all_data)
    prompt_data = df.to_string()

    prompt = f"""
    Tu es un assistant expert en analyse de données de questionnaires.
    Voici les résultats bruts d'un questionnaire de satisfaction concernant des "cafés partenaires".

    **Tâche :**
    1. Analyse les données ci-dessous.
    2. Rédige une synthèse claire et concise (environ 150-200 mots).
    3. Met en évidence :
        - Les attentes principales des participants.
        - Le niveau de satisfaction général.
        - Les suggestions d'amélioration les plus fréquentes ou pertinentes.

    **Données Brutes :**
    {prompt_data}

    **Format de la réponse attendue :**
    Une synthèse rédigée sous forme de texte fluide.
    """

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return {"summary": response.text, "summaryError": ""}
    except Exception as e:
        if "API key not valid" in str(e):
             return {"summary": "", "summaryError": "Erreur de l'API Gemini : La clé fournie n'est pas valide ou a expiré. Veuillez vérifier la clé et les autorisations sur Google Cloud Console."}
        raise HTTPException(status_code=500, detail=f"Une erreur est survenue lors de la communication avec l'API Gemini : {e}")
