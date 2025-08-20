from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FormaNova API", version="0.1.0")

# Configuration CORS pour autoriser les requêtes du frontend
# La liste des origines sera remplie avec le port fourni par l'utilisateur
origins = [
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the FormaNova API"}

# Ici, nous inclurons les routeurs plus tard
from app.routers import submissions
app.include_router(submissions.router)
# app.include_router(analysis.router)
