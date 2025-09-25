-- Migration: Ajout de la colonne assigned_to pour l'assignation des demandes
-- Date: 2024-09-24
-- Description: Permet aux agents de s'assigner des demandes d'entreprises

-- Ajouter la colonne assigned_to à la table entreprises
ALTER TABLE entreprises 
ADD COLUMN assigned_to VARCHAR(255) NULL;

-- Ajouter la contrainte de clé étrangère vers la table utilisateurs
ALTER TABLE entreprises 
ADD CONSTRAINT fk_entreprises_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES utilisateurs(id);

-- Créer un index pour améliorer les performances des requêtes d'assignation
CREATE INDEX idx_entreprises_assigned_to ON entreprises(assigned_to);

-- Créer un index composé pour les requêtes par étape et assignation
CREATE INDEX idx_entreprises_etape_assigned ON entreprises(etape_validation, assigned_to);

-- Commentaires pour documentation
COMMENT ON COLUMN entreprises.assigned_to IS 'ID de l''agent assigné pour traiter cette demande d''entreprise';

-- Vérification de la migration
SELECT 
    COUNT(*) as total_entreprises,
    COUNT(assigned_to) as entreprises_assignees,
    COUNT(*) - COUNT(assigned_to) as entreprises_non_assignees
FROM entreprises;

-- Afficher la structure mise à jour
DESCRIBE entreprises;
