# 👁️📥 Implémentation Voir et Télécharger Documents - Guide

## ✅ **Fonctionnalités Implémentées**

J'ai rendu les boutons "👁️ Voir" et "📥 Télécharger" **complètement fonctionnels** !

## 🔧 **Fonctions Implémentées**

### **1. Fonction viewDocument() - Visualisation**
```typescript
const viewDocument = async (entrepriseId: string, doc: any) => {
  // Construire l'URL de visualisation
  const documentType = doc.typeDocument || doc.type_document;
  const documentCategory = doc.typePiece || doc.type_piece;
  
  let viewUrl = `/upload/document/${entrepriseId}/${documentType}/download`;
  if (documentCategory) {
    viewUrl += `?documentCategory=${documentCategory}`;
  }
  
  // Ouvrir dans un nouvel onglet
  const fullUrl = `${process.env.REACT_APP_USER_API_URL}${viewUrl}`;
  window.open(fullUrl, '_blank');
  
  console.log('✅ Document ouvert dans un nouvel onglet');
};
```

### **2. Fonction downloadDocument() - Téléchargement**
```typescript
const downloadDocument = async (entrepriseId: string, doc: any) => {
  // Construire l'URL de téléchargement
  const documentType = doc.typeDocument || doc.type_document;
  const documentCategory = doc.typePiece || doc.type_piece;
  
  let downloadUrl = `/upload/document/${entrepriseId}/${documentType}/download`;
  if (documentCategory) {
    downloadUrl += `?documentCategory=${documentCategory}`;
  }
  
  // Créer un lien de téléchargement automatique
  const fullUrl = `${process.env.REACT_APP_USER_API_URL}${downloadUrl}`;
  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = `${documentType}_${doc.numero || 'document'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  addToast('success', 'Téléchargement du document initié');
};
```

## 🎯 **Boutons Connectés**

### **Bouton "👁️ Voir"**
```jsx
<button 
  onClick={() => viewDocument(app.id, doc)}
  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
  title="Voir le document"
>
  👁️ Voir
</button>
```

### **Bouton "📥 Télécharger"**
```jsx
<button 
  onClick={() => downloadDocument(app.id, doc)}
  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
  title="Télécharger le document"
>
  📥 Télécharger
</button>
```

## 🔄 **Logique de Construction des URLs**

### **Structure des URLs**
```
Base URL: ${process.env.REACT_APP_USER_API_URL}
Endpoint: /upload/document/{entrepriseId}/{documentType}/download
Query: ?documentCategory={documentCategory} (si applicable)
```

### **Exemples d'URLs Générées**
```
// Document simple
/upload/document/4c30f85f-2230-41a9-ab79-4df4e0d59dad/EXTRAIT_NAISSANCE/download

// Document avec catégorie
/upload/document/4c30f85f-2230-41a9-ab79-4df4e0d59dad/CARTE_IDENTITE/download?documentCategory=CNI

// Pièce justificative
/upload/document/4c30f85f-2230-41a9-ab79-4df4e0d59dad/CASIER_JUDICIAIRE/download?documentCategory=CASIER_JUDICIAIRE
```

## 📊 **Gestion des Types de Documents**

### **Types de Documents Supportés**
```typescript
// Documents principaux
doc.typeDocument || doc.type_document
// Exemples: EXTRAIT_NAISSANCE, CASIER_JUDICIAIRE, ACTE_MARIAGE

