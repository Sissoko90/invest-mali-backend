## Sécurité et CORS

- CORS est lu depuis `application.yml` via `app.cors.allowed-origins`.
  - Exemple (profil dev): `http://localhost:3000,http://localhost:4200,http://localhost:5173`
  - Les méthodes autorisées: GET, POST, PUT, DELETE, PATCH, OPTIONS.
  - Les en-têtes sont `*` et `allowCredentials=true`.
- `RateLimitingFilter`: limite simple par IP (token-bucket en mémoire). Paramétrable via `app.rate-limit.*` dans `application.yml`.
  - `capacity`, `refill-tokens`, `refill-period-seconds`.
- `SecurityMetricFilter`: log la durée des requêtes (niveau DEBUG). Peut être remplacé par Micrometer/Actuator si nécessaire.
- La configuration actuelle (`SecurityConfig`) autorise tout par défaut (`permitAll`) sur `/api/v1/**`, swagger et H2 console. À restreindre ultérieurement (JWT, rôles, etc.).

## Données initiales (Seeder)

- `PersonSeeder` s’assure qu’un utilisateur avec le rôle `SUPER_ADMIN` existe en environnement `default`/`dev`.
  - Email: `admin@example.com`
  - Téléphone: format E.164 `+22370000000`
  - Rôle: `SUPER_ADMIN`

## Notes de développement

- Les validations critiques côté service (dans `PersonServiceImpl`) sont commentées pour guider les contributions: rôle/email/téléphone, majorité, cohérence `sexe`/`civilité`.
- Les DTO utilisent `LocalDate` pour `dateNaissance` (format `YYYY-MM-DD`). Conversion vers `java.util.Date` au moment de persister l’entité.
- Évitez les FQN pour les enums: utilisez les imports (`Sexes`, `Civilites`, `Roles`).
# API InvestMali

Backend Spring Boot pour la gestion des entreprises, documents et personnes.

## Démarrer le projet

- Java 17+
- Maven Wrapper inclus

Commande de démarrage:

```
./mvnw spring-boot:run
```

Le contexte d’application est préfixé par `/api/v1`.

## Fonctionnalités

- Entreprises: création, mise à jour, statut, participants, etc.
- Documents: upload et téléchargement, validation par type.
- Personnes: CRUD complet avec validations metier.

## Endpoints (principaux)

- Personnes (`PersonController`)
  - POST `/api/v1/persons`
  - GET `/api/v1/persons/{id}`
  - GET `/api/v1/persons`
  - PUT `/api/v1/persons/{id}`
  - DELETE `/api/v1/persons/{id}`

- Documents (`DocumentsController`)
  - POST `/api/v1/documents/piece` (upload pièce d’identité)
  - POST `/api/v1/documents/document` (upload document d’entreprise)
  - GET `/api/v1/documents/{id}/file` (téléchargement)

- Divisions, Entreprise, etc.: voir les contrôleurs correspondants (déjà présents).

## Documents – Règles métier et validations

Types pris en charge (`TypePieces`, `TypeDocuments`).

- Upload (pièces et documents): nécessite `file` + métadonnées.
- Détection du type MIME au téléchargement par “magic number”: PNG, JPEG, GIF, BMP, WEBP, TIFF, PDF, DOC (OLE), DOCX/XLSX/PPTX, RTF, SVG/XML, TXT, ZIP. Le `Content-Type` et l’extension proposés dans le `filename` sont adaptés.

Contraintes supplémentaires:
- `CASIER_JUDICIAIRE`:
  - Requiert `entreprise.extraitJudiciaire = true`.
  - Doit appartenir au gérant.
- `CERTIFICAT_RESIDENCE`, `EXTRAIT_NAISSANCE`:
  - Doivent appartenir au gérant.
- `ACTE_MARIAGE`:
  - Autorisé uniquement si la personne est `MARIE`.
  - Doit appartenir au gérant.
- `STATUS_SOCIETE`:
  - Requiert `entreprise.statutSociete = true`.
  - Réservé aux DIRIGEANTS.
- `REGISTRE_COMMERCE`:
  - Réservé aux DIRIGEANTS.
- `DECLARATION_HONNEUR`:
  - Réservé aux DIRIGEANTS (selon dernière règle appliquée).

Autres validations:
- `dateExpiration` (pour pièces) doit être au format ISO (yyyy-MM-dd) et >= aujourd’hui.
- Unicité: numéro de pièce (`numero`) unique.
- Un seul document de même `typePiece` par personne (contrôle dans service).

## Personnes – Règles métier et validations

DTOs:
- `PersonCreateRequest` (dateNaissance: LocalDate format `YYYY-MM-DD`).
- `PersonUpdateRequest` (tous champs optionnels; dateNaissance aussi en LocalDate).

