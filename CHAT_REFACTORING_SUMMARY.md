# Résumé : Refactorisation complète du système de chat

## Objectif

Éliminer l'utilisation de `localStorage` pour les données de chat et assurer que **toutes les conversations et messages sont persistés en base de données**.

## Problèmes identifiés et corrigés

### 1. ❌ localStorage pour userId (Frontend Utilisateur)

**Problème** : `UserChatModal.jsx` récupérait l'userId depuis localStorage avec multiples fallbacks et un ID hardcodé.

**Solution** : Utilisation du contexte `AuthContext`
```javascript
import { useAuth } from '../contexts/AuthContext';

const UserChatModal = ({ isOpen, onClose, user }) => {
  const { user: authUser } = useAuth();
  const userId = authUser?.id || authUser?.personne_id || user?.id;
  
  if (!userId) {
    console.error('❌ Aucun ID utilisateur trouvé');
    return;
  }
}
```

**Fichier** : `frontend/investmali-user/investmali-react-user/src/components/UserChatModal.jsx`

---

### 2. ❌ localStorage pour agentId (Frontend Agent - ChatModal)

**Problème** : `ChatModal.tsx` récupérait l'agentId depuis localStorage pour envoyer des messages.

**Solution** : Utilisation du contexte `AgentAuthContext`
```typescript
import { useAgentAuth } from '../contexts/AgentAuthContext';

const ChatModal: React.FC<ChatModalProps> = ({ ... }) => {
  const { agent } = useAgentAuth();
  const agentId = agent?.id;
  
  if (!agentId) {
    console.error('❌ Aucun ID agent trouvé');
    return;
  }
}
```

**Fichier** : `frontend/investmali-agent/src/components/ChatModal.tsx`

---

### 3. ❌ localStorage pour agentId (Frontend Agent - AccueilStep)

**Problème** : `AccueilStep.tsx` récupérait l'agentId depuis localStorage avec un ID hardcodé en fallback.

**Solution** : Utilisation du contexte `AgentAuthContext`
```typescript
const handleOpenChat = async (demande: DemandeEntreprise) => {
  const agentId = agent?.id?.toString();
  const agentNom = agent?.firstName && agent?.lastName 
    ? `${agent.firstName} ${agent.lastName}` 
    : agent?.email || 'Agent';
  
  if (!agentId) {
    console.error('❌ Aucun agent trouvé');
    alert('Erreur : Vous devez être connecté pour ouvrir le chat');
    return;
  }
}
```

**Fichier** : `frontend/investmali-agent/src/components/AccueilStep.tsx`

---

### 4. ❌ localStorage dans api.js (startConversation)

**Problème** : `chatAPI.startConversation()` cherchait l'userId dans 4 clés localStorage différentes avec un ID de test en fallback.

**Solution** : Paramètre userId obligatoire
```javascript
startConversation: async (message, subject = "Demande d'assistance", userId = null) => {
  if (!userId) {
    throw new Error('userId est requis pour démarrer une conversation');
  }
  
  console.log('📤 Démarrage conversation avec userId:', userId);
  // Utilise l'userId passé en paramètre
}
```

**Fichier** : `frontend/investmali-user/investmali-react-user/src/services/api.js`

---

### 5. ❌ Messages non persistés en base de données

**Problème** : `ChatController.sendMessage()` utilisait des Maps en mémoire au lieu du `ChatService`.

