# 📋 Résumé : Règles Entreprise Individuelle

## ✅ Implémentation Terminée

### 🎯 Objectif
Lors de la création d'une entreprise, si un utilisateur choisit **"Entreprise Individuelle"** dans le Type d'entreprise, alors :

1. ✅ **Un seul participant** autorisé
2. ✅ **Rôle unique** : DIRIGEANT (pas de GERANT, pas d'ASSOCIE)
3. ✅ **100% des parts** obligatoire pour le dirigeant
4. ✅ **Documents requis** : mêmes que pour un gérant (pièce d'identité, casier judiciaire ou déclaration d'honneur, acte de mariage si marié)

---

## 📁 Fichiers Modifiés

### Frontend
- ✅ `ParticipantsStep.tsx`
  - Validation conditionnelle selon le type d'entreprise
  - Affichage des règles adapté
  - Sélection de rôle limitée à DIRIGEANT
  - Bouton "Ajouter un autre participant" masqué

### Backend
- ✅ `EntrepriseServiceImpl.java`
  - Méthode `validateParticipants()` refactorisée
  - Nouvelle méthode `validatePersonEligibility()` réutilisable
  - Validation stricte pour entreprises individuelles

---

## 🔄 Workflow Utilisateur

### Pour ENTREPRISE_INDIVIDUELLE :

```
1. Sélection Type d'entreprise
   └─> "Entreprise Individuelle"
   └─> Forme juridique auto-sélectionnée : "E_I"

2. Étape Participants
   └─> Affichage règles spécifiques :
       • Un seul participant autorisé (le dirigeant)
       • Le dirigeant doit avoir 100% des parts
       • Documents requis : pièce d'identité, casier judiciaire ou déclaration d'honneur
       • Si marié(e) : acte de mariage obligatoire
   
   └─> Sélection de rôle :
       • DIRIGEANT uniquement ✅
       • GERANT ❌ (masqué)
       • ASSOCIE ❌ (masqué)
   
   └─> Bouton "Ajouter un autre participant" : MASQUÉ ❌

3. Validation
   └─> Frontend vérifie :
       • 1 seul participant
       • Rôle = DIRIGEANT
       • Parts = 100%
       • Documents uploadés
   
   └─> Backend vérifie :
       • 1 seul participant
       • Rôle = DIRIGEANT
       • Parts = 100%
       • Âge >= 18 ans
       • Autorisation valide

4. Création
   └─> Entreprise créée avec succès ✅
```

### Pour SOCIETE (inchangé) :

```
1. Sélection Type d'entreprise
   └─> "Société"
   └─> Choix de la forme juridique

2. Étape Participants
   └─> Affichage règles classiques :
       • Un seul gérant autorisé par entreprise
       • Au moins un Dirigeant requis
       • La somme des parts (Dirigeants + associés) doit égaler 100%
       • Le gérant peut aussi être Dirigeant ou associé
   
   └─> Sélection de rôle :
       • DIRIGEANT ✅
       • GERANT ✅
       • ASSOCIE ✅
   
   └─> Bouton "Ajouter un autre participant" : VISIBLE ✅

3. Validation (logique existante)
4. Création (logique existante)
```

---

## 🛡️ Validations Implémentées

### Frontend (UX - Guide l'utilisateur)
| Règle | Validation | Message d'erreur |
|-------|-----------|------------------|
| Nombre de participants | `participants.length > 1` | "Une entreprise individuelle ne peut avoir qu'un seul participant (le dirigeant)" |
| Rôle autorisé | `role !== 'DIRIGEANT'` | "Pour une entreprise individuelle, le seul rôle autorisé est \"Dirigeant\"" |
| Pourcentage des parts | `parts !== 100` | "Le dirigeant d'une entreprise individuelle doit avoir 100% des parts" |
| Documents | `!typePiece \|\| !numeroPiece \|\| !documentFile` | "type de pièce, numéro et document sont obligatoires" |
| Casier judiciaire | `hasCriminalRecord && !casierJudiciaireFile` | "casier judiciaire requis" |
| Déclaration d'honneur | `!hasCriminalRecord && !declarationHonneurFile` | "déclaration d'honneur requise (sans casier judiciaire)" |
| Acte de mariage | `isMarried && !acteMariageFile` | "acte de mariage requis (si marié)" |

### Backend (Sécurité - Validation stricte)
| Règle | Validation | Exception |
|-------|-----------|-----------|
| Nombre de participants | `participants.size() != 1` | `BadRequestException("Une entreprise individuelle ne peut avoir qu'un seul participant (le dirigeant)")` |
| Rôle autorisé | `role != EntrepriseRole.DIRIGEANT` | `BadRequestException("Pour une entreprise individuelle, le seul rôle autorisé est DIRIGEANT")` |
| Pourcentage des parts | `parts.compareTo(100) != 0` | `BadRequestException("Le dirigeant d'une entreprise individuelle doit avoir 100% des parts")` |
| Âge minimum | `age < 18` | `BadRequestException(Messages.personneMineure(personId))` |
| Autorisation | `estAutoriser == false` | `BadRequestException(Messages.personneNonAutorisee(personId))` |

---

## 🧪 Tests Recommandés

### ✅ Tests Fonctionnels

#### Test 1 : Création nominale
```
Type: ENTREPRISE_INDIVIDUELLE
Participants: 1 (DIRIGEANT, 100%)
Documents: Tous uploadés
Résultat attendu: ✅ Création réussie
```

#### Test 2 : Tentative 2 participants
```
Type: ENTREPRISE_INDIVIDUELLE
Tentative: Ajouter 2ème participant
Résultat attendu: ❌ Bouton masqué, impossible
```

#### Test 3 : Parts incorrectes
```
Type: ENTREPRISE_INDIVIDUELLE
Participants: 1 (DIRIGEANT, 50%)
Résultat attendu: ❌ "Le dirigeant doit avoir 100% des parts"
```

#### Test 4 : Rôle incorrect (API directe)
```json
POST /api/v1/entreprises
{
  "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
  "participants": [{"role": "GERANT", "pourcentageParts": 100}]
}
Résultat attendu: ❌ 400 "seul rôle autorisé est DIRIGEANT"
```

#### Test 5 : Non-régression Société
```
Type: SOCIETE
Participants: Gérant + Dirigeants + Associés
Parts: 100%
Résultat attendu: ✅ Création réussie (comportement inchangé)
```

---

## 📊 Comparaison Avant/Après

### AVANT (Problème)
❌ Entreprise Individuelle pouvait avoir plusieurs participants  
❌ Rôles GERANT et ASSOCIE autorisés  
❌ Parts pouvaient être < 100%  
❌ Pas de validation spécifique  

### APRÈS (Solution)
✅ Un seul participant obligatoire  
✅ Rôle DIRIGEANT uniquement  
✅ 100% des parts obligatoire  
✅ Validation stricte frontend + backend  
✅ Interface adaptée (sélection limitée, bouton masqué)  
✅ Messages d'erreur clairs et contextuels  

---

## 🔍 Points Clés de l'Implémentation

### 1. **Validation Conditionnelle**
```typescript
const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';

if (isEntrepriseIndividuelle) {
  // Règles spécifiques
} else {
  // Règles pour société (inchangées)
}
```

### 2. **Interface Adaptative**
- Sélection de rôle dynamique selon le type
- Bouton "Ajouter" conditionnel
- Règles affichées contextuelles

### 3. **Validation Double**
- **Frontend** : Guide l'utilisateur, évite les erreurs
- **Backend** : Sécurité, validation stricte

### 4. **Refactorisation Backend**
- Méthode `validatePersonEligibility()` réutilisable
- Code plus maintenable
- Séparation des responsabilités

---

## 📝 Documentation Utilisateur

### Message pour l'utilisateur :

> **Entreprise Individuelle**
> 
> Pour créer une entreprise individuelle :
> 1. Sélectionnez "Entreprise Individuelle" comme type
> 2. La forme juridique "E_I" sera automatiquement sélectionnée
> 3. Dans la section Participants :
>    - Vous serez le seul participant avec le rôle "Dirigeant"
>    - Vous devez avoir 100% des parts
>    - Documents requis :
>      - Pièce d'identité (CNI, Passeport, etc.)
>      - Casier judiciaire OU Déclaration sur l'honneur
>      - Acte de mariage (si vous êtes marié(e))
> 4. Vous ne pouvez pas ajouter d'autres participants

---

## 🚀 Déploiement

### Checklist :
- [x] Code frontend modifié
- [x] Code backend modifié
- [x] Documentation créée
- [ ] Tests unitaires (recommandé)
- [ ] Tests d'intégration (recommandé)
- [ ] Déploiement en environnement de test
- [ ] Validation par l'équipe métier
- [ ] Déploiement en production

### Commandes :
```bash
# Frontend
cd frontend/investmali-user/investmali-react-user
npm run build

# Backend
cd backend
mvn clean package
java -jar target/API-Invest.jar
```

---

## 📞 Support

### En cas de problème :

1. **Vérifier les logs frontend** (Console navigateur)
2. **Vérifier les logs backend** (Logs Spring Boot)
3. **Consulter** : `ENTREPRISE_INDIVIDUELLE_IMPLEMENTATION.md`
4. **Tester avec** : Les scénarios de test documentés

---

## ✨ Résultat Final

L'application gère maintenant correctement les **Entreprises Individuelles** avec :
- ✅ Validation métier stricte
- ✅ Interface utilisateur adaptée
- ✅ Messages d'erreur clairs
- ✅ Compatibilité totale avec les sociétés
- ✅ Code maintenable et documenté
