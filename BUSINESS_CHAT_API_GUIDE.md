# 🚀 Guide API - Système de Messagerie Interne

## 📋 **Vue d'ensemble**

Ce système implémente une messagerie interne basée sur votre logique métier :

1. **Les agents initient les conversations** (pas les utilisateurs)
2. **Une conversation = 1 entreprise + 1 agent + 1 utilisateur**
3. **Messages envoyés par agent OU utilisateur**
4. **Conversations liées aux entreprises assignées aux agents**

## 🏗️ **Architecture**

### **Base de données**
- `conversations` : `id`, `entreprise_id`, `agent_id`, `user_id`, `subject`, `status`, `priority`
- `messages` : `id`, `conversation_id`, `sender_id`, `content`, `message_type`, `is_read`

### **Entités JPA**
- `Conversation.java` : Relations vers `Entreprise`, `Persons` (agent/user)
- `Message.java` : Relations vers `Conversation`, `Persons` (sender)

### **Services**
- `ChatServiceImpl.java` : Logique métier complète
- Méthodes spécialisées : `startConversationFromAssignedEntreprise()`, etc.

### **Contrôleurs**
- `BusinessChatController.java` : API REST selon votre logique métier
- Base URL : `/api/v1/business-chat`

## 🔗 **Endpoints API**

### **1. Démarrer une conversation (Agent)**
```http
POST /api/v1/business-chat/conversations/start-from-entreprise/{entrepriseId}
Authorization: Bearer <agent-token>
Content-Type: application/json

{
  "message": "Bonjour, je vous contacte concernant votre demande..."
}
```

**Réponse :**
```json
{
  "status": "SUCCESS",
  "message": "Conversation démarrée avec succès",
  "conversation": {
    "id": "conv-uuid",
    "subject": "Demande concernant Entreprise XYZ",
    "agentId": "agent-uuid",
    "userId": "user-uuid",
    "entrepriseId": "entreprise-uuid",
    "messages": [...]
  }
}
```

### **2. Récupérer conversations agent**
```http
GET /api/v1/business-chat/conversations/agent
Authorization: Bearer <agent-token>
```

### **3. Récupérer conversations utilisateur**
```http
GET /api/v1/business-chat/conversations/user
Authorization: Bearer <user-token>
```

### **4. Récupérer une conversation**
```http
GET /api/v1/business-chat/conversations/{conversationId}
Authorization: Bearer <token>
```

### **5. Envoyer un message**
```http
POST /api/v1/business-chat/conversations/{conversationId}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Voici ma réponse...",
  "messageType": "TEXT"
}
```

### **6. Marquer comme lu**
```http
PATCH /api/v1/business-chat/conversations/{conversationId}/mark-as-read
Authorization: Bearer <token>
```

### **7. Nombre de messages non lus**
```http
GET /api/v1/business-chat/unread-count/agent
GET /api/v1/business-chat/unread-count/user
Authorization: Bearer <token>
```

## 🧪 **Tests**

### **1. Exécuter le script SQL de test**
```bash
mysql -u root -p investmali_db < test_business_chat_system.sql
```

### **2. Tests avec curl**

**Démarrer une conversation :**
```bash
curl -X POST "http://localhost:8080/api/v1/business-chat/conversations/start-from-entreprise/entreprise-test-001" \
  -H "Authorization: Bearer <agent-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test de conversation"}'
```

**Récupérer conversations :**
```bash
curl -X GET "http://localhost:8080/api/v1/business-chat/conversations/agent" \
  -H "Authorization: Bearer <agent-token>"
```

**Envoyer un message :**
```bash
curl -X POST "http://localhost:8080/api/v1/business-chat/conversations/{conversationId}/messages" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Message de test", "messageType": "TEXT"}'
```

## 🔐 **Authentification**

Le système utilise l'authentification Spring Security existante :
- **Agents** : Rôles `AGENT_*` (AGENT_ACCEUIL, AGENT_REGISTER, etc.)
- **Utilisateurs** : Rôle `USER`

## 📊 **Logique Métier**

### **Workflow de conversation**

1. **Agent** voit une entreprise qui lui est assignée
2. **Agent** clique "Contacter" → Appel API `start-from-entreprise`
3. **Système** trouve automatiquement l'utilisateur propriétaire
4. **Système** crée conversation (ou utilise existante)
5. **Agent** et **Utilisateur** peuvent échanger des messages
6. **Système** track les messages lus/non lus

### **Règles métier**

- ✅ **Seuls les agents initient** les conversations
- ✅ **Une conversation par trio** (entreprise + agent + utilisateur)
- ✅ **Messages bidirectionnels** (agent ↔ utilisateur)
- ✅ **Entreprises assignées** seulement
- ✅ **Propriétaire automatique** trouvé via `EntrepriseMembre`

## 🚨 **Gestion d'erreurs**

### **Erreurs communes**
- `400 Bad Request` : Entreprise non assignée à l'agent
- `404 Not Found` : Entreprise/Conversation/Utilisateur non trouvé
- `401 Unauthorized` : Token invalide ou manquant
- `403 Forbidden` : Accès non autorisé à la conversation

### **Messages d'erreur**
```json
{
  "status": "ERROR",
  "message": "Cette entreprise n'est pas assignée à cet agent"
}
```

## 🔧 **Configuration**

### **Application.yml**
```yaml
logging:
  level:
    abdaty_technologie.API_Invest.service.impl.ChatServiceImpl: DEBUG
    abdaty_technologie.API_Invest.controller.BusinessChatController: DEBUG
```

### **Base de données**
- Tables créées automatiquement par Hibernate
- Index recommandés sur `entreprise_id`, `agent_id`, `user_id`

## 📈 **Monitoring**

### **Logs importants**
- `🚀 [ChatService] Agent X démarre conversation pour entreprise Y`
- `✅ Conversation créée avec ID: Z`
- `📤 [BusinessChat] Envoi message dans conversation X par Y`

### **Métriques**
- Nombre de conversations actives par agent
- Messages non lus par utilisateur
- Temps de réponse moyen

## 🔄 **Intégration Frontend**

### **Interface Agent**
```javascript
// Démarrer conversation
const response = await fetch('/api/v1/business-chat/conversations/start-from-entreprise/' + entrepriseId, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Message initial...'
  })
});
```

### **Interface Utilisateur**
```javascript
// Récupérer conversations
const conversations = await fetch('/api/v1/business-chat/conversations/user', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

## 🎯 **Prochaines étapes**

1. **Tester** l'API avec le script SQL fourni
2. **Intégrer** dans l'interface agent existante
3. **Créer** l'interface utilisateur pour les conversations
4. **Ajouter** notifications en temps réel (WebSocket)
5. **Implémenter** upload de documents dans les messages

## 📞 **Support**

Pour toute question sur cette implémentation :
- Vérifiez les logs avec le niveau DEBUG
- Utilisez le script SQL de test pour diagnostiquer
- Consultez les méthodes du `ChatServiceImpl` pour la logique métier
