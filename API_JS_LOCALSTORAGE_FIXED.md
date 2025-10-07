# Correction : api.js - Suppression localStorage dans startConversation

## Problème identifié

La fonction `chatAPI.startConversation()` dans `api.js` utilisait localStorage pour récupérer l'userId, générant les avertissements :

```
⚠️ Aucun utilisateur trouvé dans localStorage, utilisation ID de test
🔧 Utilisation ID de test: 52960519-6e6d-4e92-b9b0-1a275719db1b
```

### Code problématique (lignes 500-544)

```javascript
startConversation: async (message, subject = "Demande d'assistance") => {
  try {
    // Récupérer l'utilisateur connecté - essayer plusieurs clés possibles
    let user = null;
    let userId = null;
    
    // Essayer différentes clés de localStorage
    const possibleKeys = ['investmali_user', 'user', 'currentUser', 'authUser'];
    
    for (const key of possibleKeys) {
      const userData = localStorage.getItem(key);
      if (userData) {
        try {
          user = JSON.parse(userData);
          userId = user.personneId || user.personne?.id || user.id || user.userId;
          if (userId) {
            console.log(`✅ Utilisateur trouvé avec la clé '${key}':`, { userId, user });
            break;
          }
        } catch (e) {
          console.warn(`⚠️ Erreur parsing ${key}:`, e);
        }
      }
    }
    
    // Si aucun utilisateur trouvé, utiliser un ID de test
    if (!userId) {
      console.warn('⚠️ Aucun utilisateur trouvé dans localStorage, utilisation ID de test');
      userId = '52960519-6e6d-4e92-b9b0-1a275719db1b'; // ID hardcodé
      console.log('🔧 Utilisation ID de test:', userId);
    }

    const response = await apiRequest('/api/v1/chat/conversations/start-user', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        message: message,
        subject: subject
      }),
    });
    return response;
  } catch (error) {
    console.error('Erreur lors du démarrage de la conversation:', error);
    throw error;
  }
}
```

### Problèmes

1. ❌ **Boucle sur localStorage** avec 4 clés différentes
2. ❌ **Parsing JSON** avec gestion d'erreur complexe
3. ❌ **ID hardcodé en fallback** (`52960519-6e6d-4e92-b9b0-1a275719db1b`)
4. ❌ **Logique dans api.js** au lieu du composant React
5. ❌ **Pas d'accès au contexte** d'authentification

## Solution implémentée

### Code corrigé

```javascript
// Démarrer une conversation avec un agent
startConversation: async (message, subject = "Demande d'assistance", userId = null) => {
  try {
    // Vérifier que userId est fourni
    if (!userId) {
      throw new Error('userId est requis pour démarrer une conversation');
    }

    console.log('📤 Démarrage conversation avec userId:', userId);

    const response = await apiRequest('/api/v1/chat/conversations/start-user', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        message: message,
        subject: subject
      }),
    });
    return response;
  } catch (error) {
    console.error('Erreur lors du démarrage de la conversation:', error);
    throw error;
  }
}
```

### Changements clés

1. ✅ **Paramètre userId** : Ajout du 3ème paramètre obligatoire
2. ✅ **Validation** : Erreur explicite si userId non fourni
3. ✅ **Suppression localStorage** : Toute la logique de récupération supprimée
4. ✅ **Logs clairs** : Message simple avec l'userId reçu
5. ✅ **Responsabilité déplacée** : Le composant React passe l'userId

## Utilisation dans UserChatModal.jsx

### Avant
```javascript
const response = await chatAPI.startConversation(
  "Bonjour, j'aimerais obtenir de l'aide concernant ma demande d'entreprise.",
  "Assistance demande d'entreprise"
);
```

### Après
```javascript
// Récupérer userId depuis le contexte d'authentification
const userId = authUser?.id || authUser?.personne_id || user?.id;

const response = await chatAPI.startConversation(
  "Bonjour, j'aimerais obtenir de l'aide concernant ma demande d'entreprise.",
  "Assistance demande d'entreprise",
  userId // ✅ Passer l'userId récupéré depuis le contexte
);
```

## Avantages

### 🎯 Architecture propre
- ✅ **Séparation des responsabilités** : api.js ne gère que les requêtes HTTP
- ✅ **Composant responsable** : UserChatModal gère l'authentification
- ✅ **Pas de duplication** : Une seule source pour l'userId (contexte)

### 🔒 Sécurité
- ✅ **Validation stricte** : Erreur si userId manquant
- ✅ **Pas de fallback dangereux** : Plus d'ID de test hardcodé
- ✅ **Traçabilité** : Log de l'userId utilisé

### 🐛 Bugs corrigés
- ✅ **Plus d'avertissement localStorage** : Suppression complète
- ✅ **Plus d'ID de test** : `52960519-6e6d-4e92-b9b0-1a275719db1b` supprimé
- ✅ **Gestion d'erreur claire** : Exception si userId manquant

## Logs avant/après

### ❌ Avant (avec localStorage)
```
⚠️ Aucun utilisateur trouvé dans localStorage, utilisation ID de test
🔧 Utilisation ID de test: 52960519-6e6d-4e92-b9b0-1a275719db1b
✅ Nouvelle conversation créée: {...}
```

### ✅ Après (avec paramètre)
```
✅ UserId récupéré depuis le contexte: aff038ae-8521-49e1-a756-a0c08f79f525
📤 Démarrage conversation avec userId: aff038ae-8521-49e1-a756-a0c08f79f525
✅ Nouvelle conversation créée: {...}
```

## Pattern appliqué

Ce pattern de **passage de paramètre** au lieu de **récupération localStorage** doit être appliqué partout :

### ❌ Mauvais pattern (à éviter)
```javascript
// Dans api.js
export const someAPI = async () => {
  const userId = localStorage.getItem('userId'); // ❌ Mauvais
  // ...
}
```

### ✅ Bon pattern (à suivre)
```javascript
// Dans api.js
export const someAPI = async (userId) => {
  if (!userId) throw new Error('userId requis'); // ✅ Validation
  // ...
}

// Dans le composant React
const { user } = useAuth();
await someAPI(user.id); // ✅ Passage depuis le contexte
```

## Cohérence du système

Cette correction s'aligne avec :

1. **UserChatModal.jsx** : Récupère userId depuis `useAuth()`
2. **ChatModal.tsx** : Récupère agentId depuis `useAgentAuth()`
3. **AccueilStep.tsx** : Récupère agentId depuis `useAgentAuth()`
4. **api.js** : Reçoit les IDs en paramètres, pas de localStorage

## Résultat

✅ **api.js complètement nettoyé** :
- Plus aucune utilisation de localStorage
- Validation stricte des paramètres
- Logs clairs et informatifs
- Architecture propre et maintenable

✅ **Système de chat 100% cohérent** :
- Tous les IDs proviennent des contextes d'authentification
- Aucune donnée de chat dans localStorage
- Persistance complète en base de données
- Code simple et facile à déboguer