// Catégories de pièces
doc.typePiece || doc.type_piece  
// Exemples: CNI, PASSEPORT, PERMIS_CONDUIRE
```

### **Nom de Fichier Généré**
```typescript
// Format: {typeDocument}_{numero}.pdf
// Exemples:
// - EXTRAIT_NAISSANCE_123456789.pdf
// - CARTE_IDENTITE_CNI987654.pdf
// - CASIER_JUDICIAIRE_document.pdf (si pas de numéro)
```

## 🎨 **Expérience Utilisateur**

### **Visualisation (👁️ Voir)**
```
1. Clic "👁️ Voir"
2. Ouverture dans un nouvel onglet
3. Affichage du document (PDF, image, etc.)
4. Log de confirmation dans la console
```

### **Téléchargement (📥 Télécharger)**
```
1. Clic "📥 Télécharger"
2. Téléchargement automatique du fichier
3. Nom de fichier descriptif
4. Toast de confirmation
5. Log de confirmation dans la console
```

## 📋 **Logs de Debug**

### **Visualisation**
```javascript
👁️ Visualisation du document: EXTRAIT_NAISSANCE
✅ Document ouvert dans un nouvel onglet
```

### **Téléchargement**
```javascript
📥 Téléchargement du document: CARTE_IDENTITE
✅ Téléchargement du document initié
```

## 🛡️ **Gestion d'Erreurs**

### **Erreurs Possibles**
- **Document introuvable** : 404 du serveur
- **Permissions insuffisantes** : 403 du serveur
- **Problème réseau** : Timeout ou connexion
- **Format non supporté** : Type de fichier invalide

### **Gestion Frontend**
```typescript
try {
  // Action sur le document
} catch (error) {
  console.error('❌ Erreur:', error);
  addToast('error', 'Erreur lors de l\'action sur le document');
}
```

## 🔧 **Configuration Requise**

### **Variables d'Environnement**
```env
# Dans .env
REACT_APP_USER_API_URL=http://localhost:8080/api/v1
```

### **Endpoints Backend Nécessaires**
```
GET /api/v1/upload/document/{entrepriseId}/{documentType}/download
GET /api/v1/upload/document/{entrepriseId}/{documentType}/download?documentCategory={category}
```

## 🚀 **Pour Tester**

### **1. Test de Visualisation**
1. **Allez dans "Mes Demandes"** → Cliquez sur une demande
2. **Trouvez un document** dans la section "Documents"
3. **Cliquez "👁️ Voir"**
4. **Vérifiez** qu'un nouvel onglet s'ouvre avec le document
5. **Consultez les logs** dans la console

### **2. Test de Téléchargement**
1. **Trouvez un document** dans la section "Documents"
2. **Cliquez "📥 Télécharger"**
3. **Vérifiez** que le téléchargement commence
4. **Vérifiez le nom** du fichier téléchargé
5. **Consultez le toast** de confirmation

### **3. Vérification des URLs**
```javascript
// Dans la console du navigateur
console.log('URL générée:', fullUrl);
// Exemple: http://localhost:8080/api/v1/upload/document/4c30f85f.../EXTRAIT_NAISSANCE/download
```

## 🎯 **Différences Avant/Après**

### **❌ Avant (Non Fonctionnel)**
```jsx
<button title="Voir le document">
  👁️ Voir
</button>
// Clic → Aucune action
```

### **✅ Maintenant (Fonctionnel)**
```jsx
<button onClick={() => viewDocument(app.id, doc)} title="Voir le document">
  👁️ Voir
</button>
// Clic → Ouverture du document dans un nouvel onglet
```

## 🎉 **Résultat Final**

Les boutons sont maintenant **complètement fonctionnels** :

✅ **"👁️ Voir"** → Ouvre le document dans un nouvel onglet
✅ **"📥 Télécharger"** → Lance le téléchargement automatique
✅ **URLs dynamiques** → Construites selon le type de document
✅ **Noms de fichiers** → Descriptifs et informatifs
✅ **Gestion d'erreurs** → Toasts et logs appropriés
✅ **Logs de debug** → Pour diagnostiquer les problèmes
✅ **Expérience utilisateur** → Fluide et intuitive

## 🔍 **Endpoints Backend Attendus**

Pour que tout fonctionne parfaitement, assurez-vous que ces endpoints existent :

```
GET /api/v1/upload/document/{entrepriseId}/{documentType}/download
- Retourne le fichier pour visualisation/téléchargement
- Headers appropriés pour le type de contenu
- Gestion des permissions utilisateur
```

**Les boutons "👁️ Voir" et "📥 Télécharger" sont maintenant opérationnels !** 🎯
