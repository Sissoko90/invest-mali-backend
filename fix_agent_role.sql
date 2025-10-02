-- Correction du rôle de l'agent d'accueil

-- 1. Vérifier l'état actuel
SELECT 
    u.id,
    u.utilisateur,
    p.nom,
    p.prenom,
    p.role as current_role
FROM utilisateurs u
LEFT JOIN persons p ON u.personne_id = p.id
WHERE u.utilisateur = 'agent.accueil@api-invest.ml';

-- 2. Mettre à jour le rôle vers AGENT_ACCEUIL
UPDATE persons 
SET role = 'AGENT_ACCEUIL' 
WHERE id = (
    SELECT personne_id 
    FROM utilisateurs 
    WHERE utilisateur = 'agent.accueil@api-invest.ml'
);

-- 3. Vérifier que la mise à jour a fonctionné
SELECT 
    u.id,
    u.utilisateur,
    p.nom,
    p.prenom,
    p.role as new_role
FROM utilisateurs u
LEFT JOIN persons p ON u.personne_id = p.id
WHERE u.utilisateur = 'agent.accueil@api-invest.ml';

-- 4. Vérifier les entreprises assignées à cet agent
SELECT 
    e.id,
    e.nom,
    e.assigned_to,
    e.etape_validation
FROM entreprise e
WHERE e.assigned_to = '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6';
