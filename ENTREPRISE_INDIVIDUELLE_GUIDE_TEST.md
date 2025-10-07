# 🧪 Guide de Test : Entreprise Individuelle

## 📋 Checklist de Test Complète

### ✅ Tests Fonctionnels

#### Test 1 : Création Entreprise Individuelle - Cas Nominal
**Objectif** : Vérifier que la création fonctionne correctement

**Étapes** :
1. ✅ Ouvrir l'application et se connecter
2. ✅ Cliquer sur "Créer une entreprise"
3. ✅ **Étape 1 - Informations Personnelles** :
   - Sélectionner "Oui, c'est pour moi"
   - Vérifier que les informations sont pré-remplies
4. ✅ **Étape 2 - Informations de l'Entreprise** :
   - Remplir le nom de l'entreprise
   - **Sélectionner "Entreprise Individuelle"** dans Type d'entreprise
   - Vérifier que Forme Juridique = "E_I" (auto-sélectionné et grisé)
   - Remplir les autres champs obligatoires
5. ✅ **Étape 3 - Participants** :
   - Vérifier l'affichage des règles spécifiques :
     - "Un seul participant autorisé (le dirigeant)"
     - "Le dirigeant doit avoir 100% des parts"
     - "Documents requis : pièce d'identité, casier judiciaire ou déclaration d'honneur"
   - Vérifier que le rôle par défaut est **"DIRIGEANT"**
   - Vérifier que seul "Dirigeant" est disponible dans le sélecteur
   - Cliquer sur "Confirmer mon rôle"
   - **Vérifier** : Rôle affiché = DIRIGEANT, Parts = 100%
   - Vérifier que le bouton "Ajouter un autre participant" est **masqué**
   - Compléter les documents requis
6. ✅ **Étape 4 - Documents de l'Entreprise** :
   - Uploader les documents requis
7. ✅ **Étape 5 - Récapitulatif** :
   - Vérifier toutes les informations
   - Soumettre la demande

**Résultat Attendu** : ✅ Création réussie avec message de confirmation

---

#### Test 2 : Vérification Rôle par Défaut
**Objectif** : S'assurer que le rôle par défaut est DIRIGEANT

**Étapes** :
1. ✅ Créer une entreprise individuelle
2. ✅ Aller à l'étape Participants
3. ✅ Observer le formulaire de sélection de rôle

**Résultat Attendu** :
- ✅ Rôle pré-sélectionné : **DIRIGEANT**
- ✅ Sélecteur affiche uniquement : "Dirigeant"
- ❌ "Associé" et "Gérant" ne sont PAS visibles

---

#### Test 3 : Blocage Modification du Rôle
**Objectif** : Vérifier que le rôle ne peut pas être modifié

**Étapes** :
1. ✅ Créer une entreprise individuelle
2. ✅ Ajouter le participant (vous-même)
3. ✅ Cliquer sur "Modifier" le participant
4. ✅ Observer le champ "Rôle"

**Résultat Attendu** :
- ✅ Champ "Rôle" est **grisé** (bg-gray-100)
- ✅ Curseur "not-allowed" au survol
- ✅ Valeur fixée à "Dirigeant"
- ✅ Message affiché : "Le rôle est fixé à 'Dirigeant' pour une entreprise individuelle"
- ❌ Impossible de changer le rôle

---

#### Test 4 : Blocage Modification des Parts
**Objectif** : Vérifier que les parts restent à 100%

**Étapes** :
1. ✅ Créer une entreprise individuelle
2. ✅ Ajouter le participant
3. ✅ Cliquer sur "Modifier" le participant
4. ✅ Observer le champ "Pourcentage de parts"

**Résultat Attendu** :
- ✅ Champ "Pourcentage de parts" est **grisé**
- ✅ Curseur "not-allowed" au survol
- ✅ Valeur fixée à "100"
- ✅ Message affiché : "Le dirigeant doit avoir 100% des parts pour une entreprise individuelle"
- ❌ Impossible de modifier les parts

---

#### Test 5 : Tentative d'Ajout de 2ème Participant
**Objectif** : Vérifier qu'on ne peut pas ajouter un 2ème participant

**Étapes** :
1. ✅ Créer une entreprise individuelle
2. ✅ Ajouter le 1er participant (vous-même)
3. ✅ Chercher le bouton "Ajouter un autre participant"

**Résultat Attendu** :
- ❌ Bouton "Ajouter un autre participant" est **masqué/invisible**
- ✅ Impossible d'ajouter un 2ème participant via l'interface

---

#### Test 6 : Validation Frontend - Parts Incorrectes
**Objectif** : Tester la validation si les parts ne sont pas à 100%

**Note** : Ce test nécessite de contourner temporairement le blocage UI

**Étapes** :
1. ✅ Créer une entreprise individuelle
2. ✅ Modifier manuellement les parts via console développeur (si possible)
3. ✅ Tenter de passer à l'étape suivante

