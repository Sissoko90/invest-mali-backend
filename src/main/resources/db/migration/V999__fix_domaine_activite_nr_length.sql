-- Migration pour corriger la taille de la colonne domaine_activite_nr
-- Augmenter la taille de 150 à 500 caractères

ALTER TABLE entreprise MODIFY COLUMN domaine_activite_nr VARCHAR(500);

-- Vérifier que la modification a été appliquée
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH 
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_NAME = 'entreprise' 
    AND COLUMN_NAME = 'domaine_activite_nr';
