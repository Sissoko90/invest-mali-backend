# Correction : Persistance des conversations en base de données

## Problème identifié

Erreur lors de l'envoi de messages :
```
❌ Erreur lors de l'envoi: Conversation non trouvée
```

### Cause racine

L'endpoint `/conversations/start-agent` créait les conversations **en mémoire** (Maps) au lieu de les sauvegarder en base de données. Quand on essayait d'envoyer un message, le `ChatService` cherchait la conversation en DB et ne la trouvait pas.

### Workflow problématique

1. **Agent crée conversation** → `POST /conversations/start-agent`
2. **ChatController** → Sauvegarde dans `Map<String, Object> conversations` (mémoire)
3. **Frontend reçoit** → `conversationId: "conv-1759747077337"`
4. **Agent envoie message** → `POST /conversations/conv-1759747077337/messages`
5. **ChatService** → Cherche conversation en DB avec `conversationRepository.findById()`
6. **❌ Erreur** → Conversation non trouvée (elle n'existe qu'en mémoire)

### Code problématique (lignes 315-343)

```java
@PostMapping("/conversations/start-agent")
public ResponseEntity<Map<String, Object>> startConversationFromAgent(
        @RequestBody Map<String, String> request) {
    
    // ...
    
    // ❌ Pour l'instant, utiliser directement le système en mémoire
    return createAgentInitiatedConversation(agentId, userId, message, subject, entrepriseId, entrepriseNom, response);
}

private ResponseEntity<Map<String, Object>> createAgentInitiatedConversation(...) {
    // Créer une conversation initiée par l'agent
    String conversationId = "conv-" + System.currentTimeMillis();
    
    // ❌ Créer la conversation en mémoire
    Map<String, Object> conversation = new HashMap<>();
    conversation.put("id", conversationId);
    conversation.put("userId", userId);
    conversation.put("agentId", agentId);
    // ...
    
    // ❌ Stocker dans la Map en mémoire
    conversations.put(conversationId, conversation);
    
    // ❌ Sauvegarder dans un fichier JSON (pas en DB)
    saveImmediately();
}
```

### Problèmes

1. ❌ **Map en mémoire** : `conversations.put(conversationId, conversation)`
2. ❌ **Pas de persistance DB** : Aucun appel à `conversationRepository.save()`
3. ❌ **ID temporaire** : `"conv-" + System.currentTimeMillis()` au lieu d'UUID
4. ❌ **Données volatiles** : Perte au redémarrage du serveur
5. ❌ **Incohérence** : Conversation en mémoire, messages en DB

## Solution implémentée

### Code corrigé

