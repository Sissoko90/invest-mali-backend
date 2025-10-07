-- Script de test pour le système de messagerie interne
-- Basé sur la logique métier : agents initient conversations, 1 entreprise + 1 agent + 1 utilisateur

-- =====================================================
-- 1. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- =====================================================

-- Vérifier que les tables existent
DESCRIBE conversations;
DESCRIBE messages;
DESCRIBE entreprises;
DESCRIBE persons;

-- =====================================================
-- 2. DONNÉES DE TEST
-- =====================================================

-- Insérer un agent de test (si pas déjà présent)
INSERT IGNORE INTO persons (id, nom, prenom, email, role, creation, modification) 
VALUES (
    'agent-test-001', 
    'Dupont', 
    'Agent', 
    'agent.test@investmali.com', 
    'AGENT_ACCEUIL',
    NOW(), 
    NOW()
);

-- Insérer un utilisateur de test (si pas déjà présent)
INSERT IGNORE INTO persons (id, nom, prenom, email, role, creation, modification) 
VALUES (
    'user-test-001', 
    'Martin', 
    'Utilisateur', 
    'user.test@example.com', 
    'USER',
    NOW(), 
    NOW()
);

-- Insérer une entreprise de test (si pas déjà présente)
INSERT IGNORE INTO entreprises (
    id, nom, sigle, capital, activite_secondaire, 
    adresse_different_identite, extrait_judiciaire, autorisation_gerant, 
    autorisation_exercice, import_export, type_entreprise, statut_societe, 
    statut_creation, etape_validation, forme_juridique, domaine_activite,
    assigned_to, banni, creation, modification
) VALUES (
    'entreprise-test-001',
    'Entreprise Test SARL',
    'ET-SARL',
    1000000.00,
    'Activité de test pour la messagerie',
    false,
    false,
    false,
    false,
    false,
    'ENTREPRISE_INDIVIDUELLE',
    false,
    'EN_COURS',
    'ACCUEIL',
    'SARL',
    'COMMERCE',
    'agent-test-001', -- Assignée à notre agent de test
    false,
    NOW(),
    NOW()
);

