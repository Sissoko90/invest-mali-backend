-- Script pour corriger les associations manquantes utilisateur-entreprise
-- Problème : Certaines conversations ne sont pas visibles par l'utilisateur
-- Cause : L'utilisateur n'est pas membre de l'entreprise dans entreprise_membre

-- =====================================================
-- 1. DIAGNOSTIC : IDENTIFIER LES CONVERSATIONS ORPHELINES
-- =====================================================

-- Conversations où l'utilisateur n'est PAS membre de l'entreprise
SELECT 
    'CONVERSATION_ORPHELINE' as type,
    c.id as conversation_id,
    c.subject,
    e.nom as entreprise_nom,
    CONCAT(u.prenom, ' ', u.nom) as user_nom,
    u.id as user_id,
    e.id as entreprise_id,
    CASE 
        WHEN em.id IS NULL THEN 'PAS_MEMBRE'
        ELSE 'MEMBRE_OK'
    END as statut_membre
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons u ON c.user_id = u.id
LEFT JOIN entreprise_membre em ON (em.entreprise_id = e.id AND em.personne_id = u.id)
WHERE em.id IS NULL  -- Utilisateur pas membre de l'entreprise
ORDER BY c.created_at DESC;

-- =====================================================
-- 2. COMPARAISON : CONVERSATIONS QUI MARCHENT VS QUI NE MARCHENT PAS
-- =====================================================

-- Conversations qui marchent (utilisateur est membre)
SELECT 
    'CONVERSATION_OK' as type,
    c.id as conversation_id,
    e.nom as entreprise_nom,
    CONCAT(u.prenom, ' ', u.nom) as user_nom,
    'MEMBRE_OK' as statut
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons u ON c.user_id = u.id
JOIN entreprise_membre em ON (em.entreprise_id = e.id AND em.personne_id = u.id)
ORDER BY c.created_at DESC
LIMIT 5;

-- =====================================================
-- 3. SOLUTION AUTOMATIQUE : CORRIGER LES ASSOCIATIONS MANQUANTES
-- =====================================================

-- Ajouter automatiquement les utilisateurs comme membres de leurs entreprises
-- ATTENTION : Vérifiez d'abord les résultats du diagnostic avant d'exécuter !

INSERT INTO entreprise_membre (id, entreprise_id, personne_id, creation, modification)
SELECT 
    UUID() as id,
    c.entreprise_id,
    c.user_id,
    NOW() as creation,
    NOW() as modification
FROM conversations c
LEFT JOIN entreprise_membre em ON (em.entreprise_id = c.entreprise_id AND em.personne_id = c.user_id)
WHERE em.id IS NULL  -- Pas encore membre
GROUP BY c.entreprise_id, c.user_id;  -- Éviter les doublons

-- =====================================================
-- 4. VÉRIFICATION POST-CORRECTION
-- =====================================================

-- Vérifier qu'il n'y a plus de conversations orphelines
SELECT 
    COUNT(*) as conversations_orphelines_restantes
FROM conversations c
LEFT JOIN entreprise_membre em ON (em.entreprise_id = c.entreprise_id AND em.personne_id = c.user_id)
WHERE em.id IS NULL;
-- Doit retourner 0

-- =====================================================
-- 5. DIAGNOSTIC SPÉCIFIQUE POUR VOS DEUX CAS
-- =====================================================

-- Cas 1 : Conversation qui marche (abf69c93-80eb-4ba4-b8b2-66eb698b7880)
SELECT 
    'CAS_QUI_MARCHE' as cas,
    c.id as conversation_id,
    e.nom as entreprise_nom,
    CONCAT(u.prenom, ' ', u.nom) as user_nom,
    CASE WHEN em.id IS NOT NULL THEN 'MEMBRE_OK' ELSE 'PAS_MEMBRE' END as statut
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons u ON c.user_id = u.id
LEFT JOIN entreprise_membre em ON (em.entreprise_id = e.id AND em.personne_id = u.id)
WHERE c.id = 'abf69c93-80eb-4ba4-b8b2-66eb698b7880'

UNION ALL

-- Cas 2 : Conversation qui ne marche pas (Sharp-Mali)
SELECT 
    'CAS_QUI_NE_MARCHE_PAS' as cas,
    c.id as conversation_id,
    e.nom as entreprise_nom,
    CONCAT(u.prenom, ' ', u.nom) as user_nom,
    CASE WHEN em.id IS NOT NULL THEN 'MEMBRE_OK' ELSE 'PAS_MEMBRE' END as statut
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons u ON c.user_id = u.id
LEFT JOIN entreprise_membre em ON (em.entreprise_id = e.id AND em.personne_id = u.id)
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30';

-- =====================================================
-- 6. SOLUTION SPÉCIFIQUE POUR SHARP-MALI
-- =====================================================

-- Corriger spécifiquement le problème Sharp-Mali
INSERT IGNORE INTO entreprise_membre (id, entreprise_id, personne_id, creation, modification)
SELECT 
    UUID() as id,
    c.entreprise_id,
    c.user_id,
    NOW() as creation,
    NOW() as modification
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'  -- Conversation Sharp-Mali
AND NOT EXISTS (
    SELECT 1 FROM entreprise_membre em 
    WHERE em.entreprise_id = c.entreprise_id 
    AND em.personne_id = c.user_id
);

-- =====================================================
-- 7. STATISTIQUES FINALES
-- =====================================================

-- Résumé des corrections
SELECT 
    'TOTAL_CONVERSATIONS' as metric,
    COUNT(*) as valeur
FROM conversations

UNION ALL

SELECT 
    'CONVERSATIONS_AVEC_MEMBRES_OK' as metric,
    COUNT(*) as valeur
FROM conversations c
JOIN entreprise_membre em ON (em.entreprise_id = c.entreprise_id AND em.personne_id = c.user_id)

UNION ALL

SELECT 
    'CONVERSATIONS_ORPHELINES' as metric,
    COUNT(*) as valeur
FROM conversations c
LEFT JOIN entreprise_membre em ON (em.entreprise_id = c.entreprise_id AND em.personne_id = c.user_id)
WHERE em.id IS NULL;

-- =====================================================
-- 8. TEST DE L'API APRÈS CORRECTION
-- =====================================================

-- Cette requête simule getUserConversationsForOwnedEntreprises
-- Remplacer USER_ID_HERE par l'ID de l'utilisateur qui a des problèmes

SELECT 
    c.id as conversation_id,
    c.subject,
    e.nom as entreprise_nom,
    CONCAT(a.prenom, ' ', a.nom) as agent_nom,
    COUNT(m.id) as total_messages
FROM conversations c
JOIN entreprises e ON c.entreprise_id = e.id
JOIN persons a ON c.agent_id = a.id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.entreprise_id IN (
    -- Entreprises où l'utilisateur est membre
    SELECT em.entreprise_id 
    FROM entreprise_membre em 
    WHERE em.personne_id = 'USER_ID_HERE'  -- Remplacer par l'ID réel
)
AND c.user_id = 'USER_ID_HERE'  -- Remplacer par l'ID réel
GROUP BY c.id, c.subject, e.nom, a.prenom, a.nom
ORDER BY c.updated_at DESC;
