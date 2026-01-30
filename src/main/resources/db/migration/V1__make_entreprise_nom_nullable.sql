-- Migration pour rendre la colonne 'nom' nullable dans la table entreprise
-- Cela permet aux entreprises individuelles de ne pas avoir de nom
-- Le nom sera affiché comme "Prénom Nom" du gérant dans l'interface

-- Rendre la colonne nom nullable
ALTER TABLE entreprise MODIFY COLUMN nom VARCHAR(150) NULL;

-- Note: MySQL permet automatiquement plusieurs valeurs NULL dans un index UNIQUE
-- donc nous gardons la contrainte unique qui s'appliquera uniquement aux valeurs non-NULL
