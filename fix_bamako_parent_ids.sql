-- Corriger les relations parent/enfant pour Bamako District
-- Basé sur les IDs réels trouvés dans les logs

USE apimaliNew;

-- 1. Vérifier la situation actuelle
SELECT 'AVANT CORRECTION:' as info;
SELECT id, nom, code, parent_id 
FROM divisions 
WHERE id IN (
    '1af89366-1524-480a-8909-d234a216c1e6', -- Deuxième Arrondissement
    '29cf2a89-4978-463c-baf1-fb1d7da7fb50', -- Premier Arrondissement  
    '414d89c5-8b3a-4a2d-8218-f6b20fa117fa', -- Cinquième Arrondissement
    '4d9f2728-0783-47b3-8d54-8db2923aa977', -- Troisième Arrondissement
    '582ea7bd-daf0-4808-894a-94936351cf2f', -- Quatrième Arrondissement
    '6010674d-2312-4387-b95b-c605395fa74a', -- Septième Arrondissement
    '658f96cc-5472-4c53-91cc-24888e35d0c4'  -- Sixième Arrondissement
);

-- 2. Corriger les parent_id pour pointer vers Bamako District
UPDATE divisions 
SET parent_id = '1637be50-60d2-4490-b334-9989d3ebdc17'
WHERE id IN (
    '1af89366-1524-480a-8909-d234a216c1e6', -- Deuxième Arrondissement
    '29cf2a89-4978-463c-baf1-fb1d7da7fb50', -- Premier Arrondissement  
    '414d89c5-8b3a-4a2d-8218-f6b20fa117fa', -- Cinquième Arrondissement
    '4d9f2728-0783-47b3-8d54-8db2923aa977', -- Troisième Arrondissement
    '582ea7bd-daf0-4808-894a-94936351cf2f', -- Quatrième Arrondissement
    '6010674d-2312-4387-b95b-c605395fa74a', -- Septième Arrondissement
    '658f96cc-5472-4c53-91cc-24888e35d0c4'  -- Sixième Arrondissement
);

-- 3. Vérifier après correction
SELECT 'APRÈS CORRECTION:' as info;
SELECT id, nom, code, parent_id 
FROM divisions 
WHERE parent_id = '1637be50-60d2-4490-b334-9989d3ebdc17'
AND division_type = 'ARRONDISSEMENT';

-- 4. Compter les arrondissements de Bamako District
SELECT 'NOMBRE D\'ARRONDISSEMENTS:' as info, COUNT(*) as total
FROM divisions 
WHERE parent_id = '1637be50-60d2-4490-b334-9989d3ebdc17'
AND division_type = 'ARRONDISSEMENT';
