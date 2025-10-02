# 🧪 Guide de Test - Système de Chat Unifié

## 🎯 Objectif
Tester la communication bidirectionnelle entre l'interface utilisateur et l'interface agent.

## 📋 Étapes de Test

### **Étape 1 : Démarrer une conversation côté utilisateur**
1. Aller sur `http://localhost:3000/profile`
2. Cliquer sur le bouton de chat flottant (💬)
3. La conversation devrait se créer automatiquement
4. **Vérifier** : Message de bienvenue de l'agent visible

### **Étape 2 : Voir la conversation côté agent**
1. Aller sur l'interface agent
2. Cliquer sur "💬 Contacter" pour une entreprise
3. **Vérifier** : La conversation créée par l'utilisateur apparaît dans la liste
4. Cliquer sur la conversation pour l'ouvrir

### **Étape 3 : Communication bidirectionnelle**
1. **Utilisateur** : Envoyer un message depuis `/profile`
2. **Agent** : Actualiser et voir le nouveau message
3. **Agent** : Répondre depuis l'interface agent
4. **Utilisateur** : Recharger et voir la réponse de l'agent

## 🔧 Endpoints de Test Direct

### Créer une conversation utilisateur :
```bash
curl -X POST http://localhost:8080/api/v1/chat/conversations/start-user \
  -H "Content-Type: application/json" \
  -d '{"userId": "52960519-6e6d-4e92-b9b0-1a275719db1b", "message": "Bonjour, j'\''ai besoin d'\''aide", "subject": "Test conversation"}'
```

### Lister les conversations actives :
```bash
curl http://localhost:8080/api/v1/chat/conversations/active
```

### Envoyer un message utilisateur :
```bash
curl -X POST http://localhost:8080/api/v1/chat/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Message de l'\''utilisateur"}'
```

### Envoyer un message agent :
```bash
curl -X POST http://localhost:8080/api/v1/chat/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Réponse de l'\''agent", "senderId": "0e310523-c3a2-4e5b-8674-1c0d1614ea83"}'
```

### Récupérer une conversation :
```bash
curl http://localhost:8080/api/v1/chat/conversations/CONVERSATION_ID
```

## ✅ Critères de Réussite

### **Communication Bidirectionnelle** :
- ✅ L'utilisateur peut créer une conversation
- ✅ L'agent voit la conversation dans sa liste
- ✅ L'utilisateur peut envoyer des messages
- ✅ L'agent peut répondre aux messages
- ✅ Les messages sont synchronisés entre les deux interfaces

### **Interface Agent** :
- ✅ Liste des conversations actives
- ✅ Ouverture d'une conversation spécifique
- ✅ Envoi de messages avec identification agent
- ✅ Actualisation des conversations

### **Interface Utilisateur** :
- ✅ Création automatique de conversation
- ✅ Envoi de messages avec identification utilisateur
- ✅ Réception des réponses de l'agent
- ✅ Interface responsive et intuitive

## 🐛 Problèmes Potentiels

### **Si les conversations n'apparaissent pas** :
1. Vérifier que le serveur backend fonctionne
2. Vérifier les logs de la console pour les erreurs
3. Tester les endpoints directement avec curl

### **Si les messages ne se synchronisent pas** :
1. Vérifier que les IDs de conversation sont corrects
2. Actualiser manuellement les interfaces
3. Vérifier les logs backend pour les erreurs d'envoi

### **Si l'identification des expéditeurs est incorrecte** :
1. Vérifier les IDs dans localStorage (agent/utilisateur)
2. Vérifier que les `senderId` sont correctement passés
3. Vérifier la logique de détermination du `senderType`

## 🎉 Résultat Attendu

À la fin du test, vous devriez avoir :
- Une conversation créée par l'utilisateur
- Visible et accessible par l'agent
- Échange de messages bidirectionnel fonctionnel
- Identification correcte des expéditeurs (USER vs AGENT)
- Synchronisation en temps réel (avec actualisation manuelle)

## 🚀 Prochaines Améliorations

1. **WebSocket** : Communication en temps réel sans actualisation
2. **Notifications** : Alertes pour nouveaux messages
3. **Statuts** : En ligne/Hors ligne, "en train d'écrire"
4. **Pièces jointes** : Support des fichiers et images
5. **Historique** : Persistance en base de données