**Résultat Attendu** :
- ❌ Erreur affichée : "Le dirigeant d'une entreprise individuelle doit avoir 100% des parts"
- ❌ Impossible de continuer

---

#### Test 7 : Validation Backend - Rôle Incorrect (API)
**Objectif** : Tester la validation backend avec un rôle incorrect

**Étapes** :
1. ✅ Utiliser Postman ou curl
2. ✅ Envoyer une requête POST à `/api/v1/entreprises`
3. ✅ Payload :
```json
{
  "nom": "Test Entreprise",
  "sigle": "TEST",
  "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
  "formeJuridique": "E_I",
  "participants": [
    {
      "personId": "xxx-xxx-xxx",
      "role": "ASSOCIE",
      "pourcentageParts": 100
    }
  ]
}
```

**Résultat Attendu** :
- ❌ HTTP 400 Bad Request
- ❌ Message : "Pour une entreprise individuelle, le seul rôle autorisé est DIRIGEANT"

---

#### Test 8 : Validation Backend - Plusieurs Participants (API)
**Objectif** : Tester la validation backend avec 2 participants

**Étapes** :
1. ✅ Utiliser Postman ou curl
2. ✅ Envoyer une requête POST à `/api/v1/entreprises`
3. ✅ Payload :
```json
{
  "nom": "Test Entreprise",
  "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
  "participants": [
    {
      "personId": "xxx",
      "role": "DIRIGEANT",
      "pourcentageParts": 50
    },
    {
      "personId": "yyy",
      "role": "DIRIGEANT",
      "pourcentageParts": 50
    }
  ]
}
```

**Résultat Attendu** :
- ❌ HTTP 400 Bad Request
- ❌ Message : "Une entreprise individuelle ne peut avoir qu'un seul participant (le dirigeant)"

---

#### Test 9 : Validation Backend - Parts Incorrectes (API)
**Objectif** : Tester la validation backend avec parts < 100%

**Étapes** :
1. ✅ Utiliser Postman ou curl
2. ✅ Envoyer une requête POST à `/api/v1/entreprises`
3. ✅ Payload :
```json
{
  "nom": "Test Entreprise",
  "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
  "participants": [
    {
      "personId": "xxx",
      "role": "DIRIGEANT",
      "pourcentageParts": 75
    }
  ]
}
```

**Résultat Attendu** :
- ❌ HTTP 400 Bad Request
- ❌ Message : "Le dirigeant d'une entreprise individuelle doit avoir 100% des parts"

---

#### Test 10 : Changement de Type d'Entreprise
**Objectif** : Vérifier le comportement lors du changement de type

**Étapes** :
1. ✅ Commencer à créer une **Société**
2. ✅ Aller à l'étape Participants
3. ✅ Observer le rôle par défaut (devrait être ASSOCIE)
4. ✅ Retourner à l'étape Informations de l'Entreprise
5. ✅ Changer pour **Entreprise Individuelle**
6. ✅ Retourner à l'étape Participants

**Résultat Attendu** :
- ✅ Rôle automatiquement changé à **DIRIGEANT**
- ✅ Parts automatiquement mises à **100%**
- ✅ Interface adaptée (règles, sélection limitée)

---

#### Test 11 : Documents Requis
**Objectif** : Vérifier que les documents sont obligatoires

**Étapes** :
1. ✅ Créer une entreprise individuelle
2. ✅ Ajouter le participant
3. ✅ Ne PAS uploader les documents
4. ✅ Tenter de passer à l'étape suivante

**Résultat Attendu** :
- ❌ Erreur : "type de pièce, numéro et document sont obligatoires"
- ❌ Erreur : "casier judiciaire requis" OU "déclaration d'honneur requise"
- ❌ Si marié : "acte de mariage requis"

---

#### Test 12 : Non-Régression Société
**Objectif** : S'assurer que les sociétés fonctionnent toujours

**Étapes** :
1. ✅ Créer une **Société**
2. ✅ Aller à l'étape Participants
3. ✅ Vérifier les règles affichées (gérant, dirigeant, parts = 100%)
4. ✅ Vérifier que tous les rôles sont disponibles (DIRIGEANT, ASSOCIE, GERANT)
5. ✅ Ajouter plusieurs participants
6. ✅ Vérifier que le bouton "Ajouter un autre participant" est **visible**
7. ✅ Vérifier que les champs sont **modifiables**
8. ✅ Soumettre avec gérant + dirigeants + parts = 100%

**Résultat Attendu** :
- ✅ Création réussie
- ✅ Comportement identique à avant les modifications
- ✅ Aucune régression

---

### 📊 Tableau de Suivi des Tests

| # | Test | Statut | Résultat | Notes |
|---|------|--------|----------|-------|
| 1 | Création nominale | ⬜ | | |
| 2 | Rôle par défaut | ⬜ | | |
| 3 | Blocage modification rôle | ⬜ | | |
| 4 | Blocage modification parts | ⬜ | | |
| 5 | Tentative 2ème participant | ⬜ | | |
| 6 | Validation parts incorrectes | ⬜ | | |
| 7 | Backend - Rôle incorrect | ⬜ | | |
| 8 | Backend - Plusieurs participants | ⬜ | | |
| 9 | Backend - Parts incorrectes | ⬜ | | |
| 10 | Changement type entreprise | ⬜ | | |
| 11 | Documents requis | ⬜ | | |
| 12 | Non-régression société | ⬜ | | |

