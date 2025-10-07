# Système RBAC et Workflow Agent - API-Invest

## Vue d'ensemble

Ce document décrit l'implémentation du système RBAC (Role-Based Access Control) et du workflow par étapes pour l'interface Agent de l'application API-Invest.

## Architecture RBAC

### Rôles Agents

Le système définit 9 rôles agents alignés sur les étapes du processus de création d'entreprise :

1. **AGENT_ACCEUIL** - Étape d'accueil/intake
2. **REGISSEUR** - Étape de régie
3. **AGENT_REVISION** - Étape de révision
4. **AGENT_IMPOT** - Étape impôts
5. **AGENT_RCCM1** - Étape RCCM phase 1
6. **AGENT_RCCM2** - Étape RCCM phase 2
7. **AGENT_NINA** - Étape NINA
8. **AGENT_RETRAIT** - Étape de retrait
9. **SUPER_ADMIN** - Accès complet + transition forçable

### Permissions

- **Édition** : Chaque rôle peut éditer uniquement sur son étape assignée
- **Lecture** : Tous les agents peuvent voir toutes les étapes (lecture seule)
- **SUPER_ADMIN** : Accès complet en édition sur toutes les étapes + possibilité de forcer les transitions

## Composants Implémentés

### 1. Contexte d'Authentification (`AgentAuthContext.tsx`)

**Fonctionnalités** :
- Gestion des rôles agents
- Fonctions RBAC : `canEditStep()`, `canViewStep()`, `canForceTransition()`, `hasRole()`
- Persistance des informations agent dans localStorage

**Interface Agent** :
```typescript
interface Agent {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  role: AgentRole;
  department: string;
  permissions: string[];
  assignedStep?: string;
  canForceTransition?: boolean;
  division?: string;
  antenne?: string;
}
```

### 2. Protection des Routes (`RoleProtectedRoute.tsx`)

**Fonctionnalités** :
- Contrôle d'accès basé sur les rôles
- Vérification des permissions par étape
- Messages d'erreur contextuels

**Utilisation** :
```tsx
<RoleProtectedRoute 
  allowedRoles={['AGENT_ACCEUIL', 'SUPER_ADMIN']}
  requiredStep="ACCUEIL"
>
  <AccueilStep />
</RoleProtectedRoute>
```

### 3. Navigation par Étapes (`StepNavigation.tsx`)

**Fonctionnalités** :
- Affichage visuel des étapes du processus
- Indicateurs de permissions (édition/lecture/restreint)
- Navigation conditionnelle selon les droits

**Légende** :
- 🖊️ Édition autorisée
- 👁️ Lecture seule
- ✅ Étape terminée
- 🔒 Accès restreint

### 4. Workflow Principal (`DossierWorkflow.tsx`)

**Fonctionnalités** :
- Intégration de toutes les étapes
- Gestion des transitions entre étapes
- Affichage conditionnel selon les permissions

## Étape ACCUEIL - Fonctionnalités Détaillées

### Composant Principal (`AccueilStep.tsx`)

**Onglets disponibles** :
1. **Rechercher un dossier** - Déduplication et recherche
2. **Créer un dossier** - Nouveau dossier entreprise
3. **Documents & Validation** - Gestion des documents obligatoires

### Recherche de Dossiers (`DossierSearch.tsx`)

**Fonctionnalités** :
- Recherche par nom, sigle ou référence
- Filtrage par statut
- Détection automatique de doublons
- Alerte de déduplication basique

**Critères de recherche** :
- Nom d'entreprise
- Sigle
- Référence du dossier
- Statut (NOUVEAU, EN_COURS, INCOMPLET, VALIDE, REJETE)

### Création de Dossier (`DossierCreationForm.tsx`)

**Sections du formulaire** :
1. **Informations du représentant**
   - Prénom, Nom (obligatoires)
   - Téléphone, Email (obligatoires)

2. **Informations de l'entreprise**
   - Nom de l'entreprise (obligatoire)
   - Sigle (optionnel)
   - Forme juridique (SARL, SA, E_I, SNC, SCS)
   - Domaine d'activité (Commerce, Services, Industrie, etc.)