Règles à la création:
- Rôle par défaut: `USER` si `role` omis.
- `email`:
  - Optionnel si `role == USER`.
  - Obligatoire si `role != USER`.
  - Unicité si fourni.
- `entrepriseRole`:
  - Obligatoire uniquement si `role == USER`.
- `antenneAgent`:
  - Obligatoire si `role != USER`.
  - Optionnel si `role == USER`.
- `estAutoriser`:
  - Calculé automatiquement: `true` si âge >= 18; sinon la création est refusée.
- Téléphones:
  - `telephone1` obligatoire, unique.
  - Format international E.164 exigé: `+` suivi de 8 à 15 chiffres (ex: `+22377000001`).
  - `telephone2` optionnel mais s’il est fourni, doit respecter le même format.
- Sexe/Civilité:
  - `MASCULIN` => civilité `MONSIEUR` obligatoire.
  - `FEMININ` => civilité `MADAME` ou `MADEMOISELLE`.
- Division (`divisionCode`) optionnelle: si fournie, doit exister (via `DivisionsRepository.findByCode`).

Règles à la mise à jour:
- Même logique que création pour cohérence téléphone/email/role/antenneAgent/entrepriseRole.
- Si `role` final != USER, email requis (si l’email n’existait pas déjà).
- Recalcul automatique de `estAutoriser` en fonction de `dateNaissance` effective.
- Cohérence `sexe`/`civilite` vérifiée sur les valeurs effectives (requêtes ou existantes).

Schéma `persons` (adaptations nécessaires côté DB):
- Les colonnes suivantes doivent être NULLABLE pour refléter les règles:
  - `email` (optionnel pour USER)
  - `entreprise_role` (optionnel si role != USER)
  - `antenne_agent` (optionnel si role == USER)

SQL d’ajustement (adapter types/tailles si besoin):
```
ALTER TABLE persons MODIFY email varchar(255) NULL;
ALTER TABLE persons MODIFY entreprise_role varchar(255) NULL;
ALTER TABLE persons MODIFY antenne_agent varchar(255) NULL;
```

## Entreprises – Points clés

- Création, mise à jour, bannissement, progression de workflow (`EtapeValidation`, `StatutCreation`, etc.).
- Participants (`EntrepriseMembre`): rôles `DIRIGEANT`, `ASSOCIE`, `GERANT` avec dates d’effet.
- Contrôles typiques:
  - Règles de rôle pour certains documents.
  - `statutSociete` => nécessite dépôt `STATUS_SOCIETE`.

## Messages d’erreurs (extraits)

Voir `src/main/java/abdaty_technologie/API_Invest/constants/Messages.java`. Exemples:
- Documents: `EXTRAIT_JUDICIAIRE_REQUIS`, `DOCUMENT_POUR_GERANT_SEULEMENT`, `DOCUMENT_RESERVE_FONDATEURS`, etc.
- Personnes: `PERSON_EMAIL_OBLIGATOIRE_SI_NON_USER`, `PERSON_MINEUR_NON_AUTORISE`, `PERSON_TELEPHONE_INVALIDE`, `PERSON_CIVILITE_INVALIDE_POUR_SEXE`, etc.

## Exemples de requêtes

Créer une personne (USER):
```
curl -X POST "http://localhost:8080/api/v1/persons" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Diallo",
    "prenom": "Aminata",
    "email": "aminata@example.com",
    "telephone1": "+22377000001",
    "dateNaissance": "1990-05-10",
    "lieuNaissance": "Bamako",
    "nationnalite": "MALIENNE",
    "entrepriseRole": "DIRIGEANT",
    "sexe": "FEMININ",
    "situationMatrimoniale": "CELIBATAIRE",
    "civilite": "MADAME",
    "divisionCode": "BKO"
  }'
```

Créer une personne (non-USER):
```
curl -X POST "http://localhost:8080/api/v1/persons" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Keita",
    "prenom": "Moussa",
    "email": "moussa@example.com",
    "telephone1": "+22377000002",
    "dateNaissance": "1988-02-01",
    "lieuNaissance": "Kati",
    "nationnalite": "MALIENNE",
    "antenneAgent": "BAMAKO",
    "sexe": "MASCULIN",
    "situationMatrimoniale": "MARIE",
    "civilite": "MONSIEUR",
    "role": "AGENT_ACCEUIL"
  }'
```

Téléchargement document:
```
/usr/bin/curl -v "http://localhost:8080/api/v1/documents/{id}/file" -o /tmp/document.bin
```

## Notes

- Le type MIME renvoyé à `/documents/{id}/file` est détecté automatiquement par signature binaire; si non reconnu, `application/octet-stream` est utilisé.
- Les validateurs côté service complètent/renforcent les annotations de validation des DTOs.
- Adapter les colonnes SQL pour aligner la base sur les règles de nullabilité définies dans l’entité `Persons`.