**Légende** : ⬜ À tester | ✅ Réussi | ❌ Échoué | ⚠️ Partiel

---

### 🔍 Points de Vérification Détaillés

#### Interface Utilisateur
- [ ] Règles affichées correctement selon le type d'entreprise
- [ ] Rôle par défaut = DIRIGEANT pour entreprise individuelle
- [ ] Rôle par défaut = ASSOCIE pour société
- [ ] Sélection de rôle limitée à DIRIGEANT pour entreprise individuelle
- [ ] Tous les rôles disponibles pour société
- [ ] Bouton "Ajouter" masqué pour entreprise individuelle
- [ ] Bouton "Ajouter" visible pour société
- [ ] Champ rôle grisé et non modifiable pour entreprise individuelle
- [ ] Champ parts grisé et fixé à 100% pour entreprise individuelle
- [ ] Messages informatifs affichés correctement

#### Validation Frontend
- [ ] Erreur si > 1 participant pour entreprise individuelle
- [ ] Erreur si rôle ≠ DIRIGEANT pour entreprise individuelle
- [ ] Erreur si parts ≠ 100% pour entreprise individuelle
- [ ] Erreur si documents manquants
- [ ] Validation société inchangée

#### Validation Backend
- [ ] Exception si participants.size() ≠ 1 pour entreprise individuelle
- [ ] Exception si role ≠ DIRIGEANT pour entreprise individuelle
- [ ] Exception si parts ≠ 100 pour entreprise individuelle
- [ ] Exception si âge < 18 ans
- [ ] Exception si personne non autorisée
- [ ] Validation société inchangée

#### Base de Données
- [ ] Entreprise créée avec typeEntreprise = ENTREPRISE_INDIVIDUELLE
- [ ] Un seul participant avec role = DIRIGEANT
- [ ] pourcentageParts = 100
- [ ] Documents uploadés et liés correctement
- [ ] Pas de régression pour les sociétés

---

### 🐛 Scénarios de Bug à Tester

#### Scénario 1 : Manipulation Console
**Test** : Essayer de contourner les validations via la console développeur
**Attendu** : Validation backend doit bloquer

#### Scénario 2 : Requête API Directe
**Test** : Envoyer des données invalides via API
**Attendu** : Erreur 400 avec message clair

#### Scénario 3 : Changement Rapide de Type
**Test** : Changer rapidement entre Société et Entreprise Individuelle
**Attendu** : Interface s'adapte correctement à chaque fois

#### Scénario 4 : Édition Après Création
**Test** : Créer puis éditer une entreprise individuelle
**Attendu** : Règles toujours appliquées

---

### 📝 Rapport de Test

**Date** : _______________  
**Testeur** : _______________  
**Version** : _______________

#### Résumé
- Tests réussis : _____ / 12
- Tests échoués : _____ / 12
- Bugs trouvés : _____

#### Bugs Identifiés
| # | Description | Sévérité | Statut |
|---|-------------|----------|--------|
| | | | |

#### Recommandations
1. 
2. 
3. 

#### Conclusion
- [ ] ✅ Prêt pour production
- [ ] ⚠️ Corrections mineures nécessaires
- [ ] ❌ Corrections majeures nécessaires

---

### 🚀 Commandes Utiles

#### Démarrer le Frontend
```bash
cd frontend/investmali-user/investmali-react-user
npm start
```

#### Démarrer le Backend
```bash
cd backend
mvn spring-boot:run
```

#### Test API avec curl
```bash
# Test création entreprise individuelle
curl -X POST http://localhost:8080/api/v1/entreprises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nom": "Test Entreprise",
    "sigle": "TEST",
    "typeEntreprise": "ENTREPRISE_INDIVIDUELLE",
    "formeJuridique": "E_I",
    "participants": [{
      "personId": "xxx",
      "role": "DIRIGEANT",
      "pourcentageParts": 100
    }]
  }'
```

#### Vérifier les logs backend
```bash
tail -f logs/application.log | grep -i "entreprise"
```

---

### ✅ Checklist Finale

Avant de déclarer les tests terminés :

- [ ] Tous les tests fonctionnels passent
- [ ] Tous les tests de validation passent
- [ ] Aucune régression sur les sociétés
- [ ] Interface utilisateur cohérente
- [ ] Messages d'erreur clairs
- [ ] Documentation à jour
- [ ] Code review effectué
- [ ] Performance acceptable
- [ ] Sécurité vérifiée
- [ ] Prêt pour production

---

## 🎉 Conclusion

Une fois tous les tests validés, l'implémentation des règles pour les **Entreprises Individuelles** sera **100% fonctionnelle et prête pour la production** ! 🚀
