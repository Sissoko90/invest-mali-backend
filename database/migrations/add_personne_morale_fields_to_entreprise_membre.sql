-- Migration pour ajouter les champs pour les personnes morales dans la table entreprise_membre
-- Date: 2025-10-31
-- Auteur: Système API-Invest

-- Ajouter les nouveaux champs pour les personnes morales
ALTER TABLE entreprise_membre 
ADD COLUMN pays_emission_rccm VARCHAR(50) NULL COMMENT 'Pays d''émission du RCCM pour les personnes morales',
ADD COLUMN denomination_entreprise VARCHAR(255) NULL COMMENT 'Dénomination de l''entreprise pour les personnes morales';

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_entreprise_membre_pays_emission ON entreprise_membre(pays_emission_rccm);
CREATE INDEX idx_entreprise_membre_denomination ON entreprise_membre(denomination_entreprise);

-- Commentaire sur la table pour documenter les nouveaux champs
ALTER TABLE entreprise_membre COMMENT = 'Table des membres d''entreprise avec support des personnes physiques et morales. Les champs pays_emission_rccm et denomination_entreprise sont utilisés uniquement pour les personnes morales.';