-- Créer une relation membre (utilisateur propriétaire de l'entreprise)
INSERT IGNORE INTO entreprise_membre (id, entreprise_id, personne_id, creation, modification)
VALUES (
    'membre-test-001',
    'entreprise-test-001',
    'user-test-001',
    NOW(),
    NOW()
);

-- =====================================================
-- 3. TEST DE CRÉATION DE CONVERSATION
-- =====================================================

-- Créer une conversation de test (agent initie)
INSERT INTO conversations (
    id, entreprise_id, agent_id, user_id, subject, 
    status, priority, created_at, updated_at
) VALUES (
    'conv-test-001',
    'entreprise-test-001',
    'agent-test-001',
    'user-test-001',
    'Demande concernant Entreprise Test SARL',
    'ACTIVE',
    'NORMAL',
    NOW(),
    NOW()
);

-- Créer un message initial de l'agent
INSERT INTO messages (
    id, conversation_id, sender_id, content, message_type, 
    is_read, created_at, updated_at
) VALUES (
    'msg-test-001',
    'conv-test-001',
    'agent-test-001',
    'Bonjour, je vous contacte concernant votre demande de création d\'entreprise. Pouvez-vous me fournir les documents manquants ?',
    'TEXT',
    false,
    NOW(),
    NOW()
);

-- Créer une réponse de l'utilisateur
INSERT INTO messages (
    id, conversation_id, sender_id, content, message_type, 
    is_read, created_at, updated_at
) VALUES (
    'msg-test-002',
    'conv-test-001',
    'user-test-001',
    'Bonjour, merci pour votre message. Quels sont les documents manquants exactement ?',
    'TEXT',
    false,
    NOW(),
    NOW()
);

-- =====================================================
-- 4. REQUÊTES DE VÉRIFICATION
-- =====================================================

-- Vérifier la conversation créée
SELECT 
    c.id as conversation_id,
    c.subject,
    c.status,
    e.nom as entreprise_nom,
    a.nom as agent_nom,
    u.nom as user_nom,
    c.created_at
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons a ON c.agent_id = a.id
JOIN persons u ON c.user_id = u.id
WHERE c.id = 'conv-test-001';

-- Vérifier les messages
SELECT 
    m.id as message_id,
    m.content,
    p.nom as sender_nom,
    CASE 
        WHEN m.sender_id = c.agent_id THEN 'AGENT'
        WHEN m.sender_id = c.user_id THEN 'USER'
        ELSE 'UNKNOWN'
    END as sender_role,
    m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN persons p ON m.sender_id = p.id
WHERE m.conversation_id = 'conv-test-001'
ORDER BY m.created_at ASC;

-- Vérifier les conversations d'un agent
SELECT 
    c.id,
    c.subject,
    e.nom as entreprise_nom,
    u.nom as user_nom,
    COUNT(m.id) as total_messages,
    SUM(CASE WHEN m.is_read = false AND m.sender_id != c.agent_id THEN 1 ELSE 0 END) as unread_messages
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons u ON c.user_id = u.id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.agent_id = 'agent-test-001'
GROUP BY c.id, c.subject, e.nom, u.nom;

-- Vérifier les conversations d'un utilisateur
SELECT 
    c.id,
    c.subject,
    e.nom as entreprise_nom,
    a.nom as agent_nom,
    COUNT(m.id) as total_messages,
    SUM(CASE WHEN m.is_read = false AND m.sender_id != c.user_id THEN 1 ELSE 0 END) as unread_messages
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons a ON c.agent_id = a.id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = 'user-test-001'
GROUP BY c.id, c.subject, e.nom, a.nom;

-- =====================================================
-- 5. TESTS DE LOGIQUE MÉTIER
-- =====================================================

-- Test 1 : Vérifier qu'une entreprise ne peut avoir qu'une conversation active par agent-utilisateur
SELECT 
    entreprise_id,
    agent_id,
    user_id,
    COUNT(*) as conversations_actives
FROM conversations 
WHERE status = 'ACTIVE'
GROUP BY entreprise_id, agent_id, user_id
HAVING COUNT(*) > 1;

-- Test 2 : Vérifier que tous les messages appartiennent à des conversations valides
SELECT 
    m.id as message_id,
    m.conversation_id,
    CASE WHEN c.id IS NULL THEN 'ORPHELIN' ELSE 'OK' END as status
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;

-- Test 3 : Vérifier que tous les expéditeurs sont soit l'agent soit l'utilisateur de la conversation
SELECT 
    m.id as message_id,
    m.sender_id,
    c.agent_id,
    c.user_id,
    CASE 
        WHEN m.sender_id = c.agent_id THEN 'AGENT_OK'
        WHEN m.sender_id = c.user_id THEN 'USER_OK'
        ELSE 'INVALID_SENDER'
    END as sender_validation
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE m.sender_id NOT IN (c.agent_id, c.user_id);

-- =====================================================
-- 6. STATISTIQUES DU SYSTÈME
-- =====================================================

-- Statistiques générales
SELECT 
    'Conversations totales' as metric,
    COUNT(*) as value
FROM conversations
UNION ALL
SELECT 
    'Conversations actives' as metric,
    COUNT(*) as value
FROM conversations WHERE status = 'ACTIVE'
UNION ALL
SELECT 
    'Messages totaux' as metric,
    COUNT(*) as value
FROM messages
UNION ALL
SELECT 
    'Messages non lus' as metric,
    COUNT(*) as value
FROM messages WHERE is_read = false;

-- Statistiques par agent
SELECT 
    p.nom as agent_nom,
    COUNT(DISTINCT c.id) as conversations_totales,
    COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' THEN c.id END) as conversations_actives,
    COUNT(m.id) as messages_envoyes
FROM persons p
LEFT JOIN conversations c ON p.id = c.agent_id
LEFT JOIN messages m ON c.id = m.conversation_id AND m.sender_id = p.id
WHERE p.role LIKE 'AGENT_%'
GROUP BY p.id, p.nom;

-- =====================================================
-- 7. NETTOYAGE (OPTIONNEL)
-- =====================================================

-- Décommenter ces lignes pour nettoyer les données de test
/*
DELETE FROM messages WHERE conversation_id = 'conv-test-001';
DELETE FROM conversations WHERE id = 'conv-test-001';
DELETE FROM entreprise_membre WHERE id = 'membre-test-001';
DELETE FROM entreprises WHERE id = 'entreprise-test-001';
DELETE FROM persons WHERE id IN ('agent-test-001', 'user-test-001');
*/
