from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ordre d'importation corrigé et crucial
# 1. Importer Base et engine de la base de données
from app.database.database import Base, engine
# 2. Importer les modèles pour s'assurer que les classes de modèles sont enregistrées auprès de Base
from app.models import models
# 3. Importer les routeurs
from app.routers import submissions

# 4. Maintenant que les modèles sont enregistrés, créer les tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cafés Partenaires API",
    description="API pour collecter les soumissions du questionnaire des cafés partenaires.",
    version="1.0.0"
)

# Configuration CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(submissions.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cafés Partenaires API"}
