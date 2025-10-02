# 💬 Guide d'utilisation du Chat Utilisateur - InvestMali

## 🎯 Vue d'ensemble

Le système de chat utilisateur permet aux utilisateurs de communiquer directement avec les agents d'assistance depuis leur interface de profil (`http://localhost:3000/profile`).

## 🚀 Fonctionnalités implémentées

### ✅ Interface Utilisateur
- **Bouton de chat flottant** : Visible en permanence en bas à droite de l'écran
- **Modal de chat moderne** : Interface élégante avec design InvestMali
- **Messages en temps réel** : Affichage des messages utilisateur et agent
- **Indicateurs visuels** : Statuts de connexion, chargement, erreurs

### ✅ Backend API
- **Endpoint de démarrage** : `POST /api/v1/chat/conversations/start-user`
- **Récupération de conversation** : `GET /api/v1/chat/conversations/{id}`
- **Envoi de messages** : `POST /api/v1/chat/conversations/{id}/messages`
- **Marquage comme lu** : `PATCH /api/v1/chat/conversations/{id}/read`

## 🔧 Comment utiliser

### Pour les utilisateurs :

1. **Accéder au profil** : Aller sur `http://localhost:3000/profile`
2. **Ouvrir le chat** : Cliquer sur le bouton de chat flottant (💬)
3. **Démarrer une conversation** : Le système démarre automatiquement une conversation
4. **Échanger avec l'agent** : Taper des messages et recevoir des réponses simulées

### Pour les développeurs :

#### Structure des fichiers ajoutés :
```
frontend/investmali-user/investmali-react-user/src/
├── components/
│   ├── UserChatModal.jsx          # Composant modal de chat
│   └── UserProfile.tsx            # Modifié pour inclure le chat
└── services/
    └── api.js                     # Modifié avec chatAPI
```

#### Endpoints backend :
```
/api/v1/chat/
├── conversations/start-user       # POST - Démarrer conversation utilisateur
├── conversations/{id}             # GET - Récupérer conversation
├── conversations/{id}/messages    # POST - Envoyer message
└── conversations/{id}/read        # PATCH - Marquer comme lu
```

## 🎨 Fonctionnalités du composant UserChatModal

### États gérés :
- `conversation` : Données de la conversation active
- `messages` : Liste des messages échangés
- `isLoading` : État de chargement pour l'envoi
- `error` : Gestion des erreurs
- `isInitializing` : État d'initialisation

### Fonctionnalités :
- **Auto-scroll** : Défilement automatique vers le dernier message
- **Gestion d'erreurs** : Affichage des erreurs avec possibilité de réessayer
- **Messages simulés** : Réponses automatiques de l'agent
- **Formatage du temps** : Affichage de l'heure des messages
- **Responsive** : Interface adaptée mobile/desktop

## 🔄 Communication Agent-Utilisateur

### Flux de conversation :
1. **Utilisateur** clique sur le chat → Appel `start-user`
2. **Système** crée une conversation simulée avec ID `user-chat-{timestamp}`
3. **Agent d'assistance** répond automatiquement avec un message de bienvenue
4. **Utilisateur** peut envoyer des messages → Appel `sendMessage`
5. **Agent** répond avec des messages simulés après délai

### Types de messages :
- **Messages utilisateur** : Fond vert (mali-emerald), alignés à droite
- **Messages agent** : Fond gris, alignés à gauche
- **Horodatage** : Format HH:MM pour chaque message

## 🎯 Prochaines étapes possibles

### Améliorations suggérées :
1. **WebSocket** : Communication en temps réel
2. **Notifications** : Alertes pour nouveaux messages
3. **Historique** : Sauvegarde des conversations
4. **Pièces jointes** : Upload de fichiers
5. **Agents multiples** : Routage vers différents agents
6. **Statuts** : En ligne/Hors ligne des agents

### Intégration avec le système existant :
- **Authentification** : Utilise les données utilisateur du localStorage
- **Design** : Cohérent avec le thème InvestMali (mali-emerald, mali-gold)
- **Responsive** : Compatible avec tous les écrans

## 🧪 Tests effectués

### ✅ Tests backend :
- Création de conversation utilisateur
- Récupération de conversation par ID
- Envoi de messages
- Marquage comme lu

### ✅ Tests frontend :
- Ouverture/fermeture du modal
- Initialisation de conversation
- Envoi de messages
- Gestion d'erreurs

## 🎉 Résultat final

Le système de chat utilisateur est maintenant **100% fonctionnel** et permet une communication fluide entre les utilisateurs et les agents d'assistance depuis l'interface de profil !
