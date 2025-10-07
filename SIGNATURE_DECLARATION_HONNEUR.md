# ✅ Implémentation : Signature Déclaration sur l'Honneur

## 🎯 Objectif

Permettre aux utilisateurs de **signer la déclaration sur l'honneur** directement dans l'application avec deux options :
1. **Signer à la main** : Dessiner la signature avec la souris ou le doigt (tactile)
2. **Uploader une signature** : Importer une image de signature scannée

---

## 📁 Fichiers Créés/Modifiés

### 1. **SignatureCanvas.tsx** (Nouveau Composant)
**Emplacement** : `frontend/investmali-user/investmali-react-user/src/components/SignatureCanvas.tsx`

**Fonctionnalités** :
- ✅ Canvas HTML5 pour dessiner la signature
- ✅ Support souris et tactile (mobile)
- ✅ Bouton pour effacer la signature
- ✅ Upload d'image de signature (PNG, JPG, JPEG)
- ✅ Validation taille max 2MB
- ✅ Conversion en Data URL (base64)
- ✅ Deux modes : "Signer à la main" ou "Uploader"

**Props** :
```typescript
interface SignatureCanvasProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  existingSignature?: string;
}
```

### 2. **BusinessCreation.tsx** (Interface Participant)
**Ligne modifiée** : 690-691

**Ajout** :
```typescript
export interface Participant {
  // ... autres champs
  declarationHonneurFile?: File;
  // Champ pour la signature (déclaration sur l'honneur)
  signatureDataUrl?: string;
  // ...
}
```

### 3. **ParticipantsStep.tsx** (Intégration)
**Modifications** :

#### Import (ligne 4)
```typescript
import SignatureCanvas from './SignatureCanvas';
```

#### État initial (lignes 54-58)
```typescript
const [formData, setFormData] = useState<Participant>({
  // ... autres champs
  declarationHonneurFile: undefined,
  signatureDataUrl: undefined
});
```

#### Validation (lignes 293-302)
```typescript
if (requiresManagerDocuments && !data.personalInfo?.hasCriminalRecord) {
  if (!formData.declarationHonneurFile && !formData.signatureDataUrl) {
    setErrors(['La déclaration d\'honneur avec signature est obligatoire (sans casier judiciaire)']);
    return;
  }
  if (!formData.signatureDataUrl) {
    setErrors(['La signature de la déclaration sur l\'honneur est obligatoire']);
    return;
  }
}
```

#### UI (lignes 1290-1304)
```typescript
{/* Zone de signature pour la déclaration sur l'honneur */}
<div className="mt-4">
  <label className="block text-sm font-medium text-blue-900 mb-3">
    ✍️ Signature de la déclaration sur l'honneur *
  </label>
  <SignatureCanvas
    onSignatureChange={(dataUrl) => {
      setFormData({ ...formData, signatureDataUrl: dataUrl || undefined });
    }}
    existingSignature={formData.signatureDataUrl}
  />
  <p className="text-xs text-blue-600 mt-2">
    📋 Signez directement ou uploadez une signature scannée
  </p>
</div>
```

---

## 🎨 Interface Utilisateur

### Mode 1 : Signer à la Main
```
┌─────────────────────────────────────────┐
│  ✍️ Signer à la main  │ 📤 Uploader     │
│  [ACTIF - Vert]       │ [Inactif - Gris]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│     [Zone de dessin - Canvas]           │
│     Dessinez votre signature ici        │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           🗑️ Effacer                    │
└─────────────────────────────────────────┘

Signez dans la zone ci-dessus avec votre souris ou votre doigt
```

### Mode 2 : Uploader une Signature
```
┌─────────────────────────────────────────┐
│  ✍️ Signer à la main  │ 📤 Uploader     │
│  [Inactif - Gris]     │ [ACTIF - Vert]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│              📤                          │
│   Cliquez pour uploader votre signature │
│   PNG, JPG, JPEG (max 2MB)              │
└─────────────────────────────────────────┘

Uploadez une image de votre signature (signature scannée ou photo)
```

### Après Upload
```
┌─────────────────────────────────────────┐
│   [Image de la signature affichée]      │
│                                         │
│           🗑️ Supprimer                  │
└─────────────────────────────────────────┘
```

---

## 🔄 Flux de Travail

### Pour Gérant (Société) sans Casier Judiciaire
1. Remplir les informations du gérant
2. Cocher "Non" pour le casier judiciaire
3. **Signer la déclaration sur l'honneur** :
   - Option A : Dessiner la signature
   - Option B : Uploader une image de signature
4. (Optionnel) Uploader le PDF de la déclaration
5. Ajouter le participant

### Pour Dirigeant (Entreprise Individuelle) sans Casier Judiciaire
1. Remplir les informations du dirigeant
2. Cocher "Non" pour le casier judiciaire
3. **Signer la déclaration sur l'honneur** :
   - Option A : Dessiner la signature
   - Option B : Uploader une image de signature
