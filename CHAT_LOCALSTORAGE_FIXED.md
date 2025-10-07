# Correction : Suppression de localStorage dans le système de chat

## Problème identifié

Les composants de chat utilisaient `localStorage` pour récupérer les IDs utilisateurs et agents au lieu d'utiliser les données d'authentification provenant de l'API backend et des tables `conversations` et `messages`.

### Composants affectés

1. **UserChatModal.jsx** (Application utilisateur)
   - Lignes 36-40 : Récupération `userId` depuis localStorage
   - Lignes 86-110 : Logique complexe de récupération avec fallbacks localStorage
   
2. **ChatModal.tsx** (Application agent)
   - Lignes 171-177 : Récupération `agentId` depuis localStorage pour envoyer messages
   - Lignes 251-257 : Récupération `agentId` depuis localStorage pour créer conversations

## Solution implémentée

### ✅ UserChatModal.jsx

**Avant** :
```javascript
// Récupération depuis localStorage avec multiples fallbacks
let userId = localStorage.getItem('userId') || 
             localStorage.getItem('user_id') || 
             localStorage.getItem('personId') ||
             localStorage.getItem('person_id') ||
             '52960519-6e6d-4e92-b9b0-1a275719db1b';
```

**Après** :
```javascript
import { useAuth } from '../contexts/AuthContext';

const UserChatModal = ({ isOpen, onClose, user }) => {
  const { user: authUser } = useAuth();
  
  // Récupération depuis le contexte d'authentification
  const userId = authUser?.id || authUser?.personne_id || user?.id;
  
  if (!userId) {
    console.error('❌ Aucun ID utilisateur trouvé dans le contexte d\'authentification');
    return;
  }
}
```

### ✅ ChatModal.tsx

**Avant** :
```typescript
// Récupération depuis localStorage
const agentData = localStorage.getItem('agent');
let agentId = userId; // Fallback
if (agentData) {
  const parsedAgent = JSON.parse(agentData);
  agentId = parsedAgent.personneId || parsedAgent.personne?.id || agentId;
}
```

**Après** :
```typescript
import { useAgentAuth } from '../contexts/AgentAuthContext';

const ChatModal: React.FC<ChatModalProps> = ({ ... }) => {
  const { agent } = useAgentAuth();
  
  // Récupération depuis le contexte d'authentification
  const agentId = agent?.id;
  
  if (!agentId) {
    console.error('❌ Aucun ID agent trouvé dans le contexte d\'authentification');
    return;
  }
}
```

## Avantages de la correction

### 🎯 Architecture cohérente
- ✅ **Source unique de vérité** : Les données viennent du contexte d'authentification
- ✅ **Pas de duplication** : Plus de données dupliquées entre localStorage et contexte
- ✅ **Synchronisation automatique** : Les données sont toujours à jour

### 🔒 Sécurité améliorée
- ✅ **Pas de manipulation localStorage** : Impossible de modifier manuellement les IDs
- ✅ **Validation JWT** : Les données proviennent de l'authentification backend
- ✅ **Session cohérente** : Déconnexion automatique si le contexte est vide

### 🗄️ Utilisation correcte de la base de données
- ✅ **Tables `conversations`** : Toutes les conversations persistées en base
- ✅ **Tables `messages`** : Tous les messages sauvegardés en base
- ✅ **Pas de localStorage** : Aucune donnée de chat stockée localement

### 🐛 Correction des bugs
- ✅ **Plus de IDs hardcodés** : Suppression du fallback `'52960519-6e6d-4e92-b9b0-1a275719db1b'`
- ✅ **Plus de logique complexe** : Suppression des boucles sur localStorage
- ✅ **Gestion d'erreur claire** : Messages explicites si l'utilisateur n'est pas authentifié

## Workflow corrigé

### Utilisateur (UserChatModal)
1. **Authentification** → Contexte `AuthContext` contient `user.id`
2. **Ouverture chat** → Récupération `userId` depuis `authUser`
3. **API backend** → `GET /api/v1/chat/conversations/user/{userId}`
4. **Affichage** → Conversations depuis la table `conversations`
5. **Envoi message** → `POST /api/v1/chat/conversations/{id}/messages`
6. **Persistance** → Message sauvegardé dans table `messages`

### Agent (ChatModal)
1. **Authentification** → Contexte `AgentAuthContext` contient `agent.id`
2. **Ouverture chat** → Récupération `agentId` depuis `agent`
3. **API backend** → `GET /api/v1/chat/conversations/active?entrepriseId={id}`
4. **Affichage** → Conversations depuis la table `conversations`
5. **Envoi message** → `POST /api/v1/chat/conversations/{id}/messages`
6. **Persistance** → Message sauvegardé dans table `messages`

## Fichiers modifiés

1. **frontend/investmali-user/investmali-react-user/src/components/UserChatModal.jsx**
   - Ajout import `useAuth`
   - Suppression logique localStorage (lignes 36-110)
   - Utilisation `authUser?.id`
   - Passage de `userId` à `chatAPI.startConversation()`

2. **frontend/investmali-user/investmali-react-user/src/services/api.js**
   - Refactorisation `startConversation()` (lignes 500-520)
   - Suppression de toute logique localStorage
   - Ajout paramètre `userId` obligatoire
   - Validation : erreur si `userId` non fourni

3. **frontend/investmali-agent/src/components/ChatModal.tsx**
   - Ajout import `useAgentAuth`
   - Suppression logique localStorage (lignes 171-177, 251-257)
   - Utilisation `agent?.id`

4. **frontend/investmali-agent/src/components/AccueilStep.tsx**
   - Suppression logique localStorage dans `handleOpenChat()` (lignes 452-477)
   - Utilisation `agent?.id?.toString()` depuis le contexte
   - Gestion d'erreur si agent non authentifié

## Test recommandé

### Utilisateur
```bash
# 1. Se connecter avec un compte utilisateur
# 2. Ouvrir le chat
# 3. Vérifier dans les logs console : 
#    - "✅ UserId récupéré depuis le contexte: [UUID]"
#    - "📤 Démarrage conversation avec userId: [UUID]"
#    - Plus d'avertissement "⚠️ Aucun utilisateur trouvé dans localStorage"
#    - Plus de "🔧 Utilisation ID de test: 52960519-6e6d-4e92-b9b0-1a275719db1b"
# 4. Envoyer un message
# 5. Vérifier en base : SELECT * FROM messages WHERE conversation_id = '...'
```

### Agent
```bash
# 1. Se connecter avec un compte agent
# 2. Ouvrir une demande d'entreprise dans AccueilStep
# 3. Cliquer "💬 Contacter"
# 4. Vérifier dans les logs console : 
#    - "✅ Agent ID récupéré depuis le contexte: [UUID]"
#    - "✅ Agent nom: [Prénom Nom]"
#    - Plus d'avertissement "⚠️ Aucun agent trouvé dans localStorage"
# 5. Envoyer un message
# 6. Vérifier en base : SELECT * FROM messages WHERE sender_id = '[agent_id]'
```

## Résultat final

✅ **Système de chat 100% backend** :
- Toutes les conversations persistées en base de données
- Tous les messages sauvegardés en base de données
- Aucune donnée de chat dans localStorage
- Authentification via JWT et contextes React
- Architecture cohérente et maintenable

✅ **Impact utilisateur** :
- Conversations accessibles depuis n'importe quel appareil
- Historique complet des messages
- Synchronisation en temps réel
- Sécurité renforcée
