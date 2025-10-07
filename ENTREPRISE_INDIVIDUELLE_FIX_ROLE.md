# Correction : Rôle par défaut et modification pour Entreprise Individuelle

## 🐛 Problème Identifié

Lors de la confirmation du rôle pour une entreprise individuelle :
1. ❌ Le rôle affiché était "ASSOCIE" au lieu de "DIRIGEANT"
2. ❌ Le rôle pouvait être modifié dans le formulaire d'édition
3. ❌ Le pourcentage de parts pouvait être modifié (devrait rester à 100%)

## ✅ Corrections Apportées

### 1. **Rôle par défaut dynamique** (Lignes 35-37, 45)

**Avant** :
```typescript
const [userRole, setUserRole] = useState<EntrepriseRole>('ASSOCIE');
const [formData, setFormData] = useState<Participant>({
  role: 'ASSOCIE',
  // ...
});
```

**Après** :
```typescript
// Rôle par défaut selon le type d'entreprise
const defaultRole = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'DIRIGEANT' : 'ASSOCIE';
const [userRole, setUserRole] = useState<EntrepriseRole>(defaultRole);
const [formData, setFormData] = useState<Participant>({
  role: defaultRole,
  // ...
});
```

### 2. **Mise à jour automatique du rôle** (Lignes 152-157)

Ajout d'un `useEffect` pour mettre à jour le rôle quand le type d'entreprise change :

```typescript
// Mettre à jour le rôle par défaut quand le type d'entreprise change
React.useEffect(() => {
  const newDefaultRole = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'DIRIGEANT' : 'ASSOCIE';
  setUserRole(newDefaultRole);
  setFormData(prev => ({ 
    ...prev, 
    role: newDefaultRole, 
    pourcentageParts: newDefaultRole === 'DIRIGEANT' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : prev.pourcentageParts 
  }));
}, [data.companyInfo?.typeEntreprise]);
```

### 3. **Parts à 100% pour entreprise individuelle** (Ligne 419)

**Avant** :
```typescript
pourcentageParts: cleanUserRole === 'GERANT' ? 0 : 100,
```

**Après** :
```typescript
pourcentageParts: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : (cleanUserRole === 'GERANT' ? 0 : 100),
```

### 4. **Blocage modification du rôle** (Lignes 995-1020)

**Champ rôle désactivé pour entreprise individuelle** :

```typescript
<select
  value={formData.role}
  onChange={(e) => setFormData({ ...formData, role: e.target.value as EntrepriseRole })}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
    data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
      : 'border-gray-300 focus:ring-mali-emerald'
  }`}
  disabled={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
  required
>
  {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
    <option value="DIRIGEANT">Dirigeant</option>
  ) : (
    <>
      <option value="DIRIGEANT">Dirigeant</option>
      <option value="ASSOCIE">Associé</option>
      <option value="GERANT">Gérant</option>
    </>
  )}
</select>
{data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
  <p className="text-sm text-gray-500 mt-1">
    Le rôle est fixé à "Dirigeant" pour une entreprise individuelle
  </p>
)}
```

### 5. **Blocage modification des parts** (Lignes 1027-1047)

**Champ pourcentage désactivé pour entreprise individuelle** :

```typescript
<input
  type="number"
  min="0"
  max="100"
  step="0.01"
  value={formData.pourcentageParts}
  onChange={(e) => setFormData({ ...formData, pourcentageParts: parseFloat(e.target.value) || 0 })}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
    data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
      : 'border-gray-300 focus:ring-mali-emerald'
  }`}
  disabled={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
  placeholder="0.00"
  required
/>
{data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
  <p className="text-sm text-gray-500 mt-1">
    Le dirigeant doit avoir 100% des parts pour une entreprise individuelle
  </p>
)}
```

## 📊 Résultat

### Pour ENTREPRISE_INDIVIDUELLE :
- ✅ **Rôle par défaut** : DIRIGEANT (automatique)
- ✅ **Sélection rôle** : Bloquée sur DIRIGEANT (grisé, non modifiable)
- ✅ **Pourcentage parts** : Fixé à 100% (grisé, non modifiable)
- ✅ **Message informatif** : Indication claire pour l'utilisateur
- ✅ **Mise à jour dynamique** : Change automatiquement si le type d'entreprise change

### Pour SOCIETE (inchangé) :
- ✅ **Rôle par défaut** : ASSOCIE
- ✅ **Sélection rôle** : Tous les rôles disponibles (DIRIGEANT, ASSOCIE, GERANT)
- ✅ **Pourcentage parts** : Modifiable librement
- ✅ **Comportement** : Identique à avant

## 🧪 Test de Validation

### Scénario 1 : Entreprise Individuelle
```
1. Sélectionner "Entreprise Individuelle"
2. Aller à l'étape Participants
3. Cliquer "Confirmer mon rôle"
   ✅ Rôle affiché : DIRIGEANT
   ✅ Pourcentage : 100%
4. Ouvrir le formulaire d'édition
   ✅ Champ rôle : Grisé, non modifiable, "Dirigeant"
   ✅ Champ parts : Grisé, non modifiable, "100"
   ✅ Messages informatifs affichés
```

### Scénario 2 : Changement de type
```
1. Sélectionner "Société"
2. Aller à l'étape Participants
   ✅ Rôle par défaut : ASSOCIE
3. Retour à l'étape précédente
4. Changer pour "Entreprise Individuelle"
5. Retour à l'étape Participants
   ✅ Rôle automatiquement changé : DIRIGEANT
   ✅ Parts automatiquement mises à : 100%
```

## 📁 Fichier Modifié

- ✅ `ParticipantsStep.tsx`
  - Lignes 35-37 : Rôle par défaut dynamique
  - Lignes 45 : FormData avec rôle dynamique
  - Lignes 152-157 : useEffect pour mise à jour automatique
  - Ligne 419 : Parts à 100% pour entreprise individuelle
  - Lignes 995-1020 : Champ rôle conditionnel et désactivé
  - Lignes 1027-1047 : Champ parts conditionnel et désactivé

## ✨ Améliorations UX

1. **Feedback visuel clair** :
   - Champs grisés pour indiquer qu'ils sont non modifiables
   - Curseur "not-allowed" au survol

2. **Messages informatifs** :
   - "Le rôle est fixé à 'Dirigeant' pour une entreprise individuelle"
   - "Le dirigeant doit avoir 100% des parts pour une entreprise individuelle"

3. **Comportement intelligent** :
   - Mise à jour automatique si changement de type d'entreprise
   - Pas besoin de réinitialiser manuellement

4. **Cohérence** :
   - Même logique dans tous les formulaires (sélection initiale + édition)
   - Validation stricte maintenue

## 🎯 Résultat Final

L'utilisateur voit maintenant correctement :
- ✅ Rôle "DIRIGEANT" par défaut pour entreprise individuelle
- ✅ Impossibilité de modifier le rôle (bloqué sur DIRIGEANT)
- ✅ Impossibilité de modifier les parts (bloquées à 100%)
- ✅ Messages clairs expliquant pourquoi les champs sont bloqués
- ✅ Comportement adaptatif selon le type d'entreprise
