# Implémentation des Règles pour Entreprise Individuelle

## 📋 Résumé des Modifications

### Objectif
Implémenter les règles spécifiques pour les **Entreprises Individuelles** lors de la création d'entreprise :
- **Un seul participant** autorisé (le dirigeant)
- **Rôle unique** : DIRIGEANT
- **100% des parts** pour le dirigeant
- **Documents requis** : mêmes que pour un gérant (pièce d'identité, casier judiciaire ou déclaration d'honneur, acte de mariage si marié)

---

## 🎯 Modifications Frontend

### 1. **ParticipantsStep.tsx** - Validation des participants

#### Fonction `validateParticipants()` mise à jour :
```typescript
const validateParticipants = (): string[] => {
  const validationErrors: string[] = [];
  const participants = data.participants || [];
  const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';

  // ========== RÈGLES POUR ENTREPRISE INDIVIDUELLE ==========
  if (isEntrepriseIndividuelle) {
    // 1. Un seul participant autorisé
    if (participants.length > 1) {
      validationErrors.push('Une entreprise individuelle ne peut avoir qu\'un seul participant (le dirigeant)');
    }

    // 2. Le seul rôle autorisé est DIRIGEANT
    const nonDirigeants = participants.filter(p => p.role !== 'DIRIGEANT');
    if (nonDirigeants.length > 0) {
      validationErrors.push('Pour une entreprise individuelle, le seul rôle autorisé est "Dirigeant"');
    }

    // 3. Le dirigeant doit avoir 100% des parts
    const dirigeant = participants.find(p => p.role === 'DIRIGEANT');
    if (dirigeant && Math.abs(dirigeant.pourcentageParts - 100) > 1) {
      validationErrors.push('Le dirigeant d\'une entreprise individuelle doit avoir 100% des parts');
    }

    // 4. Vérifier les documents requis (mêmes que pour un gérant)
    participants.forEach((p, idx) => {
      const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
      if (!p.typePiece || !p.numeroPiece || !p.documentFile) {
        validationErrors.push(`${label}: type de pièce, numéro et document sont obligatoires`);
      }
      if (data.personalInfo?.hasCriminalRecord && !p.casierJudiciaireFile) {
        validationErrors.push(`${label}: casier judiciaire requis`);
      }
      if (!data.personalInfo?.hasCriminalRecord && !p.declarationHonneurFile) {
        validationErrors.push(`${label}: déclaration d'honneur requise (sans casier judiciaire)`);
      }
      if (data.personalInfo?.isMarried && !p.acteMariageFile) {
        validationErrors.push(`${label}: acte de mariage requis (si marié)`);
      }
    });

    return validationErrors;
  }

  // ========== RÈGLES POUR SOCIÉTÉ (logique existante inchangée) ==========
  // ...
};
```

#### Affichage des règles conditionnel :
```typescript
{data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
  <ul className="list-disc list-inside space-y-1">
    <li>Un seul participant autorisé (le dirigeant)</li>
    <li>Le dirigeant doit avoir 100% des parts</li>
    <li>Documents requis : pièce d'identité, casier judiciaire ou déclaration d'honneur</li>
    <li>Si marié(e) : acte de mariage obligatoire</li>
  </ul>
) : (
  <ul className="list-disc list-inside space-y-1">
    <li>Un seul gérant autorisé par entreprise</li>
    <li>Au moins un Dirigeant requis</li>
    <li>La somme des parts (Dirigeants + associés) doit égaler 100%</li>
    <li>Le gérant peut aussi être Dirigeant ou associé</li>
  </ul>
)}
```

#### Sélection de rôle restreinte :
```typescript
<select value={userRole} onChange={(e) => setUserRole(e.target.value as EntrepriseRole)}>
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
```

#### Bouton "Ajouter un autre participant" masqué :
```typescript
{!showUserRoleForm && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
  <button onClick={() => setShowAddForm(true)}>
    Ajouter un autre participant
  </button>
)}
```

---

## 🔧 Modifications Backend

### 2. **EntrepriseServiceImpl.java** - Validation côté serveur

#### Méthode `validateParticipants()` refactorisée :
```java
private void validateParticipants(EntrepriseRequest req) {
    boolean isEntrepriseIndividuelle = req.typeEntreprise == TypeEntreprise.ENTREPRISE_INDIVIDUELLE;
    
    // ========== RÈGLES POUR ENTREPRISE INDIVIDUELLE ==========
    if (isEntrepriseIndividuelle) {
        // 1. Un seul participant autorisé
        if (req.participants.size() != 1) {
            throw new BadRequestException("Une entreprise individuelle ne peut avoir qu'un seul participant (le dirigeant)");
        }
        
        // 2. Le seul rôle autorisé est DIRIGEANT
        ParticipantRequest participant = req.participants.get(0);
        if (participant.role != EntrepriseRole.DIRIGEANT) {
            throw new BadRequestException("Pour une entreprise individuelle, le seul rôle autorisé est DIRIGEANT");
        }
        
        // 3. Le dirigeant doit avoir 100% des parts
        if (participant.pourcentageParts.compareTo(new BigDecimal("100")) != 0) {
            throw new BadRequestException("Le dirigeant d'une entreprise individuelle doit avoir 100% des parts");
        }
        
        // 4. Validation de la personne (âge, autorisation)
        validatePersonEligibility(participant);
        
        return; // Sortir après validation pour entreprise individuelle
    }
    
    // ========== RÈGLES POUR SOCIÉTÉ (logique existante) ==========
    // Un seul gérant, au moins un fondateur, parts = 100 (fondateurs + associés)
    long gerants = req.participants.stream().filter(p -> p.role == EntrepriseRole.GERANT).count();
    if (gerants != 1) throw new BadRequestException(Messages.UN_SEUL_GERANT_AUTORISE);

    boolean hasDirigeant = req.participants.stream().anyMatch(p -> p.role == EntrepriseRole.DIRIGEANT);
    if (!hasDirigeant) throw new BadRequestException(Messages.AU_MOINS_UN_FONDATEUR);

    // dates valides et personnes éligibles
    for (ParticipantRequest p : req.participants) {
        if (p.dateDebut.isAfter(p.dateFin)) {
            throw new BadRequestException(Messages.datesInvalides(p.personId));
        }
        validatePersonEligibility(p);
    }

    // Somme des parts (fondateurs + associés) == 100
    BigDecimal total = req.participants.stream()
        .filter(p -> p.role == EntrepriseRole.DIRIGEANT || p.role == EntrepriseRole.ASSOCIE || p.role == EntrepriseRole.GERANT)
        .map(p -> p.pourcentageParts)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    if (total == null) total = BigDecimal.ZERO;
    if (total.compareTo(new BigDecimal("100")) != 0) {
        throw new BadRequestException(Messages.sommePartsInvalide(total.toPlainString()));
    }
}
```

#### Nouvelle méthode `validatePersonEligibility()` :
```java
/**
 * Valide l'éligibilité d'une personne (âge >= 18 ans, autorisation)
 */
