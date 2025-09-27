-- Table pour cache des classifications d'institutions
CREATE TABLE IF NOT EXISTS institution_classifications (
  domain TEXT PRIMARY KEY,           -- ex: "fase.ch"
  institution_type TEXT NOT NULL,    -- ex: "FASE" 
  institution_name TEXT,             -- ex: "Fondation genevoise pour l'animation socioculturelle"
  confidence_score REAL DEFAULT 0.8, -- ex: 0.95
  classification_date TEXT NOT NULL, -- ex: "2025-01-27T10:30:00Z"
  website_content TEXT,              -- Cache du contenu analysé
  submission_count INTEGER DEFAULT 1, -- Nombre de soumissions pour ce domaine
  last_updated TEXT NOT NULL         -- Dernière mise à jour
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_institution_type ON institution_classifications(institution_type);
CREATE INDEX IF NOT EXISTS idx_submission_count ON institution_classifications(submission_count);
