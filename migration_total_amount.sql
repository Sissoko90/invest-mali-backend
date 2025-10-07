-- Migration : Ajout du champ total_amount à la table entreprise
-- Date : 2025-10-03
-- Description : Ajouter le montant total calculé pour chaque entreprise

-- Ajouter la colonne total_amount
ALTER TABLE entreprise 
ADD COLUMN total_amount DECIMAL(19,2);

-- Mettre à jour les entreprises existantes avec le montant de base (12000 FCFA)
UPDATE entreprise 
SET total_amount = 12000 
WHERE total_amount IS NULL;

-- Vérification
SELECT id, reference, nom, type_entreprise, total_amount 
FROM entreprise 
LIMIT 10;