3. **Localisation**
   - Division (assignée automatiquement selon l'agent)
   - Antenne (assignée automatiquement selon l'agent)

**Génération automatique** :
- Référence unique : `CE-YYYY-MM-DD-#####`
- Statut initial : NOUVEAU
- Documents manquants initialisés

### Gestion des Documents (`DocumentsChecklist.tsx`)

**Documents obligatoires** :
1. Pièce d'identité du représentant
2. Statuts de l'entreprise
3. Certificat de résidence

**Documents optionnels** :
1. Registre de commerce (si existant)
2. Déclaration fiscale

**Workflow des documents** :
1. **Upload** - Téléchargement du fichier
2. **Validation** - Approbation par l'agent
3. **Rejet** - Avec motif obligatoire
4. **Statuts** : MANQUANT → UPLOADE → VALIDE/REJETE

**Actions sur le dossier** :
- ✅ **Valider vers REGISSEUR** - Transition vers l'étape suivante
- ❌ **Rejeter** - Rejet définitif du dossier
- ⏸️ **Mettre en attente** - Dossier incomplet

## Routes Disponibles

### Routes Publiques
- `/agent-login` - Connexion agent
- `/test-connection` - Test de connectivité
- `/simple-list` - Liste simple des applications

### Routes Protégées
- `/dashboard` - Dashboard principal
- `/dossier` - Nouveau workflow RBAC
- `/dossier/:dossierId` - Workflow pour un dossier spécifique

## Configuration et Déploiement

### Variables d'Environnement
```env
REACT_APP_AGENT_API_URL=http://localhost:8080/api/v1
```

### Dépendances Requises
- React Router DOM
- Heroicons React
- Tailwind CSS avec thème Mali (mali-emerald, mali-gold)

### Structure des Fichiers
```
src/
├── components/
│   ├── AccueilStep.tsx
│   ├── DossierSearch.tsx
│   ├── DossierCreationForm.tsx
│   ├── DocumentsChecklist.tsx
│   ├── RoleProtectedRoute.tsx
│   ├── StepNavigation.tsx
│   └── DossierWorkflow.tsx
├── contexts/
│   └── AgentAuthContext.tsx
├── pages/
│   └── DossierWorkflowPage.tsx
└── services/
    └── api.ts
```

## Utilisation

### 1. Connexion Agent
1. Accéder à `/agent-login`
2. Saisir les identifiants (email/mot de passe)
3. Le rôle détermine les permissions automatiquement

### 2. Accès au Workflow RBAC
1. Depuis le dashboard, cliquer sur "Workflow RBAC"
2. Ou naviguer directement vers `/dossier`
3. L'étape initiale dépend du rôle de l'agent

### 3. Gestion des Dossiers (AGENT_ACCEUIL)
1. **Rechercher** un dossier existant pour éviter les doublons
2. **Créer** un nouveau dossier si nécessaire
3. **Gérer les documents** obligatoires
4. **Valider** vers l'étape suivante (REGISSEUR)

### 4. Navigation entre Étapes
- Utiliser la navigation latérale
- Les permissions sont appliquées automatiquement
- Les étapes non autorisées sont verrouillées

## Sécurité

### Contrôles d'Accès
- Vérification des rôles côté frontend
- Protection des routes sensibles
- Validation des permissions avant chaque action

### Gestion des Erreurs
- Messages d'erreur contextuels
- Fallbacks gracieux pour les permissions insuffisantes
- Logs détaillés pour le debugging

## Extensibilité

### Ajout de Nouveaux Rôles
1. Mettre à jour le type `AgentRole` dans `AgentAuthContext.tsx`
2. Ajouter le mapping dans `roleStepMapping`
3. Créer le composant d'étape correspondant
4. Intégrer dans `DossierWorkflow.tsx`

### Ajout de Nouvelles Étapes
1. Créer le composant d'étape
2. Ajouter dans `allSteps` de `StepNavigation.tsx`
3. Intégrer dans `renderStepContent()` de `DossierWorkflow.tsx`
4. Mettre à jour les permissions RBAC

## Support et Maintenance

### Logs et Debugging
- Console logs détaillés dans les composants
- Gestion d'erreurs avec try-catch
- Messages d'état pour les opérations asynchrones

### Tests Recommandés
1. Test des permissions par rôle
2. Test des transitions entre étapes
3. Test de l'upload de documents
4. Test de la déduplication

---

**Version** : 1.0  
**Date** : Septembre 2024  
**Auteur** : Équipe API-Invest  
**Contact** : support@api-invest.ml
