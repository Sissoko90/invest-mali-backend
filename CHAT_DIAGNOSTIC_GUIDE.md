# 🔍 Guide de Diagnostic - Problème de Messagerie

## 🚨 **Problème Identifié**

L'agent voit le message qu'il a envoyé, mais l'utilisateur ne voit pas la conversation.

**Message de l'agent :**
```
"Bonjour ! Je vous contacte concernant votre entreprise Sharp-Mali."
Conversation ID: d2c30c18-2e4c-4ace-8004-04079cfcfd30
Agent: Moussa Macalou (6d3e1dca-8241-4e42-ad64-90f54b3210f7)
```

## 🔍 **Étapes de Diagnostic**

### **1. Vérifier la conversation dans la base de données**

```sql
-- Vérifier que la conversation existe
SELECT 
    c.id,
    c.subject,
    c.status,
    e.nom as entreprise_nom,
    CONCAT(a.prenom, ' ', a.nom) as agent_nom,
    CONCAT(u.prenom, ' ', u.nom) as user_nom
FROM conversations c
LEFT JOIN entreprises e ON c.entreprise_id = e.id
LEFT JOIN persons a ON c.agent_id = a.id
LEFT JOIN persons u ON c.user_id = u.id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30';
```

### **2. Vérifier les messages**

```sql
-- Vérifier les messages de cette conversation
SELECT 
    m.content,
    CONCAT(s.prenom, ' ', s.nom) as sender_nom,
    CASE 
        WHEN m.sender_id = c.agent_id THEN 'AGENT'
        WHEN m.sender_id = c.user_id THEN 'USER'
        ELSE 'UNKNOWN'
    END as sender_role,
    m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
LEFT JOIN persons s ON m.sender_id = s.id
WHERE m.conversation_id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'
ORDER BY m.created_at ASC;
```

### **3. Vérifier l'entreprise Sharp-Mali**

```sql
-- Trouver l'entreprise Sharp-Mali et ses membres
SELECT 
    e.id as entreprise_id,
    e.nom as entreprise_nom,
    em.personne_id as membre_id,
    CONCAT(p.prenom, ' ', p.nom) as membre_nom,
    p.email
FROM entreprises e
LEFT JOIN entreprise_membre em ON e.id = em.entreprise_id
LEFT JOIN persons p ON em.personne_id = p.id
WHERE e.nom LIKE '%Sharp%Mali%' OR e.nom LIKE '%Sharp-Mali%';
```

## 🎯 **Causes Probables**

### **Cause 1 : Utilisateur pas membre de l'entreprise**

**Problème :** L'utilisateur n'est pas enregistré comme membre de l'entreprise Sharp-Mali dans la table `entreprise_membre`.

**Solution :**
```sql
-- Ajouter l'utilisateur comme membre de l'entreprise
INSERT INTO entreprise_membre (id, entreprise_id, personne_id, creation, modification)
VALUES (
    UUID(),
    (SELECT id FROM entreprises WHERE nom LIKE '%Sharp-Mali%' LIMIT 1),
    'USER_ID_ICI',  -- Remplacer par l'ID réel de l'utilisateur
    NOW(),
    NOW()
);
```

### **Cause 2 : Problème dans findEntrepriseOwner()**

**Problème :** La méthode ne trouve pas le bon propriétaire de l'entreprise.

**Vérification :**
```sql
-- Vérifier qui est le propriétaire selon notre logique
SELECT 
    em.personne_id,
    CONCAT(p.prenom, ' ', p.nom) as proprietaire,
    em.creation as date_ajout
FROM entreprise_membre em
JOIN persons p ON em.personne_id = p.id
JOIN entreprises e ON em.entreprise_id = e.id
WHERE e.nom LIKE '%Sharp-Mali%'
ORDER BY em.creation ASC  -- Le premier = propriétaire
LIMIT 1;
```

### **Cause 3 : Conversation créée avec mauvais user_id**

**Problème :** La conversation a été créée avec un `user_id` incorrect.

**Vérification :**
```sql
-- Comparer l'user_id de la conversation avec les membres de l'entreprise
SELECT 
    'CONVERSATION_USER' as source,
    c.user_id,
    CONCAT(u.prenom, ' ', u.nom) as nom
FROM conversations c
JOIN persons u ON c.user_id = u.id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'

UNION ALL

SELECT 
    'ENTERPRISE_MEMBERS' as source,
    em.personne_id,
    CONCAT(p.prenom, ' ', p.nom) as nom
FROM entreprise_membre em
JOIN persons p ON em.personne_id = p.id
JOIN conversations c ON em.entreprise_id = c.entreprise_id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30';
```

## 🛠️ **Solutions Rapides**

### **Solution 1 : Corriger l'association utilisateur-entreprise**

```sql
-- Si l'utilisateur n'est pas membre, l'ajouter
INSERT IGNORE INTO entreprise_membre (id, entreprise_id, personne_id, creation, modification)
SELECT 
    UUID() as id,
    c.entreprise_id,
    c.user_id,
    NOW() as creation,
    NOW() as modification
FROM conversations c
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'
AND NOT EXISTS (
    SELECT 1 FROM entreprise_membre em 
    WHERE em.entreprise_id = c.entreprise_id 
    AND em.personne_id = c.user_id
);
```

### **Solution 2 : Logs de debugging**

Activer les logs de debugging dans `application.yml` :

```yaml
logging:
  level:
    abdaty_technologie.API_Invest.service.impl.ChatServiceImpl: DEBUG
    abdaty_technologie.API_Invest.controller.BusinessChatController: DEBUG
```

### **Solution 3 : Test API direct**

Tester l'API utilisateur directement :

```bash
# Récupérer les conversations de l'utilisateur
curl -X GET "http://localhost:8080/api/v1/business-chat/conversations/user" \
  -H "Authorization: Bearer <user-token>"

# Récupérer une conversation spécifique
curl -X GET "http://localhost:8080/api/v1/business-chat/conversations/d2c30c18-2e4c-4ace-8004-04079cfcfd30" \
  -H "Authorization: Bearer <user-token>"
```

## 📊 **Vérification Finale**

Après avoir appliqué une solution, vérifier que tout fonctionne :

```sql
-- 1. L'utilisateur est membre de l'entreprise
SELECT COUNT(*) as is_member
FROM entreprise_membre em
JOIN conversations c ON em.entreprise_id = c.entreprise_id
WHERE c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30'
AND em.personne_id = c.user_id;
-- Doit retourner 1

-- 2. La méthode API devrait trouver la conversation
SELECT c.id
FROM conversations c
JOIN entreprise_membre em ON c.entreprise_id = em.entreprise_id
WHERE c.user_id = em.personne_id
AND c.id = 'd2c30c18-2e4c-4ace-8004-04079cfcfd30';
-- Doit retourner l'ID de la conversation
```

## 🎯 **Prochaines Étapes**

1. **Exécuter** les requêtes de diagnostic
2. **Identifier** la cause exacte
3. **Appliquer** la solution appropriée
4. **Tester** l'API utilisateur
5. **Vérifier** que l'utilisateur voit maintenant la conversation

Le problème est très probablement que **l'utilisateur n'est pas enregistré comme membre de l'entreprise Sharp-Mali** dans la table `entreprise_membre`.
