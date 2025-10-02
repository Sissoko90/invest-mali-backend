-- Script pour ajouter la colonne assigned_to à la table entreprise si elle n'existe pas

-- Vérifier si la colonne existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Column assigned_to already exists'
        ELSE 'Column assigned_to does not exist'
    END as status
FROM information_schema.columns 
WHERE table_name = 'entreprise' 
  AND column_name = 'assigned_to'
  AND table_schema = DATABASE();

-- Ajouter la colonne si elle n'existe pas
SET @sql = (
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 
                'ALTER TABLE entreprise ADD COLUMN assigned_to VARCHAR(255) NULL, ADD INDEX idx_entreprise_assigned_to (assigned_to);'
            ELSE 
                'SELECT "Column assigned_to already exists" as message;'
        END
    FROM information_schema.columns 
    WHERE table_name = 'entreprise' 
      AND column_name = 'assigned_to'
      AND table_schema = DATABASE()
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier le résultat
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: Column assigned_to is now available'
        ELSE 'ERROR: Column assigned_to was not created'
    END as final_status
FROM information_schema.columns 
WHERE table_name = 'entreprise' 
  AND column_name = 'assigned_to'
  AND table_schema = DATABASE();

-- Afficher la structure de la table pour vérification
DESCRIBE entreprise;