```java
@PostMapping("/conversations/start-agent")
public ResponseEntity<Map<String, Object>> startConversationFromAgent(
        @RequestBody Map<String, String> request) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
        String agentId = request.get("agentId");
        String userId = request.get("userId");
        String message = request.get("message");
        String subject = request.get("subject");
        String entrepriseId = request.get("entrepriseId");
        
        if (agentId == null || userId == null || message == null) {
            response.put("status", "ERROR");
            response.put("message", "agentId, userId et message sont requis");
            return ResponseEntity.badRequest().body(response);
        }
        
        logger.info("📤 Création conversation agent - agentId: {}, userId: {}, entrepriseId: {}", 
            agentId, userId, entrepriseId);
        
        // ✅ Utiliser le ChatService pour créer la conversation en base de données
        ConversationRequest conversationRequest = new ConversationRequest();
        conversationRequest.setUserId(userId);
        conversationRequest.setSubject(subject != null ? subject : "Contact agent");
        conversationRequest.setEntrepriseId(entrepriseId);
        conversationRequest.setInitialMessage(message);
        
        ConversationResponse conversationResponse = chatService.createConversation(conversationRequest, agentId);
        
        logger.info("✅ Conversation créée en base - conversationId: {}", conversationResponse.getId());
        
        response.put("status", "SUCCESS");
        response.put("conversationId", conversationResponse.getId());
        response.put("agentId", agentId);
        response.put("userId", userId);
        response.put("subject", conversationResponse.getSubject());
        response.put("message", "Conversation initiée par l'agent avec succès");
        response.put("initialMessage", message);
        response.put("initiatedBy", "AGENT");
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        
    } catch (Exception e) {
        logger.error("❌ Erreur lors de la création de conversation: {}", e.getMessage(), e);
        response.put("status", "ERROR");
        response.put("message", "Erreur: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

### Changements clés

1. ✅ **Utilisation ChatService** : `chatService.createConversation()` au lieu des Maps
2. ✅ **ConversationRequest DTO** : Création du DTO approprié
3. ✅ **Persistance DB** : Le service utilise `conversationRepository.save()`
4. ✅ **UUID généré** : ID unique généré par JPA
5. ✅ **Logs détaillés** : Traçabilité de la création
6. ✅ **Suppression méthode** : `createAgentInitiatedConversation()` n'est plus utilisée

## Workflow corrigé

### ChatService.createConversation()

```java
@Override
public ConversationResponse createConversation(ConversationRequest request, String agentId) {
    // 1. Récupérer l'agent et l'utilisateur depuis la DB
    Persons agent = personsRepository.findById(agentId)
        .orElseThrow(() -> new NotFoundException("Agent non trouvé"));
    
    Persons user = personsRepository.findById(request.getUserId())
        .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé"));
    
    // 2. Récupérer l'entreprise si fournie
    Entreprise entreprise = null;
    if (request.getEntrepriseId() != null) {
        entreprise = entrepriseRepository.findById(request.getEntrepriseId())
            .orElse(null);
    }
    
    // 3. Créer la conversation
    Conversation conversation = new Conversation(agent, user, request.getSubject(), entreprise);
    
    // 4. ✅ Sauvegarder en base de données
    conversation = conversationRepository.save(conversation);
    
    // 5. Créer le message initial si fourni
    if (request.getInitialMessage() != null) {
        Message initialMessage = new Message(conversation, agent, request.getInitialMessage(), MessageType.TEXT);
        messageRepository.save(initialMessage);
    }
    
    return mapToConversationResponse(conversation);
}
```

### Étapes de persistance

1. **Validation** : Agent, utilisateur et entreprise existent en DB
2. **Création** : Entité `Conversation` créée avec les relations
3. **Sauvegarde** : `conversationRepository.save(conversation)` → INSERT en DB
4. **Message initial** : Si fourni, sauvegardé via `messageRepository.save()`
5. **Réponse** : DTO `ConversationResponse` retourné avec UUID

## Workflow complet

### 1. Frontend agent crée conversation
```javascript
const response = await fetch('http://localhost:8080/api/v1/chat/conversations/start-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: "0e310523-c3a2-4e5b-8674-1c0d1614ea83",
    userId: "aff038ae-8521-49e1-a756-a0c08f79f525",
    message: "Bonjour, j'aimerais vous aider",
    subject: "Assistance pour TMT",
    entrepriseId: "69f667f7-b9a2-43cd-bf7c-8fb5c723ce33"
  })
});
```

### 2. Backend crée en DB
```
📤 Création conversation agent - agentId: 0e310523..., userId: aff038ae..., entrepriseId: 69f667f7...
✅ Conversation créée en base - conversationId: [UUID généré par JPA]
```

### 3. Frontend reçoit UUID
```json
{
  "status": "SUCCESS",
  "conversationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "agentId": "0e310523-c3a2-4e5b-8674-1c0d1614ea83",
  "userId": "aff038ae-8521-49e1-a756-a0c08f79f525",
  "subject": "Assistance pour TMT",
  "initiatedBy": "AGENT"
}
```

### 4. Agent envoie message
```javascript
await fetch(`http://localhost:8080/api/v1/chat/conversations/${conversationId}/messages`, {
  method: 'POST',
  body: JSON.stringify({
    content: "Bonjour",
    senderId: agentId
  })
});
```

### 5. Backend trouve la conversation
```java
// ✅ La conversation existe en DB
Conversation conversation = conversationRepository.findById(conversationId)
    .orElseThrow(() -> new NotFoundException("Conversation non trouvée"));

// ✅ Message sauvegardé
Message message = new Message(conversation, sender, content, MessageType.TEXT);
messageRepository.save(message);
```

## Vérification en base de données

### Vérifier la conversation créée
```sql
SELECT 
    c.id,
    c.subject,
    c.status,
    c.creation,
    a.nom as agent_nom,
    u.nom as user_nom,
    e.nom as entreprise_nom
FROM conversations c
JOIN persons a ON c.agent_id = a.id
JOIN persons u ON c.user_id = u.id
LEFT JOIN entreprises e ON c.entreprise_id = e.id
WHERE c.entreprise_id = '69f667f7-b9a2-43cd-bf7c-8fb5c723ce33'
ORDER BY c.creation DESC;
```

### Vérifier les messages
```sql
SELECT 
    m.id,
    m.content,
    m.message_type,
    m.creation,
    p.nom as sender_nom
FROM messages m
JOIN persons p ON m.sender_id = p.id
WHERE m.conversation_id = '[UUID de la conversation]'
ORDER BY m.creation ASC;
```

## Problèmes résolus

### ❌ Avant
- Conversations en mémoire (ConcurrentHashMap)
- ID temporaires (`conv-timestamp`)
- Sauvegarde dans fichier JSON
- Erreur "Conversation non trouvée"
- Incohérence mémoire/DB

### ✅ Après
- Conversations en base de données (table `conversations`)
- UUID générés par JPA
- Persistance via JPA/Hibernate
- Messages sauvegardés avec succès
- Cohérence complète

## Fichier modifié

**src/main/java/abdaty_technologie/API_Invest/controller/ChatController.java**
- Méthode `startConversationFromAgent()` (lignes 315-365)
- Suppression logique Maps en mémoire
- Utilisation `chatService.createConversation()`
- Logs détaillés ajoutés

## Résultat

✅ **Système de chat 100% persisté** :
- Conversations sauvegardées en base de données ✅
- Messages sauvegardés en base de données ✅
- Relations JPA correctes (agent, user, entreprise) ✅
- UUID uniques générés automatiquement ✅
- Pas de localStorage côté frontend ✅
- Architecture backend cohérente ✅

✅ **Workflow complet fonctionnel** :
1. Agent crée conversation → Sauvegardée en DB
2. Agent envoie message → Conversation trouvée en DB
3. Message sauvegardé → Relations correctes
4. Utilisateur reçoit notification → Données persistées
