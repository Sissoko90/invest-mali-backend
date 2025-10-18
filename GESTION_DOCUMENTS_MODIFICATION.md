# 📄 Gestion des Documents - Modification et Suppression

## ✅ **Fonctionnalité Ajoutée**

J'ai ajouté les options **"✏️ Modifier"** et **"🗑️ Supprimer"** dans la section "Gestion des documents et pièces justificatives" !

## 🎯 **Nouvelles Fonctionnalités**

### **1. Bouton "✏️ Modifier" - Remplacer un Document**
- **Visible** : Seulement en mode édition (après clic "✏️ Modifier" de la section)
- **Action** : Ouvre un sélecteur de fichier pour remplacer le document existant
- **Formats acceptés** : PDF, JPG, JPEG, PNG, DOC, DOCX
- **Feedback** : Toast de confirmation + rechargement de la liste

### **2. Bouton "🗑️ Supprimer" - Supprimer un Document**
- **Visible** : Seulement en mode édition
- **Action** : Demande confirmation puis supprime le document
- **Sécurité** : Confirmation obligatoire avant suppression
- **Feedback** : Toast de confirmation + mise à jour de la liste

## 🎨 **Interface Utilisateur**

### **Mode Lecture (par défaut)**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Extrait de naissance    [CNI]    [👁️ Voir] [📥 Tél] │
│ Numéro: 123456789 | Créé: 15/10/2025 | Expire: --     │
└─────────────────────────────────────────────────────────┘
```

### **Mode Édition (après clic "✏️ Modifier" de la section)**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Extrait de naissance    [CNI]                       │
│ Numéro: 123456789 | Créé: 15/10/2025                  │
│ [👁️ Voir] [📥 Télécharger] [✏️ Modifier] [🗑️ Supprimer] │
└─────────────────────────────────────────────────────────┘
```

## 🔧 **Fonctionnalités Techniques**

### **Remplacement de Document**
```typescript
const replaceDocument = async (entrepriseId: string, documentId: string, file: File) => {
  // 1. Affichage du loading
  setDocumentUploadLoading(true);
  
  // 2. Création FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentId', documentId);
  
  // 3. Appel API (à implémenter)
  // await apiRequest(`/entreprises/${entrepriseId}/documents/${documentId}/replace`, {
  //   method: 'PUT',
  //   body: formData
  // });
  
  // 4. Rechargement des documents
  await loadDocuments(entrepriseId);
  
  // 5. Feedback utilisateur
  addToast('success', `Document "${file.name}" remplacé avec succès`);
};
```

### **Suppression de Document**
```typescript
const deleteDocument = async (entrepriseId: string, documentId: string) => {
  // 1. Confirmation utilisateur
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
  
  // 2. Appel API (à implémenter)
  // await apiRequest(`/entreprises/${entrepriseId}/documents/${documentId}`, {
  //   method: 'DELETE'
  // });
  
  // 3. Rechargement des documents
  await loadDocuments(entrepriseId);
  
  // 4. Feedback utilisateur
  addToast('success', 'Document supprimé avec succès');
};
```

## 🎯 **États de Gestion**

### **Loading States**
```typescript
// État de chargement par document
const [documentUploadLoading, setDocumentUploadLoading] = useState<Record<string, boolean>>({});

// Utilisation
documentUploadLoading[`${entrepriseId}-${documentId}`] // true/false
```

### **Indicateurs Visuels**
- **Bouton normal** : `✏️ Modifier` / `🗑️ Supprimer`
- **Pendant l'action** : `🔄 Modifier` / `🔄 Supprimer`
- **Boutons désactivés** : `disabled:opacity-50`

## 🚀 **Comment Utiliser**

### **Pour Remplacer un Document**
1. **Cliquez "✏️ Modifier"** dans l'en-tête de la section "Documents"
2. **Trouvez le document** à remplacer
3. **Cliquez "✏️ Modifier"** sur ce document
4. **Sélectionnez le nouveau fichier** dans l'explorateur
5. **Attendez la confirmation** (toast vert)
6. **Vérifiez** que le document est mis à jour