**Solution** : Utilisation du ChatService
```java
@PostMapping("/conversations/{conversationId}/messages")
public ResponseEntity<Map<String, Object>> sendMessage(...) {
    // Validation...
    
    // ✅ Utiliser le ChatService pour sauvegarder en base
    MessageRequest messageRequest = new MessageRequest();
    messageRequest.setContent(content.trim());
    messageRequest.setMessageType("TEXT");
    
    MessageResponse messageResponse = chatService.sendMessage(conversationId, messageRequest, senderId);
    
    logger.info("✅ Message sauvegardé en base - messageId: {}", messageResponse.getId());
    
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

**Fichier** : `src/main/java/abdaty_technologie/API_Invest/controller/ChatController.java`

---

### 6. ❌ Méthodes DTO incorrectes

**Problème** : Le controller utilisait `getCreatedAt()` et `getSenderType()` qui n'existent pas dans `MessageResponse`.

**Solution** : Utilisation des bonnes méthodes
```java
response.put("timestamp", messageResponse.getCreation()); // ✅ getCreation()
response.put("senderType", messageResponse.getSenderRole()); // ✅ getSenderRole()
```

**Fichier** : `src/main/java/abdaty_technologie/API_Invest/controller/ChatController.java`

---

### 7. ❌ Conversations non persistées en base de données

**Problème** : `/conversations/start-agent` créait les conversations dans des Maps en mémoire.

**Solution** : Utilisation du ChatService
```java
@PostMapping("/conversations/start-agent")
public ResponseEntity<Map<String, Object>> startConversationFromAgent(...) {
    // Validation...
    
    // ✅ Utiliser le ChatService pour créer en base
    ConversationRequest conversationRequest = new ConversationRequest();
    conversationRequest.setUserId(userId);
    conversationRequest.setSubject(subject != null ? subject : "Contact agent");
    conversationRequest.setEntrepriseId(entrepriseId);
    conversationRequest.setInitialMessage(message);
    
    ConversationResponse conversationResponse = chatService.createConversation(conversationRequest, agentId);
    
    logger.info("✅ Conversation créée en base - conversationId: {}", conversationResponse.getId());
    
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

**Fichier** : `src/main/java/abdaty_technologie/API_Invest/controller/ChatController.java`

---

## Problème actuel : Agent non trouvé

### Erreur
```
❌ Erreur lors de la création: Erreur: Agent non trouvé
```

### Cause
Le `ChatService` essaie de récupérer l'agent avec l'ID `0e310523-c3a2-4e5b-8674-1c0d1614ea83` mais cet ID n'existe pas dans la table `persons`.

### Solution requise

**Option 1 : Vérifier si l'agent existe**
```sql
SELECT id, nom, prenom, email 
FROM persons 
WHERE id = '0e310523-c3a2-4e5b-8674-1c0d1614ea83';
```

**Option 2 : Créer l'agent s'il n'existe pas**
```sql
INSERT INTO persons (id, nom, prenom, email, telephone1, role)
VALUES (
  '0e310523-c3a2-4e5b-8674-1c0d1614ea83',
  'Macalou',
  'Moussa',
  'moussa.macalou@api-invest.ml',
  '+223 70 00 00 00',
  'AGENT'
);
```

**Option 3 : Utiliser l'ID correct de l'agent connecté**

Vérifier que l'agent est bien connecté et que son ID dans le contexte correspond à un ID existant en base :
```typescript
// Dans AgentAuthContext
console.log('Agent ID:', agent?.id);
```

Puis vérifier en base :
```sql
SELECT id, nom, prenom, email FROM persons WHERE id = '[ID affiché]';
```

---

## Résumé des fichiers modifiés

### Frontend Utilisateur
1. ✅ `UserChatModal.jsx` - Utilisation `useAuth()`
2. ✅ `api.js` - Paramètre userId obligatoire

### Frontend Agent
3. ✅ `ChatModal.tsx` - Utilisation `useAgentAuth()`
4. ✅ `AccueilStep.tsx` - Utilisation `useAgentAuth()`

### Backend
5. ✅ `ChatController.java` - Méthode `sendMessage()` utilise ChatService
6. ✅ `ChatController.java` - Correction getters DTO
7. ✅ `ChatController.java` - Méthode `startConversationFromAgent()` utilise ChatService

---

## État actuel du système

### ✅ Fonctionnel
- Récupération userId/agentId depuis contextes d'authentification
- Plus d'utilisation de localStorage pour les données de chat
- Messages persistés en base de données (quand conversation existe)
- Méthodes DTO correctes

### ⚠️ À corriger
- **Agent non trouvé** : L'ID de l'agent dans le contexte ne correspond pas à un ID en base
- Vérifier que l'agent existe dans la table `persons`
- Ou créer l'agent avec le bon ID

---

## Prochaines étapes

1. **Vérifier l'existence de l'agent en base**
   ```sql
   SELECT * FROM persons WHERE id = '0e310523-c3a2-4e5b-8674-1c0d1614ea83';
   ```

2. **Si l'agent n'existe pas** :
   - Option A : Le créer en base avec cet ID
   - Option B : Utiliser l'ID d'un agent existant
   - Option C : Créer l'agent via l'interface d'inscription

3. **Tester le workflow complet** :
   - Agent se connecte
   - Agent ouvre le chat pour une entreprise
   - Conversation créée en DB ✅
   - Agent envoie un message
   - Message sauvegardé en DB ✅

---

## Architecture finale

```
Frontend Utilisateur
├── UserChatModal.jsx → useAuth() → userId
└── api.js → startConversation(message, subject, userId)

Frontend Agent
├── ChatModal.tsx → useAgentAuth() → agentId
└── AccueilStep.tsx → useAgentAuth() → agentId

Backend
├── ChatController.java
│   ├── /conversations/start-agent → chatService.createConversation()
│   └── /conversations/{id}/messages → chatService.sendMessage()
└── ChatService.java
    ├── createConversation() → conversationRepository.save()
    └── sendMessage() → messageRepository.save()

Base de données
├── conversations (table)
├── messages (table)
└── persons (table) ⚠️ Vérifier que l'agent existe
```

---

## Résultat attendu

✅ **Système de chat 100% persisté** :
- Toutes les conversations en base de données
- Tous les messages en base de données
- Aucune donnée dans localStorage
- Relations JPA correctes
- UUID générés automatiquement
- Architecture backend cohérente

⚠️ **Action requise** : Vérifier/créer l'agent dans la table `persons`
