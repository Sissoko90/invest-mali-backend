-- Vérifier si la colonne assigned_to existe
DESCRIBE entreprise;

-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE entreprise 
ADD COLUMN assigned_to VARCHAR(255) NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE entreprise 
ADD CONSTRAINT fk_entreprises_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES utilisateurs(id);

-- Vérifier que la colonne a été ajoutée
DESCRIBE entreprise;
