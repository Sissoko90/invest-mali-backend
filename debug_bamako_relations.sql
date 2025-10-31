-- Diagnostic rapide des relations Bamako
USE apimaliNew;

-- 1. Vérifier l'ID exact de Bamako District
SELECT 'BAMAKO DISTRICT:' as info, id, nom, code, parent_id 
FROM divisions 
WHERE nom LIKE '%BAMAKO%DISTRICT%';

-- 2. Vérifier les arrondissements qui pointent vers Bamako District
SELECT 'ARRONDISSEMENTS DE BAMAKO:' as info, id, nom, code, parent_id 
FROM divisions 
WHERE division_type = 'ARRONDISSEMENT' 
AND parent_id = '1637be50-60d2-4490-b334-9989d3ebdc17';

-- 3. Vérifier tous les arrondissements de Bamako (peu importe le parent_id)
SELECT 'TOUS ARRONDISSEMENTS BAMAKO:' as info, id, nom, code, parent_id 
FROM divisions 
WHERE division_type = 'ARRONDISSEMENT' 
AND (nom LIKE '%Arrondissement%' OR code IN ('0001', '0002', '0003', '0004', '0005', '0006', '0007'));

-- 4. Corriger les parent_id si nécessaire
UPDATE divisions 
SET parent_id = '1637be50-60d2-4490-b334-9989d3ebdc17'
WHERE division_type = 'ARRONDISSEMENT' 
AND (nom LIKE '%Arrondissement%' OR code IN ('0001', '0002', '0003', '0004', '0005', '0006', '0007'));

-- 5. Vérifier après correction
SELECT 'APRÈS CORRECTION:' as info, id, nom, code, parent_id 
FROM divisions 
WHERE division_type = 'ARRONDISSEMENT' 
AND parent_id = '1637be50-60d2-4490-b334-9989d3ebdc17';
