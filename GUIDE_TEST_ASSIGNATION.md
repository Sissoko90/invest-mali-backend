# Guide de Test - Système d'Assignation des Demandes d'Entreprises

## 🎯 Objectif
Tester le système d'assignation des demandes d'entreprises aux agents dans l'interface investmali-agent.

## 🔧 Prérequis
1. **Backend Spring Boot** démarré sur port 8080
2. **Frontend Agent** démarré sur port 3001
3. **Agent connecté** avec un token JWT valide
4. **Demandes d'entreprises** existantes dans la base de données

## 📋 Tests à Effectuer

### **Test 1: Vérification de l'Interface**
1. Accéder à `http://localhost:3001`
2. Se connecter avec un compte agent
3. Vérifier la présence des onglets :
   - ✅ "Demandes d'entreprises à traiter"
   - ✅ "Mes demandes assignées"

### **Test 2: Liste des Demandes Non Assignées**
1. Cliquer sur l'onglet "Demandes d'entreprises à traiter"
2. Vérifier que la liste affiche :
   - ✅ Demandes sans agent assigné
   - ✅ Bouton "M'assigner" pour chaque demande
   - ✅ Message explicatif sur les demandes non assignées

### **Test 3: Assignation d'une Demande**
1. Dans "Demandes d'entreprises à traiter"
2. Cliquer sur "M'assigner" pour une demande
3. Vérifier :
   - ✅ Message de succès affiché
   - ✅ Demande disparaît de la liste "à traiter"
   - ✅ Compteur "À traiter" diminue de 1
   - ✅ Compteur "Mes dossiers" augmente de 1

### **Test 4: Liste des Demandes Assignées**
1. Cliquer sur l'onglet "Mes demandes assignées"
2. Vérifier que la liste affiche :
   - ✅ La demande précédemment assignée
   - ✅ Boutons "Traiter" et "Mettre à jour"
   - ✅ Message explicatif sur les demandes assignées

### **Test 5: Diagnostic en Cas d'Erreur**
Si l'assignation échoue :
1. Ouvrir la console du navigateur (F12)
2. Noter l'ID de la demande qui échoue
3. Tester l'endpoint de diagnostic :
   ```
   GET http://localhost:8080/api/v1/entreprises/{ID}/test-assign
   Headers: Authorization: Bearer {TOKEN}
   ```
4. Analyser la réponse pour identifier le problème

## 🔍 Endpoints de Test

### **Diagnostic d'Assignation**
```http
GET /api/v1/entreprises/{id}/test-assign
Authorization: Bearer {token}
```

**Réponse attendue :**
```json
{
  "entrepriseExists": true,
  "entrepriseName": "Nom de l'entreprise",
  "etapeValidation": "ACCUEIL",
  "currentAssignedTo": null,
  "tokenPresent": true,
  "username": "agent@example.com",
  "userExists": true,
  "userId": "user-id",
  "userPersonne": "EXISTS",
  "userRole": "SUPER_ADMIN"
}
```

### **Assignation Manuelle**
```http
PATCH /api/v1/entreprises/{id}/assign
Authorization: Bearer {token}
Content-Type: application/json

{}
```

## 🐛 Résolution des Problèmes Courants

### **Erreur 500 - Permissions Insuffisantes**
**Symptôme :** L'assignation échoue avec erreur 500
**Cause :** Agent n'a pas le rôle requis pour l'étape
**Solution :** 
- Vérifier le rôle de l'agent avec l'endpoint de diagnostic
- Mode test activé : assignation autorisée avec avertissement
- Pour production : assigner le bon rôle à l'agent

### **Erreur 401 - Non Authentifié**
**Symptôme :** Erreur d'authentification
**Cause :** Token JWT invalide ou expiré
**Solution :** Se reconnecter à l'interface agent

### **Erreur 404 - Entreprise Non Trouvée**
**Symptôme :** Entreprise introuvable
**Cause :** ID d'entreprise incorrect
**Solution :** Vérifier l'ID dans la base de données

## 📊 Statistiques Attendues

### **Tableau de Bord**
- **Total des demandes** : Nombre total d'entreprises
- **À traiter** : Demandes sans agent assigné
- **Mes dossiers** : Demandes assignées à l'agent connecté
- **Approuvées** : Demandes avec statut approuvé

### **Comportement des Compteurs**
- Après assignation : "À traiter" ↓, "Mes dossiers" ↑
- Les compteurs se mettent à jour en temps réel

## 🔄 Workflow Complet

```mermaid
graph TD
    A[Agent se connecte] --> B[Consulte "Demandes à traiter"]
    B --> C[Voit liste des demandes non assignées]
    C --> D[Clique "M'assigner"]
    D --> E{Assignation réussie?}
    E -->|Oui| F[Demande disparaît de la liste]
    E -->|Non| G[Message d'erreur affiché]
    F --> H[Demande apparaît dans "Mes demandes assignées"]
    H --> I[Agent peut traiter la demande]
    G --> J[Utiliser diagnostic pour résoudre]
```

## ✅ Critères de Réussite

Le système fonctionne correctement si :
1. ✅ Les demandes non assignées apparaissent dans "Demandes à traiter"
2. ✅ L'assignation fonctionne sans erreur 500
3. ✅ Les demandes assignées disparaissent de la liste générale
4. ✅ Les demandes assignées apparaissent dans "Mes demandes assignées"
5. ✅ Les statistiques se mettent à jour en temps réel
6. ✅ Les messages d'erreur sont informatifs

## 🚀 Prochaines Étapes

Après validation des tests :
1. **Désactiver le mode test** en décommentant la vérification stricte
2. **Configurer les rôles agents** selon les étapes de validation
3. **Implémenter la désassignation** si nécessaire
4. **Ajouter des notifications** pour les assignations
5. **Créer un système de workflow** pour le traitement des demandes
