-- Script SQL pour créer la table des rôles professionnels dynamiques
-- À exécuter dans Cloudflare D1 Console

CREATE TABLE IF NOT EXISTS dynamic_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_dynamic_roles_name ON dynamic_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_dynamic_roles_created ON dynamic_roles(created_at);

-- Insertion du rôle "référent ForPro" déjà ajouté manuellement
INSERT OR IGNORE INTO dynamic_roles (role_name) VALUES ('Référent ForPro');
