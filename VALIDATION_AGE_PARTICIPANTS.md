# ✅ Validation Âge Minimum : Participants

## 🎯 Objectif

Ajouter une validation pour s'assurer que **tous les participants** (GERANT, DIRIGEANT, ASSOCIE) ont au moins **18 ans**.

---

## ✅ Implémentation

### Fichier Modifié
**`ParticipantsStep.tsx`**

### Modifications

#### 1. Validation dans `handleAddParticipant()` (lignes 270-281)

**Ajout** :
```typescript
// Validation de l'âge minimum (18 ans)
const birthDate = new Date(formData.dateNaissance);
const today = new Date();
const age = today.getFullYear() - birthDate.getFullYear();
const monthDiff = today.getMonth() - birthDate.getMonth();
const dayDiff = today.getDate() - birthDate.getDate();
const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

if (actualAge < 18) {
  setErrors([`Le participant doit avoir au moins 18 ans. Âge actuel: ${actualAge} ans`]);
  return;
}
```

#### 2. Validation dans `handleUpdateParticipant()` (lignes 344-357)

**Ajout** :
```typescript
// Validation de l'âge minimum (18 ans)
if (formData.dateNaissance) {
  const birthDate = new Date(formData.dateNaissance);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  
  if (actualAge < 18) {
    setErrors([`Le participant doit avoir au moins 18 ans. Âge actuel: ${actualAge} ans`]);
    return;
  }
}
```

---

## 🔄 Logique de Calcul de l'Âge

### Calcul Précis
La validation calcule l'âge exact en tenant compte :
1. **Année de naissance**
2. **Mois de naissance** (si le mois n'est pas encore atteint cette année)
3. **Jour de naissance** (si le jour n'est pas encore atteint ce mois)

### Exemple
```
Date de naissance: 2007-10-05
Date actuelle: 2025-10-03

Calcul:
- Année: 2025 - 2007 = 18 ans
- Mois: 10 (octobre) - 10 (octobre) = 0 (même mois)
- Jour: 03 - 05 = -2 (anniversaire pas encore passé)

Résultat: 18 - 1 = 17 ans → ❌ Rejeté
```

```
Date de naissance: 2007-10-01
Date actuelle: 2025-10-03

Calcul:
- Année: 2025 - 2007 = 18 ans
- Mois: 10 - 10 = 0
- Jour: 03 - 01 = 2 (anniversaire déjà passé)

Résultat: 18 ans → ✅ Accepté
```

---

## 📋 Validation Appliquée

### Pour Tous les Rôles
- ✅ **GERANT** : Âge >= 18 ans
- ✅ **DIRIGEANT** : Âge >= 18 ans
- ✅ **ASSOCIE** : Âge >= 18 ans

### Pour Tous les Types d'Entreprise
- ✅ **ENTREPRISE_INDIVIDUELLE** : Dirigeant >= 18 ans
- ✅ **SOCIETE** : Tous les participants >= 18 ans

---

## 🧪 Tests de Validation

### Test 1 : Ajout Participant Mineur
**Scénario** :
1. Ajouter un participant
2. Date de naissance : 2010-01-01 (15 ans)
3. Cliquer sur "Ajouter"

**Résultat attendu** : ❌ Erreur "Le participant doit avoir au moins 18 ans. Âge actuel: 15 ans"

### Test 2 : Ajout Participant Majeur
**Scénario** :
1. Ajouter un participant
2. Date de naissance : 2000-01-01 (25 ans)
3. Cliquer sur "Ajouter"

**Résultat attendu** : ✅ Participant ajouté avec succès

### Test 3 : Participant Exactement 18 Ans (Anniversaire Passé)
**Scénario** :
1. Date actuelle : 2025-10-03
2. Date de naissance : 2007-10-01 (18 ans et 2 jours)
3. Cliquer sur "Ajouter"

**Résultat attendu** : ✅ Participant ajouté avec succès

### Test 4 : Participant Exactement 18 Ans (Anniversaire Non Passé)
**Scénario** :
1. Date actuelle : 2025-10-03
2. Date de naissance : 2007-10-05 (17 ans, 11 mois, 28 jours)
3. Cliquer sur "Ajouter"

**Résultat attendu** : ❌ Erreur "Le participant doit avoir au moins 18 ans. Âge actuel: 17 ans"

### Test 5 : Modification Participant
**Scénario** :
1. Modifier un participant existant
2. Changer la date de naissance pour un âge < 18 ans
3. Cliquer sur "Mettre à jour"

**Résultat attendu** : ❌ Erreur "Le participant doit avoir au moins 18 ans. Âge actuel: X ans"

---

## 📊 Matrice de Validation

| Âge | GERANT | DIRIGEANT | ASSOCIE | Résultat |
|-----|--------|-----------|---------|----------|
| < 18 ans | ❌ | ❌ | ❌ | Rejeté |
| = 18 ans (anniversaire passé) | ✅ | ✅ | ✅ | Accepté |
| = 18 ans (anniversaire non passé) | ❌ | ❌ | ❌ | Rejeté |
| > 18 ans | ✅ | ✅ | ✅ | Accepté |

---

## 🎯 Points Clés

1. **Validation Frontend** : Empêche l'ajout de participants mineurs
2. **Calcul Précis** : Tient compte de l'année, du mois et du jour
3. **Message Clair** : Affiche l'âge actuel du participant
4. **Tous les Rôles** : S'applique à tous les types de participants
5. **Tous les Types** : S'applique à tous les types d'entreprise

---

## 🔗 Validation Backend

### Note
Le backend a déjà une validation d'âge dans `EntrepriseServiceImpl.java` :

```java
private void validatePersonEligibility(ParticipantRequest p) {
    // Vérifier l'âge (>= 18 ans)
    if (p.dateNaissance != null) {
        LocalDate birthDate = p.dateNaissance;
        LocalDate today = LocalDate.now(ZoneId.of("Africa/Bamako"));
        int age = Period.between(birthDate, today).getYears();
        if (age < 18) {
            throw new BadRequestException("Le participant " + p.prenom + " " + p.nom + " doit avoir au moins 18 ans");
        }
    }
}
```

### Double Validation
- ✅ **Frontend** : Validation immédiate, meilleure UX
- ✅ **Backend** : Validation de sécurité, protection API

---

## ✅ Résultat Final

### Avant
- ❌ Aucune validation d'âge dans le frontend
- ⚠️ Participants mineurs pouvaient être ajoutés (rejetés au backend)

### Après
- ✅ Validation d'âge dans le frontend
- ✅ Message d'erreur clair avec l'âge actuel
- ✅ Meilleure expérience utilisateur
- ✅ Cohérence avec la validation backend

---

## 📝 Documentation Mise à Jour

### Fichiers Modifiés
1. **ParticipantsStep.tsx**
   - Lignes 270-281 : Validation âge dans `handleAddParticipant()`
   - Lignes 344-357 : Validation âge dans `handleUpdateParticipant()`

### Règles Métier
- **Âge minimum** : 18 ans
- **Calcul** : Précis (année, mois, jour)
- **Application** : Tous les participants, tous les rôles, tous les types d'entreprise

---

## 🎉 Conclusion

**La validation d'âge minimum est maintenant implémentée pour tous les participants !**

### Bénéfices
- ✅ Meilleure expérience utilisateur (erreur immédiate)
- ✅ Cohérence avec les règles métier
- ✅ Double validation (frontend + backend)
- ✅ Message d'erreur clair et informatif

**Le système est conforme aux exigences légales ! 🚀**
