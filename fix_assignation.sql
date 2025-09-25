-- Script pour résoudre l'erreur d'assignation
-- À exécuter dans phpMyAdmin ou MySQL Workbench

-- 1. Vérifier si la colonne existe déjà
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'entreprises' 
AND COLUMN_NAME = 'assigned_to'
AND TABLE_SCHEMA = 'apimaliNew';

-- 2. Ajouter la colonne assigned_to si elle n'existe pas
ALTER TABLE entreprises 
ADD COLUMN assigned_to VARCHAR(255) NULL;

-- 3. Ajouter la contrainte de clé étrangère
ALTER TABLE entreprises 
ADD CONSTRAINT fk_entreprises_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES utilisateurs(id);

-- 4. Créer un index pour améliorer les performances
CREATE INDEX idx_entreprises_assigned_to ON entreprises(assigned_to);

-- 5. Vérifier que la colonne a été ajoutée
DESCRIBE entreprises;

-- 6. Tester avec une requête
SELECT id, nom, assigned_to FROM entreprises LIMIT 5;
