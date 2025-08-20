import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db, engine
from app.models import models

# Crée la table dans la base de données si elle n'existe pas.
# Ceci est utile pour le développement.
models.Base.metadata.create_all(bind=engine)

router = APIRouter(
    prefix="/api",
    tags=["Submissions"],
)

@router.post("/professional-responses", status_code=201)
def submit_professional_response(submission_data: dict, db: Session = Depends(get_db)):
    """
    Accepte les données du formulaire, les stocke en JSON dans la base de données.
    C'est l'approche flexible recommandée par le guide.
    """
    try:
        # Création de l'objet Submission pour la base de données
        db_submission = models.Submission(
            type="professional",
            data=json.dumps(submission_data)
        )
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        return {"status": "success", "id": db_submission.id}
    except Exception as e:
        db.rollback()
        # En cas d'erreur, renvoyer une réponse HTTP 500 claire.
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred on the server: {str(e)}")

@router.get("/submissions")
def get_all_submissions(db: Session = Depends(get_db)):
    """
    Récupère toutes les soumissions et les renvoie avec les données JSON parsées.
    """
    try:
        submissions = db.query(models.Submission).order_by(models.Submission.created_at.desc()).all()
        
        results = []
        for s in submissions:
            try:
                # Décoder la chaîne JSON de la base de données en objet Python
                data_dict = json.loads(s.data)
            except (json.JSONDecodeError, TypeError):
                # Gérer les cas où les données sont invalides ou nulles
                data_dict = {}

            results.append({
                "id": s.id,
                "type": s.type,
                "data": data_dict,
                "created_at": s.created_at.isoformat() # Assurer un format standard
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch submissions: {str(e)}")
