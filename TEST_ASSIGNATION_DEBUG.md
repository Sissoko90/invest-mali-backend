# 🔍 Guide de Debug - Assignation des Demandes

## 🎯 Problème
Les demandes assignées avec succès restent dans "Demandes d'entreprises à traiter" au lieu d'apparaître dans "Mes demandes assignées".

## 🧪 Tests de Debug

### **1. Vérifier les Logs Console**

Après avoir cliqué "M'assigner", vérifiez ces logs dans la console (F12) :

```
📌 Assignation de la demande: [ID]
🔍 Agent ID actuel: [AGENT_ID]
🔄 Mise à jour de l'application: [ID] assignedAgent: [AGENT_ID]
📊 Applications après mise à jour: [X] assignées
✅ Demande assignée avec succès
🔄 Rechargement des données depuis le backend...
📊 Nouvelles données reçues: [X] applications
```

### **2. Vérifier le Filtrage**

Changez d'onglet et observez ces logs :

```
🔍 Filtrage des applications - Onglet actif: applications
📊 Total applications: [X]
👤 Agent ID: [AGENT_ID]
📋 Demandes non assignées: [X]
```

Puis sur l'onglet "Mes demandes assignées" :

```
🔍 Filtrage des applications - Onglet actif: assigned-applications
📊 Total applications: [X]
👤 Agent ID: [AGENT_ID]
📋 Mes demandes assignées: [X]
🔍 Applications avec assignedAgent: [...]
✅ Applications filtrées finales: [X]
```

### **3. Vérifier la Structure des Données**

Dans la console, tapez :

```javascript
// Vérifier l'agent connecté
console.log('Agent:', window.agent);

// Vérifier les applications
console.log('Applications:', window.applications);

// Vérifier les applications assignées
console.log('Assignées:', window.applications?.filter(app => app.assignedAgent));
```

## 🔧 Solutions Possibles

### **Solution 1: Problème de Mapping Backend**

Si les logs montrent que `assignedAgent` est `undefined`, le problème vient du backend. Vérifiez que l'API retourne bien le champ `assignedAgent` ou `assigned_to`.

### **Solution 2: Problème d'ID Agent**

Si l'`Agent ID` est `undefined` dans les logs, le problème vient de l'authentification. Vérifiez le token JWT.

### **Solution 3: Problème de Synchronisation**

Si la mise à jour locale fonctionne mais le rechargement écrase les données, le problème vient de l'API qui ne retourne pas les données mises à jour.

## 🛠️ Actions Correctives

### **Action 1: Vérifier l'API Backend**

```bash
# Tester l'assignation
curl -X PATCH "http://localhost:8080/api/v1/entreprises/{ID}/assign" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'

# Vérifier les demandes assignées
curl -X GET "http://localhost:8080/api/v1/entreprises/assigned-to-me" \
  -H "Authorization: Bearer {TOKEN}"
```

### **Action 2: Vérifier la Base de Données**

```sql
-- Vérifier que la colonne existe
SHOW COLUMNS FROM entreprise LIKE 'assigned_to';

-- Vérifier les assignations
SELECT id, nom, assigned_to FROM entreprise WHERE assigned_to IS NOT NULL;
```

### **Action 3: Forcer la Synchronisation**

Si le problème persiste, ajoutez cette fonction temporaire :

```typescript
const forceRefresh = () => {
  window.location.reload();
};

// Dans le bouton d'assignation
<button onClick={() => { handleAssignToMe(app.id); setTimeout(forceRefresh, 2000); }}>
  M'assigner
</button>
```

## 📊 Résultats Attendus

### **Comportement Correct**

1. **Avant assignation** :
   - Onglet "Demandes à traiter" : Demande visible
   - Onglet "Mes demandes assignées" : Demande absente

2. **Après assignation** :
   - Onglet "Demandes à traiter" : Demande disparue
   - Onglet "Mes demandes assignées" : Demande apparue

3. **Logs attendus** :
   ```
   📋 Demandes non assignées: [X-1]  // Une de moins
   📋 Mes demandes assignées: [Y+1]  // Une de plus
   ```

## 🚨 Signaux d'Alerte

### **Problème Backend**
- `assignedAgent` reste `undefined` après assignation
- L'API `/assigned-to-me` retourne une erreur
- La base de données n'a pas la colonne `assigned_to`

### **Problème Frontend**
- L'`Agent ID` est `undefined`
- Les logs de filtrage ne s'affichent pas
- Les données ne se rechargent pas après assignation

### **Problème de Synchronisation**
- La mise à jour locale fonctionne mais disparaît après rechargement
- Les compteurs ne se mettent pas à jour
- Les onglets affichent les mêmes données

## 🎯 Prochaines Étapes

1. **Exécuter les tests** dans l'ordre
2. **Identifier le problème** avec les logs
3. **Appliquer la solution** correspondante
4. **Valider le comportement** complet
5. **Nettoyer les logs** de debug une fois résolu
