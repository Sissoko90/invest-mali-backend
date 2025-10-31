-- Script pour corriger les relations parent/enfant des quartiers Bamako
-- Les quartiers doivent avoir les arrondissements comme parent direct

USE apimaliNew;

-- 1. Vérifier la situation actuelle
SELECT 'AVANT CORRECTION - Quartiers par arrondissement:' as info;
SELECT 
    arr.nom as 'Arrondissement',
    arr.code as 'Code_Arr',
    COUNT(q.id) as 'Quartiers_Directs'
FROM divisions arr
LEFT JOIN divisions q ON q.parent_id = arr.id AND q.division_type = 'QUARTIER'
WHERE arr.division_type = 'ARRONDISSEMENT' 
AND arr.parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
GROUP BY arr.id, arr.nom, arr.code
ORDER BY arr.nom;

-- 2. Corriger les relations pour Premier Arrondissement (0003)
UPDATE divisions 
SET parent_id = (
    SELECT id FROM divisions 
    WHERE division_type = 'ARRONDISSEMENT' 
    AND code = '0003'
    AND parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
    LIMIT 1
)
WHERE division_type = 'QUARTIER' 
AND code LIKE '0003%';

-- 3. Corriger les relations pour Deuxième Arrondissement (0002)
UPDATE divisions 
SET parent_id = (
    SELECT id FROM divisions 
    WHERE division_type = 'ARRONDISSEMENT' 
    AND code = '0002'
    AND parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
    LIMIT 1
)
WHERE division_type = 'QUARTIER' 
AND code LIKE '0002%';

-- 4. Corriger les relations pour Quatrième Arrondissement (0004)
UPDATE divisions 
SET parent_id = (
    SELECT id FROM divisions 
    WHERE division_type = 'ARRONDISSEMENT' 
    AND code = '0004'
    AND parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
    LIMIT 1
)
WHERE division_type = 'QUARTIER' 
AND code LIKE '0004%';

-- 5. Corriger les relations pour Cinquième Arrondissement (0005)
UPDATE divisions 
SET parent_id = (
    SELECT id FROM divisions 
    WHERE division_type = 'ARRONDISSEMENT' 
    AND code = '0005'
    AND parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
    LIMIT 1
)
WHERE division_type = 'QUARTIER' 
AND code LIKE '0005%';

-- 6. Corriger les relations pour Sixième Arrondissement (0006)
UPDATE divisions 
SET parent_id = (
    SELECT id FROM divisions 
    WHERE division_type = 'ARRONDISSEMENT' 
    AND code = '0006'
    AND parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
    LIMIT 1
)
WHERE division_type = 'QUARTIER' 
AND code LIKE '0006%';

-- 7. Vérifier le résultat après correction
SELECT 'APRÈS CORRECTION - Quartiers par arrondissement:' as info;
SELECT 
    arr.nom as 'Arrondissement',
    arr.code as 'Code_Arr',
    COUNT(q.id) as 'Quartiers_Directs'
FROM divisions arr
LEFT JOIN divisions q ON q.parent_id = arr.id AND q.division_type = 'QUARTIER'
WHERE arr.division_type = 'ARRONDISSEMENT' 
AND arr.parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
GROUP BY arr.id, arr.nom, arr.code
ORDER BY arr.nom;

-- 8. Afficher quelques exemples de quartiers corrigés
SELECT 'EXEMPLES DE QUARTIERS CORRIGÉS:' as info;
SELECT 
    q.nom as 'Quartier',
    q.code as 'Code_Quartier',
    arr.nom as 'Arrondissement_Parent',
    arr.code as 'Code_Arrondissement'
FROM divisions q
JOIN divisions arr ON arr.id = q.parent_id
WHERE q.division_type = 'QUARTIER'
AND arr.division_type = 'ARRONDISSEMENT'
AND arr.parent_id IN (SELECT id FROM divisions WHERE nom LIKE '%Bamako%District%')
ORDER BY q.code
LIMIT 10;
