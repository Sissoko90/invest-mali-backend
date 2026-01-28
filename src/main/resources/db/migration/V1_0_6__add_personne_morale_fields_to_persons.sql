-- Migration pour ajouter les champs spécifiques aux personnes morales dans la table persons
-- Date: 2025-11-01
-- Description: Ajout des colonnes pays_emission_rccm et denomination_entreprise

-- Ajouter la colonne pays_emission_rccm (enum)
ALTER TABLE persons 
ADD COLUMN pays_emission_rccm VARCHAR(50) NULL;

-- Ajouter la colonne denomination_entreprise (string)
ALTER TABLE persons 
ADD COLUMN denomination_entreprise VARCHAR(255) NULL;

-- Ajouter un index sur denomination_entreprise pour les recherches
CREATE INDEX idx_persons_denomination_entreprise ON persons(denomination_entreprise);

-- Ajouter un commentaire pour documenter l'usage
COMMENT ON COLUMN persons.pays_emission_rccm IS 'Pays d''émission du RCCM pour les personnes morales (enum PaysEmissionRccM)';
COMMENT ON COLUMN persons.denomination_entreprise IS 'Dénomination de l''entreprise pour les personnes morales';