4. (Optionnel) Uploader le PDF de la déclaration
5. Ajouter le participant

---

## 📋 Validation

### Règles de Validation
1. **Signature obligatoire** si :
   - Rôle = GERANT (société) ET pas de casier judiciaire
   - Rôle = DIRIGEANT (entreprise individuelle) ET pas de casier judiciaire

2. **Format signature** :
   - Mode dessin : Data URL (base64) PNG
   - Mode upload : Data URL (base64) de l'image uploadée

3. **Taille maximum** :
   - Upload : 2MB

### Messages d'Erreur
- ❌ "La déclaration d'honneur avec signature est obligatoire (sans casier judiciaire)"
- ❌ "La signature de la déclaration sur l'honneur est obligatoire"

---

## 🧪 Tests

### Test 1 : Signature Dessinée
**Étapes** :
1. Ajouter un gérant
2. Cocher "Non" pour casier judiciaire
3. Cliquer sur "✍️ Signer à la main"
4. Dessiner une signature dans le canvas
5. Cliquer sur "Ajouter"

**Résultat attendu** : ✅ Participant ajouté avec signature

### Test 2 : Signature Uploadée
**Étapes** :
1. Ajouter un gérant
2. Cocher "Non" pour casier judiciaire
3. Cliquer sur "📤 Uploader"
4. Sélectionner une image de signature
5. Cliquer sur "Ajouter"

**Résultat attendu** : ✅ Participant ajouté avec signature

### Test 3 : Sans Signature
**Étapes** :
1. Ajouter un gérant
2. Cocher "Non" pour casier judiciaire
3. Ne pas signer
4. Cliquer sur "Ajouter"

**Résultat attendu** : ❌ Erreur "La signature de la déclaration sur l'honneur est obligatoire"

### Test 4 : Effacer Signature
**Étapes** :
1. Dessiner une signature
2. Cliquer sur "🗑️ Effacer"
3. Cliquer sur "Ajouter"

**Résultat attendu** : ❌ Erreur "La signature de la déclaration sur l'honneur est obligatoire"

### Test 5 : Mobile/Tactile
**Étapes** :
1. Ouvrir sur mobile ou tablette
2. Dessiner avec le doigt

**Résultat attendu** : ✅ Signature fonctionne au tactile

---

## 💾 Stockage de la Signature

### Format
La signature est stockée en **Data URL (base64)** :
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### Avantages
- ✅ Pas besoin de serveur de fichiers séparé
- ✅ Facile à transmettre via JSON
- ✅ Peut être affiché directement dans un `<img>`
- ✅ Compatible avec tous les navigateurs

### Utilisation Backend
Le backend peut :
1. Recevoir le Data URL dans le JSON
2. Décoder le base64
3. Sauvegarder comme BLOB dans la base de données
4. Ou sauvegarder comme fichier sur le serveur

---

## 🎨 Personnalisation

### Couleurs
- Bouton actif : `bg-mali-emerald` (vert Mali)
- Bouton inactif : `bg-gray-200`
- Canvas : Fond blanc, trait noir

### Dimensions
- Canvas : Largeur 100%, Hauteur 200px
- Trait : 2px, arrondi
- Upload max : 2MB

---

## 🚀 Prochaines Étapes

### Backend
1. Modifier l'API pour accepter `signatureDataUrl` dans la requête
2. Sauvegarder la signature en base de données
3. Générer le PDF de déclaration avec la signature intégrée

### Frontend
1. ✅ Composant SignatureCanvas créé
2. ✅ Intégration dans ParticipantsStep
3. ✅ Validation ajoutée
4. ⏳ Tester sur mobile/tablette
5. ⏳ Intégrer la signature dans le PDF généré

---

## 📊 Récapitulatif

### Fonctionnalités Ajoutées
- ✅ Canvas de signature interactif
- ✅ Support souris et tactile
- ✅ Upload de signature scannée
- ✅ Validation obligatoire
- ✅ Effacement de signature
- ✅ Prévisualisation

### Fichiers
- ✅ SignatureCanvas.tsx (nouveau)
- ✅ BusinessCreation.tsx (interface modifiée)
- ✅ ParticipantsStep.tsx (intégration)

### Tests
- ⏳ À effectuer sur desktop
- ⏳ À effectuer sur mobile
- ⏳ À effectuer sur tablette

---

## ✨ Conclusion

**La fonctionnalité de signature pour la déclaration sur l'honneur est implémentée !**

### Bénéfices
- ✅ Meilleure expérience utilisateur
- ✅ Signature numérique intégrée
- ✅ Pas besoin d'imprimer/scanner
- ✅ Validation stricte
- ✅ Compatible mobile

**Le système est prêt pour les tests ! 🎉**