private void validatePersonEligibility(ParticipantRequest p) {
    Persons person = personsRepository.findById(p.personId)
        .orElseThrow(() -> new NotFoundException(Messages.personneIntrouvable(p.personId)));
    
    // Autorisation explicite
    if (Boolean.FALSE.equals(person.getEstAutoriser())) {
        throw new BadRequestException(Messages.personneNonAutorisee(p.personId));
    }
    
    // Age >= 18
    if (person.getDateNaissance() == null) {
        throw new BadRequestException(Messages.personneMineure(p.personId));
    }
    
    // Utiliser la même timezone pour les deux dates pour éviter les décalages
    ZoneId bamakoZone = ZoneId.of("Africa/Bamako");
    LocalDate birth = person.getDateNaissance().toInstant().atZone(bamakoZone).toLocalDate();
    LocalDate today = LocalDate.now(bamakoZone);
    
    if (birth.isAfter(today)) {
        throw new BadRequestException(Messages.personneMineure(p.personId));
    }
    
    int years = Period.between(birth, today).getYears();
    
    if (years < 18) {
        throw new BadRequestException(Messages.personneMineure(p.personId));
    }
}
```

---

## ✅ Règles Implémentées

### Pour Entreprise Individuelle (ENTREPRISE_INDIVIDUELLE) :
1. ✅ **Un seul participant** autorisé
2. ✅ **Rôle unique** : DIRIGEANT (pas de GERANT, pas d'ASSOCIE)
3. ✅ **100% des parts** obligatoire pour le dirigeant
4. ✅ **Documents requis** :
   - Pièce d'identité (type + numéro + fichier)
   - Casier judiciaire OU déclaration d'honneur
   - Acte de mariage (si marié)
   - Extrait de naissance (optionnel)
5. ✅ **Validation âge** : >= 18 ans
6. ✅ **Interface adaptée** :
   - Sélection de rôle limitée à "Dirigeant"
   - Bouton "Ajouter un autre participant" masqué
   - Règles affichées spécifiques

### Pour Société (SOCIETE) - Inchangé :
1. ✅ Un seul gérant obligatoire
2. ✅ Au moins un dirigeant requis
3. ✅ Somme des parts = 100%
4. ✅ Documents requis pour le gérant
5. ✅ Validation âge >= 18 ans

---

## 🧪 Tests à Effectuer

### Test 1 : Création Entreprise Individuelle - Cas Nominal
**Étapes** :
1. Sélectionner "Entreprise Individuelle" dans Type d'entreprise
2. Vérifier que Forme Juridique = "E_I" (auto-sélectionné)
3. Aller à l'étape Participants
4. Vérifier que seul "Dirigeant" est disponible dans le sélecteur de rôle
5. Ajouter un participant avec rôle DIRIGEANT et 100% des parts
6. Uploader les documents requis
7. Vérifier que le bouton "Ajouter un autre participant" n'apparaît pas
8. Soumettre la demande

**Résultat attendu** : ✅ Création réussie

### Test 2 : Entreprise Individuelle - Tentative d'ajout de 2 participants
**Étapes** :
1. Créer une entreprise individuelle
2. Essayer d'ajouter un 2ème participant (impossible via UI)

**Résultat attendu** : ✅ Bouton "Ajouter" masqué, impossible d'ajouter

### Test 3 : Entreprise Individuelle - Parts < 100%
**Étapes** :
1. Créer une entreprise individuelle
2. Ajouter un dirigeant avec 50% des parts
3. Tenter de valider

**Résultat attendu** : ❌ Erreur "Le dirigeant d'une entreprise individuelle doit avoir 100% des parts"

### Test 4 : Entreprise Individuelle - Documents manquants
**Étapes** :
1. Créer une entreprise individuelle
2. Ajouter un dirigeant sans uploader les documents
3. Tenter de valider

**Résultat attendu** : ❌ Erreur "type de pièce, numéro et document sont obligatoires"

### Test 5 : Société - Fonctionnement normal (non-régression)
**Étapes** :
1. Sélectionner "Société" dans Type d'entreprise
2. Aller à l'étape Participants
3. Vérifier que tous les rôles sont disponibles (DIRIGEANT, ASSOCIE, GERANT)
4. Ajouter plusieurs participants
5. Vérifier que le bouton "Ajouter un autre participant" est visible
6. Soumettre avec gérant + dirigeants + parts = 100%

**Résultat attendu** : ✅ Création réussie (comportement inchangé)

### Test 6 : Backend - Validation stricte
**Test API direct** :
```json
POST /api/v1/entreprises
{
  "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
  "participants": [
    {
      "personId": "xxx",
      "role": "ASSOCIE",  // ❌ Devrait échouer
      "pourcentageParts": 100
    }
  ]
}
```

**Résultat attendu** : ❌ 400 Bad Request "Pour une entreprise individuelle, le seul rôle autorisé est DIRIGEANT"

### Test 7 : Backend - Validation nombre de participants
**Test API direct** :
```json
POST /api/v1/entreprises
{
  "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
  "participants": [
    {"personId": "xxx", "role": "DIRIGEANT", "pourcentageParts": 50},
    {"personId": "yyy", "role": "DIRIGEANT", "pourcentageParts": 50}  // ❌ 2 participants
  ]
}
```

**Résultat attendu** : ❌ 400 Bad Request "Une entreprise individuelle ne peut avoir qu'un seul participant (le dirigeant)"

---

## 📊 Matrice de Validation

| Type Entreprise | Nb Participants | Rôles Autorisés | Parts | Documents | Validation |
|-----------------|-----------------|-----------------|-------|-----------|------------|
| ENTREPRISE_INDIVIDUELLE | 1 | DIRIGEANT | 100% | Pièce + Casier/Déclaration + Mariage | ✅ |
| ENTREPRISE_INDIVIDUELLE | 2+ | - | - | - | ❌ |
| ENTREPRISE_INDIVIDUELLE | 1 | GERANT/ASSOCIE | - | - | ❌ |
| ENTREPRISE_INDIVIDUELLE | 1 | DIRIGEANT | <100% | - | ❌ |
| SOCIETE | 1+ | GERANT+DIRIGEANT+ASSOCIE | 100% | Selon rôle | ✅ |

---

## 🔍 Points de Vérification

### Frontend :
- [ ] Sélection de rôle limitée à DIRIGEANT pour entreprise individuelle
- [ ] Bouton "Ajouter un autre participant" masqué
- [ ] Règles affichées adaptées au type d'entreprise
- [ ] Validation des parts = 100% pour le dirigeant
- [ ] Messages d'erreur clairs et spécifiques

### Backend :
- [ ] Validation du nombre de participants (1 seul)
- [ ] Validation du rôle (DIRIGEANT uniquement)
- [ ] Validation des parts (100%)
- [ ] Validation de l'âge (>= 18 ans)
- [ ] Messages d'erreur explicites

### Base de données :
- [ ] Entreprise créée avec typeEntreprise = ENTREPRISE_INDIVIDUELLE
- [ ] Un seul participant avec role = DIRIGEANT
- [ ] pourcentageParts = 100
- [ ] Documents uploadés et liés correctement

---

## 📝 Notes Importantes

1. **Compatibilité** : Les modifications n'affectent pas le flux existant pour les sociétés
2. **Validation double** : Frontend (UX) + Backend (sécurité)
3. **Messages d'erreur** : Explicites pour guider l'utilisateur
4. **Documents** : Mêmes exigences que pour un gérant de société
5. **Refactorisation** : Méthode `validatePersonEligibility()` réutilisable

---

## 🚀 Déploiement

### Ordre de déploiement :
1. ✅ Backend (EntrepriseServiceImpl.java)
2. ✅ Frontend (ParticipantsStep.tsx)
3. 🧪 Tests de validation
4. 📋 Documentation utilisateur

### Rollback :
- Les modifications sont isolées dans des blocs conditionnels
- Facile de revenir en arrière si nécessaire
- Pas d'impact sur les données existantes

---

## ✨ Résultat Final

L'implémentation permet maintenant de créer des **Entreprises Individuelles** avec les règles métier appropriées :
- Interface utilisateur adaptée et intuitive
- Validation stricte côté frontend et backend
- Messages d'erreur clairs et contextuels
- Compatibilité totale avec le flux existant pour les sociétés
