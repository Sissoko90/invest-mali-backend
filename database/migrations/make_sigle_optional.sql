-- Migration pour rendre le champ sigle optionnel
-- Le sigle n'est pas obligatoire pour toutes les entreprises

-- Modifier la colonne sigle pour permettre les valeurs NULL
ALTER TABLE entreprises 
ALTER COLUMN sigle DROP NOT NULL;

-- Commentaire pour documenter le changement
COMMENT ON COLUMN entreprises.sigle IS 'Sigle de l''entreprise (optionnel)';
