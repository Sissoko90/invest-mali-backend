-- Migration pour augmenter la taille de la colonne civilite
-- Date: 2025-11-03
-- Description: Augmenter la taille de la colonne civilite pour supporter PERSONNE_MORALE

-- Modifier la colonne civilite pour supporter des valeurs plus longues
ALTER TABLE persons 
MODIFY COLUMN civilite VARCHAR(20);

-- Ajouter un commentaire pour documenter le changement
COMMENT ON COLUMN persons.civilite IS 'Civilité de la personne (MONSIEUR, MADAME, MADEMOISELLE, PERSONNE_MORALE)';
