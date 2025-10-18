# 📄 Implémentation Cohérente avec EntrepriseDetails - Guide

## ✅ **Implémentation Alignée**

J'ai adapté l'implémentation des fonctionnalités "Voir" et "Télécharger" pour être **parfaitement cohérente** avec `EntrepriseDetails.tsx` !

## 🔄 **Analyse de EntrepriseDetails.tsx**

### **Fonctionnalités Identifiées**
```typescript
// 1. Visualisation avec Modal
const handleViewDocument = (documentId: string, documentName: string) => {
  setSelectedDocumentId(documentId);
  setSelectedDocumentName(documentName);
};

// 2. Téléchargement avec Blob
const handleDownloadDocument = async (documentId: string, documentName: string) => {
  const response = await fetch(`http://localhost:8080/api/v1/documents/${documentId}/file`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
    }
  });
  
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  // ... téléchargement automatique
};

// 3. DocumentViewer Modal
{selectedDocumentId && (
  <DocumentViewer
    documentId={selectedDocumentId}
    documentName={selectedDocumentName}
    onClose={handleCloseDocumentViewer}
  />
)}
```

## 🎯 **Adaptation pour UserProfile**

### **1. États Identiques**
```typescript
// États pour la visualisation de documents (comme dans EntrepriseDetails)
const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
```

### **2. Fonctions Adaptées**
```typescript
// Fonction pour voir un document (comme dans EntrepriseDetails)
const handleViewDocument = (documentId: string, documentName: string) => {
  console.log('👁️ Ouverture du viewer pour le document:', documentId);
  setSelectedDocumentId(documentId);
  setSelectedDocumentName(documentName);
};

// Fonction pour télécharger un document (comme dans EntrepriseDetails)
const handleDownloadDocument = async (documentId: string, documentName: string) => {
  const response = await fetch(`${process.env.REACT_APP_USER_API_URL}/documents/${documentId}/file`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}` // Token user au lieu d'agent
    }
  });
  
  // Même logique de blob et téléchargement
};
```

### **3. Composant DocumentViewer**
```typescript
// Créé un DocumentViewer spécifique pour les users
// Utilise les mêmes props et interface que EntrepriseDetails
<DocumentViewer
  documentId={selectedDocumentId}
  documentName={selectedDocumentName}
  onClose={handleCloseDocumentViewer}
/>
```

## 🔧 **Différences Clés**

### **Endpoints**
```typescript
// EntrepriseDetails (Agent)
`http://localhost:8080/api/v1/documents/${documentId}/file`

// UserProfile (User)
`${process.env.REACT_APP_USER_API_URL}/documents/${documentId}/file`
```

### **Tokens d'Authentification**
```typescript
// EntrepriseDetails (Agent)
'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`

// UserProfile (User)
'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`
```

### **Appels aux Boutons**
```typescript
// Même pattern que EntrepriseDetails
onClick={() => handleViewDocument(
  doc.id, 
  (doc.typeDocument || doc.type_document) ? getDocumentTypeName(...) : 
  (doc.typePiece || doc.type_piece) ? getPieceTypeName(...) : 'Document'
)}
```

## 📱 **DocumentViewer Créé**

### **Fonctionnalités**
- ✅ **Modal plein écran** avec overlay
- ✅ **Chargement du document** via API
- ✅ **Affichage iframe** pour PDF/images
- ✅ **Gestion d'erreurs** avec messages informatifs
- ✅ **Loading state** avec spinner
- ✅ **Cleanup automatique** des URL blobs

### **Interface**
```tsx
interface DocumentViewerProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}
```

## 🎨 **Expérience Utilisateur Cohérente**

### **Visualisation (👁️ Voir)**
```
1. Clic "👁️ Voir" → Modal DocumentViewer s'ouvre
2. Chargement du document via API
3. Affichage dans iframe intégrée
4. Bouton fermer pour revenir à la liste
```

### **Téléchargement (📥 Télécharger)**
```
1. Clic "📥 Télécharger" → Téléchargement immédiat
2. Blob créé depuis la réponse API
3. Lien de téléchargement automatique
4. Nom de fichier descriptif
5. Toast de confirmation
```

## 🔄 **Flux Identique à EntrepriseDetails**

### **Pattern de Nommage**
```typescript
// Génération du nom de document identique
(doc.typeDocument || doc.type_document) ? 
  getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
  (doc.typePiece || doc.type_piece) ? 
    getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 
    'Document'
```

### **Gestion des Erreurs**
```typescript
// Même pattern de gestion d'erreurs
try {
  // Action sur le document
} catch (error) {
  console.error('❌ Erreur lors du téléchargement:', error);
  addToast('error', 'Erreur lors du téléchargement du document');
}
```

## 📊 **Logs Cohérents**

### **EntrepriseDetails**
```javascript
❌ Erreur lors du téléchargement: [error]
```

### **UserProfile (Maintenant)**
```javascript
👁️ Ouverture du viewer pour le document: doc_123
📥 Téléchargement du document: doc_123
✅ Téléchargement du document réussi
❌ Erreur lors du téléchargement: [error]
```

## 🎯 **Avantages de la Cohérence**

### **Code Maintenable**
- ✅ **Même patterns** dans les deux composants
- ✅ **Fonctions similaires** avec adaptations minimales
- ✅ **Interface utilisateur** identique

### **Expérience Utilisateur**
- ✅ **Comportement prévisible** entre agent et user
- ✅ **Même modal** de visualisation
- ✅ **Même logique** de téléchargement

### **Debugging Facilité**
- ✅ **Logs similaires** pour diagnostiquer
- ✅ **Même endpoints** (avec tokens différents)
- ✅ **Gestion d'erreurs** uniforme

## 🚀 **Pour Tester**

### **1. Test de Visualisation**
1. **Cliquez "👁️ Voir"** sur un document
2. **Vérifiez** que le modal DocumentViewer s'ouvre
3. **Vérifiez** l'affichage du document dans l'iframe
4. **Testez** le bouton fermer

### **2. Test de Téléchargement**
1. **Cliquez "📥 Télécharger"** sur un document
2. **Vérifiez** le téléchargement automatique
3. **Vérifiez** le nom du fichier téléchargé
4. **Vérifiez** le toast de confirmation

### **3. Comparaison avec EntrepriseDetails**
1. **Testez** les mêmes actions dans EntrepriseDetails
2. **Comparez** le comportement
3. **Vérifiez** la cohérence de l'expérience

## 🎉 **Résultat Final**

L'implémentation est maintenant **parfaitement cohérente** avec EntrepriseDetails :

✅ **Même pattern** de fonctions (`handleViewDocument`, `handleDownloadDocument`)
✅ **Même modal** DocumentViewer avec interface identique
✅ **Même logique** de téléchargement avec blobs
✅ **Même gestion** d'erreurs et de loading
✅ **Adaptation appropriée** pour les tokens et endpoints users
✅ **Expérience utilisateur** identique entre agent et user

## 🔧 **Endpoints Backend Requis**

```
GET /api/v1/documents/{documentId}/file
- Headers: Authorization Bearer token
- Response: Blob du fichier document
- Utilisé pour visualisation ET téléchargement
```

**Les fonctionnalités "Voir" et "Télécharger" sont maintenant parfaitement alignées avec EntrepriseDetails !** 🎯
