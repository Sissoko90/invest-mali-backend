<<<<<<< HEAD
-- Migration pour ajouter le champ created_by à la table entreprise
-- Permet de traquer qui a créé l'entreprise (différent du fondateur)

ALTER TABLE entreprise 
ADD COLUMN created_by VARCHAR(255) NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE entreprise 
ADD CONSTRAINT fk_entreprise_created_by 
FOREIGN KEY (created_by) REFERENCES utilisateurs(id);

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_entreprise_created_by ON entreprise(created_by);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN entreprise.created_by IS 'ID de l''utilisateur qui a créé cette entreprise (peut être différent du fondateur)';
=======
-- Migration pour ajouter le champ created_by à la table entreprise
-- Permet de traquer qui a créé l'entreprise (différent du fondateur)

ALTER TABLE entreprise 
ADD COLUMN created_by VARCHAR(255) NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE entreprise 
ADD CONSTRAINT fk_entreprise_created_by 
FOREIGN KEY (created_by) REFERENCES utilisateurs(id);

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_entreprise_created_by ON entreprise(created_by);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN entreprise.created_by IS 'ID de l''utilisateur qui a créé cette entreprise (peut être différent du fondateur)';
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
