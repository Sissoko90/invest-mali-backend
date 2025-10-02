-- Solution directe : Assignation en base de données

-- 1. Vérifier l'état actuel de l'entreprise
SELECT 
    id,
    nom,
    assigned_to,
    etape_validation,
    creation,
    modification
FROM entreprise 
WHERE id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f';

-- 2. Vérifier l'agent d'accueil
SELECT 
    u.id,
    u.utilisateur,
    p.nom,
    p.prenom,
    p.role
FROM utilisateurs u
LEFT JOIN persons p ON u.personne_id = p.id
WHERE u.utilisateur = 'agent.accueil@api-invest.ml';

-- 3. SOLUTION DIRECTE : Assigner l'entreprise à l'agent
UPDATE entreprise 
SET 
    assigned_to = '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6',
    modification = NOW(),
    etape_validation = 'ACCUEIL'
WHERE id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f';

-- 4. Vérifier que l'assignation a fonctionné
SELECT 
    e.id,
    e.nom,
    e.assigned_to,
    e.etape_validation,
    u.utilisateur as agent_email,
    p.nom as agent_nom,
    p.prenom as agent_prenom
FROM entreprise e
LEFT JOIN utilisateurs u ON e.assigned_to = u.id
LEFT JOIN persons p ON u.personne_id = p.id
WHERE e.id = '3df6e458-f239-4b2c-b5f9-8fcae2518d2f';

-- 5. Vérifier toutes les entreprises assignées à cet agent
SELECT 
    e.id,
    e.nom,
    e.assigned_to,
    e.etape_validation,
    e.creation
FROM entreprise e
WHERE e.assigned_to = '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6'
ORDER BY e.creation DESC;
