-- Migration pour ajouter le champ numero_nina à la table entreprise
-- Version: V1_1_0
-- Description: Ajout du champ pour stocker les numéros NINA générés par l'API INSTAT Mali

-- Ajouter la colonne numero_nina si elle n'existe pas déjà
ALTER TABLE entreprise 
ADD COLUMN IF NOT EXISTS numero_nina VARCHAR(50) NULL 
COMMENT 'Numéro NINA généré par l\'API INSTAT Mali';

-- Créer un index pour optimiser les recherches par numéro NINA
CREATE INDEX IF NOT EXISTS idx_entreprise_numero_nina 
ON entreprise(numero_nina);

-- Commentaire de documentation
ALTER TABLE entreprise 
COMMENT = 'Table des entreprises avec support du numéro NINA INSTAT Mali';