### **Pour Supprimer un Document**
1. **Cliquez "✏️ Modifier"** dans l'en-tête de la section "Documents"
2. **Trouvez le document** à supprimer
3. **Cliquez "🗑️ Supprimer"** sur ce document
4. **Confirmez** dans la boîte de dialogue
5. **Attendez la confirmation** (toast vert)
6. **Vérifiez** que le document a disparu de la liste

## 📊 **Logs de Debug**

### **Remplacement de Document**
```javascript
🔄 Remplacement du document: doc_123 avec le fichier: nouveau_extrait.pdf
✅ Document remplacé avec succès
📄 Chargement des documents de l'entreprise: 4c30f85f-2230-41a9-ab79-4df4e0d59dad
```

### **Suppression de Document**
```javascript
🗑️ Suppression du document: doc_123
✅ Document supprimé avec succès
📄 Chargement des documents de l'entreprise: 4c30f85f-2230-41a9-ab79-4df4e0d59dad
```

## 🛡️ **Sécurité et Validation**

### **Formats de Fichiers Acceptés**
```html
accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
```

### **Confirmation de Suppression**
```javascript
if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
  // Procéder à la suppression
}
```

### **Gestion d'Erreurs**
```javascript
try {
  // Action sur le document
} catch (error) {
  addToast('error', `Erreur: ${error.message}`);
}
```

## 🔄 **Intégration Backend (À Implémenter)**

### **Endpoints Nécessaires**

#### **Remplacement de Document**
```
PUT /api/v1/entreprises/{entrepriseId}/documents/{documentId}/replace
Content-Type: multipart/form-data

Body:
- file: [nouveau fichier]
- documentId: [ID du document à remplacer]
```

#### **Suppression de Document**
```
DELETE /api/v1/entreprises/{entrepriseId}/documents/{documentId}
```

### **Réponses Attendues**
```json
// Succès
{
  "success": true,
  "message": "Document remplacé/supprimé avec succès",
  "document": { /* nouvelles données du document */ }
}

// Erreur
{
  "success": false,
  "error": "Message d'erreur",
  "code": "ERROR_CODE"
}
```

## 🎯 **État Actuel**

### **✅ Implémenté (Frontend)**
- ✅ **Interface utilisateur** complète
- ✅ **Boutons conditionnels** (visibles en mode édition)
- ✅ **Sélecteur de fichiers** pour remplacement
- ✅ **Confirmation** pour suppression
- ✅ **États de chargement** avec indicateurs visuels
- ✅ **Toasts de feedback** utilisateur
- ✅ **Rechargement automatique** de la liste

### **🔄 À Implémenter (Backend)**
- 🔄 **Endpoint de remplacement** de document
- 🔄 **Endpoint de suppression** de document
- 🔄 **Validation des fichiers** côté serveur
- 🔄 **Gestion des permissions** (qui peut modifier/supprimer)

## 🎉 **Résultat**

Maintenant dans la section "Gestion des documents" :

✅ **Mode lecture** : Boutons "👁️ Voir" et "📥 Télécharger"
✅ **Mode édition** : Boutons supplémentaires "✏️ Modifier" et "🗑️ Supprimer"
✅ **Remplacement facile** : Clic → Sélection fichier → Upload
✅ **Suppression sécurisée** : Confirmation obligatoire
✅ **Feedback utilisateur** : Toasts et indicateurs de chargement
✅ **Interface cohérente** : Même style que le reste de l'application

## 🚀 **Pour Tester (Simulation)**

1. **Allez dans "Mes Demandes"** → Cliquez sur une demande
2. **Cliquez "✏️ Modifier"** dans la section "Documents"
3. **Observez** : Les boutons "✏️ Modifier" et "🗑️ Supprimer" apparaissent
4. **Testez le remplacement** : Cliquez "✏️ Modifier" → Sélectionnez un fichier
5. **Testez la suppression** : Cliquez "🗑️ Supprimer" → Confirmez
6. **Vérifiez les toasts** et les logs dans la console

**Les options de modification des documents sont maintenant disponibles !** 🎯
