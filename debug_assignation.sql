-- Script de debug pour l'assignation des demandes

-- 1. Vérifier l'entreprise assignée
SELECT 
    id,
    nom,
    assigned_to,
    creation,
    modification
FROM entreprise 
WHERE id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f';

-- 2. Vérifier l'agent connecté
SELECT 
    u.id as user_id,
    u.utilisateur as email,
    p.nom,
    p.prenom,
    p.role
FROM utilisateurs u
LEFT JOIN persons p ON u.personne_id = p.id
WHERE u.utilisateur = 'agent.accueil@api-invest.ml';

-- 3. Vérifier toutes les entreprises assignées
SELECT 
    e.id,
    e.nom,
    e.assigned_to,
    u.utilisateur as agent_email,
    p.nom as agent_nom,
    p.prenom as agent_prenom
FROM entreprise e
LEFT JOIN utilisateurs u ON e.assigned_to = u.id
LEFT JOIN persons p ON u.personne_id = p.id
WHERE e.assigned_to IS NOT NULL;

-- 4. Vérifier si l'ID correspond
SELECT 
    'MATCH' as status,
    e.id as entreprise_id,
    e.nom as entreprise_nom,
    u.id as agent_id,
    u.utilisateur as agent_email
FROM entreprise e
JOIN utilisateurs u ON e.assigned_to = u.id
WHERE e.id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f'
  AND u.utilisateur = 'agent.accueil@api-invest.ml'

UNION ALL

SELECT 
    'NO_MATCH' as status,
    e.id as entreprise_id,
    e.nom as entreprise_nom,
    e.assigned_to as agent_id_in_db,
    'agent.accueil@api-invest.ml' as expected_agent_email
FROM entreprise e
WHERE e.id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f'
  AND e.assigned_to NOT IN (
    SELECT u.id FROM utilisateurs u WHERE u.utilisateur = 'agent.accueil@api-invest.ml'
  );

-- 5. Solution temporaire : Réassigner à l'agent correct
-- DÉCOMMENTEZ CETTE LIGNE SI NÉCESSAIRE :
-- UPDATE entreprise 
-- SET assigned_to = (SELECT id FROM utilisateurs WHERE utilisateur = 'agent.accueil@api-invest.ml')
-- WHERE id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f';
