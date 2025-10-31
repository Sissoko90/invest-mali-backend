-- Script de diagnostic pour la structure Bamako District
-- À exécuter dans MySQL pour comprendre pourquoi les quartiers ne sont pas trouvés

USE apimaliNew;

-- 1. Trouver Bamako District
SELECT 'BAMAKO DISTRICT:' as info, id, nom, division_type, code, parent_id 
FROM divisions 
WHERE nom LIKE '%Bamako%District%';

-- 2. Trouver les arrondissements de Bamako
SELECT 'ARRONDISSEMENTS BAMAKO:' as info, id, nom, division_type, code, parent_id 
FROM divisions 
WHERE parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
AND division_type = 'ARRONDISSEMENT'
ORDER BY nom;

-- 3. Pour chaque arrondissement, compter les quartiers directs
SELECT 
    arr.nom as 'Arrondissement',
    arr.id as 'Arrondissement_ID', 
    arr.code as 'Code_Arr',
    COUNT(q.id) as 'Quartiers_Directs'
FROM divisions arr
LEFT JOIN divisions q ON q.parent_id = arr.id AND q.division_type = 'QUARTIER'
WHERE arr.division_type = 'ARRONDISSEMENT' 
AND arr.parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
GROUP BY arr.id, arr.nom, arr.code
ORDER BY arr.nom;

-- 4. Vérifier la structure parent des quartiers de Bamako
SELECT 
    q.nom as 'Quartier',
    q.code as 'Code_Quartier',
    q.parent_id as 'Parent_ID',
    p.nom as 'Parent_Nom',
    p.division_type as 'Parent_Type'
FROM divisions q
LEFT JOIN divisions p ON p.id = q.parent_id
WHERE q.division_type = 'QUARTIER'
AND (q.code LIKE '0003%' OR q.code LIKE '0004%' OR q.code LIKE '0005%' 
     OR q.code LIKE '0006%' OR q.code LIKE '0007%' OR q.code LIKE '0008%')
ORDER BY q.code
LIMIT 20;

-- 5. Compter les quartiers par préfixe de code
SELECT 
    SUBSTRING(code, 1, 4) as 'Prefixe_Code',
    COUNT(*) as 'Nombre_Quartiers'
FROM divisions 
WHERE division_type = 'QUARTIER'
AND (code LIKE '0003%' OR code LIKE '0004%' OR code LIKE '0005%' 
     OR code LIKE '0006%' OR code LIKE '0007%' OR code LIKE '0008%')
GROUP BY SUBSTRING(code, 1, 4)
ORDER BY SUBSTRING(code, 1, 4);
