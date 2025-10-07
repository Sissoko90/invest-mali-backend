-- Script de diagnostic pour le problème de messagerie
-- L'agent voit le message mais l'utilisateur ne le voit pas

-- =====================================================
-- 1. VÉRIFIER LA CONVERSATION CRÉÉE
-- =====================================================

-- Trouver la conversation avec l'ID mentionné
SELECT 
    c.id as conversation_id,
    c.subject,
    c.status,
    c.created_at,
    c.updated_at,
    e.id as entreprise_id,
    e.nom as entreprise_nom,
    a.id as agent_id,
    CONCAT(a.prenom, ' ', a.nom) as agent_nom,
    u.id as user_id,
    CONCAT(u.prenom, ' ', u.nom) as user_nom
FROM conversations c
LEFT JOIN entreprises e ON c.entreprise_id = e.id
LEFT JOIN persons a ON c.agent_id = a.id
LEFT JOIN persons u ON c.user_id = u.id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30';

-- =====================================================
-- 2. VÉRIFIER LES MESSAGES DE CETTE CONVERSATION
-- =====================================================

SELECT 
    m.id as message_id,
    m.content,
    m.message_type,
    m.is_read,
    m.created_at,
    s.id as sender_id,
    CONCAT(s.prenom, ' ', s.nom) as sender_nom,
    CASE 
        WHEN m.sender_id = c.agent_id THEN 'AGENT'
        WHEN m.sender_id = c.user_id THEN 'USER'
        ELSE 'UNKNOWN'
    END as sender_role
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
LEFT JOIN persons s ON m.sender_id = s.id
WHERE m.conversation_id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'
ORDER BY m.created_at ASC;

-- =====================================================
-- 3. VÉRIFIER L'ENTREPRISE SHARP-MALI
-- =====================================================

-- Trouver l'entreprise Sharp-Mali
SELECT 
    e.id,
    e.nom,
    e.assigned_to,
    u.nom as agent_assigne
FROM entreprises e
LEFT JOIN utilisateurs u ON e.assigned_to = u.id
WHERE e.nom LIKE '%Sharp%Mali%' OR e.nom LIKE '%Sharp-Mali%';

-- =====================================================
-- 4. VÉRIFIER LES MEMBRES DE L'ENTREPRISE
-- =====================================================

-- Trouver les membres de Sharp-Mali
SELECT 
    em.id as membre_id,
    em.entreprise_id,
    e.nom as entreprise_nom,
    em.personne_id,
    CONCAT(p.prenom, ' ', p.nom) as personne_nom,
    p.email,
    p.role
FROM entreprise_membre em
JOIN entreprises e ON em.entreprise_id = e.id
JOIN persons p ON em.personne_id = p.id
WHERE e.nom LIKE '%Sharp%Mali%' OR e.nom LIKE '%Sharp-Mali%';

-- =====================================================
-- 5. VÉRIFIER L'AGENT MOUSSA MACALOU
-- =====================================================

SELECT 
    id,
    nom,
    prenom,
    email,
    role
FROM persons 
WHERE id = '6d3e1dca-8241-4e42-ad64-90f54b3210f7'
   OR (nom LIKE '%Macalou%' AND prenom LIKE '%Moussa%');

-- =====================================================
-- 6. DIAGNOSTIC COMPLET DE LA CONVERSATION
-- =====================================================

-- Requête complète pour comprendre le problème
SELECT 
    'CONVERSATION' as type,
    c.id as id,
    c.subject as details,
    c.status as status,
    CONCAT('Agent: ', a.prenom, ' ', a.nom, ' (', a.id, ')') as agent_info,
    CONCAT('User: ', u.prenom, ' ', u.nom, ' (', u.id, ')') as user_info,
    CONCAT('Entreprise: ', e.nom, ' (', e.id, ')') as entreprise_info
FROM conversations c
LEFT JOIN persons a ON c.agent_id = a.id
LEFT JOIN persons u ON c.user_id = u.id
LEFT JOIN entreprises e ON c.entreprise_id = e.id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'

UNION ALL

SELECT 
    'MESSAGE' as type,
    m.id as id,
    LEFT(m.content, 50) as details,
    m.message_type as status,
    CONCAT('Sender: ', s.prenom, ' ', s.nom, ' (', s.id, ')') as agent_info,
    CASE 
        WHEN m.sender_id = c.agent_id THEN 'ROLE: AGENT'
        WHEN m.sender_id = c.user_id THEN 'ROLE: USER'
        ELSE 'ROLE: UNKNOWN'
    END as user_info,
    CONCAT('Read: ', m.is_read, ', Time: ', m.created_at) as entreprise_info
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
LEFT JOIN persons s ON m.sender_id = s.id
WHERE m.conversation_id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'
ORDER BY type, id;

-- =====================================================
-- 7. VÉRIFIER LES CONVERSATIONS DE L'UTILISATEUR
-- =====================================================

-- Si on connaît l'ID de l'utilisateur, vérifier ses conversations
-- (Remplacer USER_ID_HERE par l'ID réel de l'utilisateur)

-- Conversations où l'utilisateur est dans user_id
SELECT 
    'USER_CONVERSATIONS' as source,
    c.id,
    c.subject,
    e.nom as entreprise_nom,
    CONCAT(a.prenom, ' ', a.nom) as agent_nom,
    c.created_at
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons a ON c.agent_id = a.id
WHERE c.user_id = 'USER_ID_HERE'  -- Remplacer par l'ID réel
ORDER BY c.created_at DESC;

-- =====================================================
-- 8. VÉRIFIER LA RELATION ENTREPRISE-MEMBRE
-- =====================================================

-- Vérifier si l'utilisateur est bien membre de l'entreprise Sharp-Mali
SELECT 
    em.id,
    e.nom as entreprise_nom,
    CONCAT(p.prenom, ' ', p.nom) as membre_nom,
    p.id as membre_id,
    em.creation as date_ajout
FROM entreprise_membre em
JOIN entreprises e ON em.entreprise_id = e.id
JOIN persons p ON em.personne_id = p.id
WHERE e.nom LIKE '%Sharp%Mali%' OR e.nom LIKE '%Sharp-Mali%'
ORDER BY em.creation ASC;

-- =====================================================
-- 9. REQUÊTE DE DÉBOGAGE POUR L'API
-- =====================================================

-- Cette requête simule ce que fait getUserConversationsForOwnedEntreprises
-- Étape 1 : Trouver les entreprises de l'utilisateur (remplacer USER_ID)
SELECT 
    'STEP_1_USER_ENTERPRISES' as step,
    em.entreprise_id,
    e.nom as entreprise_nom
FROM entreprise_membre em
JOIN entreprises e ON em.entreprise_id = e.id
WHERE em.personne_id = 'USER_ID_HERE';  -- Remplacer par l'ID réel

-- Étape 2 : Trouver les conversations pour ces entreprises
SELECT 
    'STEP_2_CONVERSATIONS' as step,
    c.id as conversation_id,
    c.subject,
    c.user_id,
    c.agent_id,
    c.entreprise_id,
    e.nom as entreprise_nom
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
WHERE c.entreprise_id IN (
    SELECT em.entreprise_id 
    FROM entreprise_membre em 
    WHERE em.personne_id = 'USER_ID_HERE'  -- Remplacer par l'ID réel
)
AND (c.user_id = 'USER_ID_HERE' OR c.agent_id = 'USER_ID_HERE');  -- Remplacer par l'ID réel

-- =====================================================
-- 10. SOLUTION TEMPORAIRE SI PROBLÈME TROUVÉ
-- =====================================================

-- Si l'utilisateur n'est pas membre de l'entreprise, l'ajouter
-- (Décommenter et adapter si nécessaire)
/*
INSERT INTO entreprise_membre (id, entreprise_id, personne_id, creation, modification)
SELECT 
    CONCAT('fix-', UUID()) as id,
    e.id as entreprise_id,
    'USER_ID_HERE' as personne_id,  -- Remplacer par l'ID réel
    NOW() as creation,
    NOW() as modification
FROM entreprises e
WHERE e.nom LIKE '%Sharp-Mali%'
AND NOT EXISTS (
    SELECT 1 FROM entreprise_membre em 
    WHERE em.entreprise_id = e.id 
    AND em.personne_id = 'USER_ID_HERE'
);
*/
