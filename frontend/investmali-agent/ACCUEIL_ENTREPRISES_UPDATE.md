# Mise à Jour Étape ACCUEIL - Intégration Table Entreprises

## 🎯 **Objectif**
Modifier l'étape ACCUEIL pour récupérer les vraies données depuis la table `entreprises` au lieu de l'API des applications.

## ✅ **Modifications Apportées**

### **1. Nouvelle API Entreprises**
**Fichier** : `src/services/api.ts`

**API ajoutée** :
```typescript
const entreprisesAPI = {
  // Liste des entreprises avec filtres
  list: (params: Record<string, any> = {}) => api.get('/entreprises', { params }),
  // Détail d'une entreprise
  getById: (id: string | number) => api.get(`/entreprises/${id}`),
  // Mettre à jour le statut d'une entreprise
  updateStatus: (id: string | number, status: string, note?: string) => 
    api.patch(`/entreprises/${id}/status`, { status, note }),
  // Assigner une entreprise à un agent
  assign: (id: string | number, agentId?: string) => 
    api.patch(`/entreprises/${id}/assign`, { agentId }),
  // Mes applications (pour les agents)
  myApplications: () => api.get('/entreprises/my-applications'),
};
```

**Endpoints utilisés** :
- `GET /api/v1/entreprises` - Liste des entreprises
- `PATCH /api/v1/entreprises/{id}/status` - Mise à jour du statut

### **2. Modification AccueilStep.tsx**
**Fichier** : `src/components/AccueilStep.tsx`

#### **Import de la nouvelle API** :
```typescript
import { agentBusinessAPI, entreprisesAPI } from '../services/api';
```

#### **Fonction loadDemandes() mise à jour** :
**Avant** : Utilisait `agentBusinessAPI.listApplications()`
**Après** : Utilise `entreprisesAPI.list()`

**Paramètres de filtrage** :
```typescript
const response = await entreprisesAPI.list({
  limit: 50,
  sort: '-dateCreation',
  etapeActuelle: 'ACCUEIL',
  statut: 'EN_COURS,NOUVEAU,SOUMIS'
});
```

#### **Mapping des données entreprises** :
```typescript
const demandesFormatted: DemandeEntreprise[] = entreprises.map((entreprise: any) => ({
  id: entreprise.id || entreprise._id,
  nom: entreprise.nom || entreprise.businessName || entreprise.companyName || 'Entreprise sans nom',
  sigle: entreprise.sigle || entreprise.acronym || '',
  formeJuridique: entreprise.formeJuridique || entreprise.legalForm || 'Non spécifiée',
  typeEntreprise: entreprise.typeEntreprise || entreprise.businessType || entreprise.domaineActivite || 'Non spécifié',
  statut: entreprise.statut || entreprise.status || 'NOUVEAU',
  dateCreation: entreprise.dateCreation || entreprise.createdAt || entreprise.submitted_at || new Date().toISOString(),
  demandeur: {
    nom: entreprise.gerant?.nom || entreprise.user?.lastName || entreprise.user?.nom || 'Nom inconnu',
    prenom: entreprise.gerant?.prenom || entreprise.user?.firstName || entreprise.user?.prenom || 'Prénom inconnu',
    email: entreprise.gerant?.email || entreprise.user?.email || 'Email inconnu',
    telephone: entreprise.gerant?.telephone1 || entreprise.user?.phone || entreprise.user?.telephone || 'Téléphone inconnu'
  },
  division: entreprise.division?.nom || entreprise.localisation || entreprise.division || '',
  antenne: entreprise.antenne || entreprise.branch || '',
  etapeActuelle: entreprise.etapeActuelle || entreprise.currentStep || 'ACCUEIL'
}));
```

#### **Fonction handleDemandeAction() mise à jour** :
**Avant** : Utilisait `agentBusinessAPI.updateStatus()`
**Après** : Utilise `entreprisesAPI.updateStatus()`

**Statuts mis à jour** :
```typescript
switch (action) {
  case 'accept':
    newStatus = 'VALIDE';
    note = 'Demande acceptée par l\'agent d\'accueil';
    break;
  case 'reject':
    newStatus = 'REJETE';
    note = 'Demande rejetée par l\'agent d\'accueil';
    break;
  case 'request_info':
    newStatus = 'INCOMPLET';
    note = 'Informations complémentaires requises';
    break;
}
```

#### **Badges de statut mis à jour** :
**Nouveaux statuts entreprises** :
- `NOUVEAU` : Bleu - "Nouveau"
- `EN_COURS` : Jaune - "En cours"
- `SOUMIS` : Violet - "Soumis"
- `VALIDE` : Vert - "Validé"
- `REJETE` : Rouge - "Rejeté"
- `INCOMPLET` : Orange - "Incomplet"

**Fallbacks maintenus** pour compatibilité avec anciens statuts.

### **3. Logs de Débogage Ajoutés**
```typescript
console.log('Chargement des entreprises depuis /api/v1/entreprises...');
console.log('Réponse API entreprises:', response.data);
console.log('Entreprises formatées:', demandesFormatted);
console.log(`Mise à jour du statut de l'entreprise ${demandeId} vers ${newStatus}`);
```

## 🔄 **Flux de Données**

### **Chargement des Demandes**
1. **Appel API** : `GET /api/v1/entreprises?etapeActuelle=ACCUEIL&statut=EN_COURS,NOUVEAU,SOUMIS`
2. **Réponse** : Liste des entreprises depuis la table `entreprises`
3. **Mapping** : Transformation vers interface `DemandeEntreprise`
4. **Affichage** : Liste des demandes avec informations complètes

### **Traitement des Actions**
1. **Action utilisateur** : Clic sur Accepter/Rejeter/Info requise
2. **Appel API** : `PATCH /api/v1/entreprises/{id}/status`
3. **Payload** : `{ status: "VALIDE", note: "Demande acceptée..." }`
4. **Rechargement** : Nouvelle requête pour actualiser la liste

## 📊 **Structure des Données**

### **Données Entreprise (Backend)**
```json
{
  "id": "uuid",
  "nom": "Nom de l'entreprise",
  "sigle": "SIGLE",
  "formeJuridique": "SARL",
  "typeEntreprise": "Commerce",
  "domaineActivite": "COMMERCE",
  "statut": "NOUVEAU",
  "dateCreation": "2024-09-24T13:00:00Z",
  "etapeActuelle": "ACCUEIL",
  "gerant": {
    "nom": "Nom du gérant",
    "prenom": "Prénom du gérant",
    "email": "email@example.com",
    "telephone1": "+223 70 00 00 00"
  },
  "division": {
    "nom": "Bamako District"
  },
  "localisation": "Bamako Centre"
}
```

### **Interface DemandeEntreprise (Frontend)**
```typescript
interface DemandeEntreprise {
  id: string;
  nom: string;
  sigle?: string;
  formeJuridique: string;
  typeEntreprise: string;
  statut: string;
  dateCreation: string;
  demandeur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  division?: string;
  antenne?: string;
  etapeActuelle: string;
}
```

## 🎨 **Interface Utilisateur**

### **Affichage des Demandes**
- **Nom de l'entreprise** avec sigle
- **Badge de statut** coloré selon le statut
- **Informations du gérant** (nom, email, téléphone)
- **Localisation** (division/antenne)
- **Date de création** formatée
- **Actions** : Accepter, Rejeter, Info requise, Détails

### **Actions Disponibles**
- **✅ Accepter** → Statut `VALIDE` → Passe à l'étape suivante
- **❌ Rejeter** → Statut `REJETE` → Fin du processus
- **⚠️ Info requise** → Statut `INCOMPLET` → Retour au demandeur
- **👁️ Détails** → Voir les détails complets (à implémenter)

## 🔧 **Configuration Backend Requise**

### **Endpoints à Implémenter**
1. **GET /api/v1/entreprises**
   - Paramètres : `etapeActuelle`, `statut`, `limit`, `sort`
   - Retour : Liste des entreprises avec gérant et division

2. **PATCH /api/v1/entreprises/{id}/status**
   - Payload : `{ status: string, note?: string }`
   - Action : Mise à jour du statut de l'entreprise

### **Filtres Recommandés**
- **etapeActuelle** : `ACCUEIL` (pour l'étape d'accueil)
- **statut** : `EN_COURS,NOUVEAU,SOUMIS` (statuts à traiter)
- **sort** : `-dateCreation` (plus récentes en premier)

## 🚀 **Utilisation**

### **Pour l'Agent ACCUEIL**
1. **Accéder** au workflow RBAC : `/dossier`
2. **Sélectionner** l'étape ACCUEIL
3. **Voir** l'onglet "Demandes à traiter" (par défaut)
4. **Traiter** les entreprises avec les boutons d'action

### **Workflow de Traitement**
1. **Examiner** les informations de l'entreprise
2. **Choisir** une action selon l'évaluation
3. **Confirmation** automatique avec rechargement de la liste

## 📋 **Tests Recommandés**

1. **Vérifier** que l'API `/api/v1/entreprises` retourne des données
2. **Tester** les filtres `etapeActuelle=ACCUEIL`
3. **Valider** la mise à jour de statut avec `/api/v1/entreprises/{id}/status`
4. **Contrôler** l'affichage des informations du gérant
5. **Vérifier** le rechargement automatique après action

## 🎯 **Résultat Final**

L'étape ACCUEIL utilise maintenant les **vraies données de la table entreprises** :
- **Données authentiques** depuis la base de données
- **Informations complètes** du gérant et de l'entreprise
- **Statuts cohérents** avec le workflow métier
- **Actions de traitement** directement sur les entreprises
- **Interface adaptée** aux données réelles

L'agent d'accueil peut maintenant traiter les **vraies demandes d'entreprises** stockées dans la base de données ! 🎉

---

**Version** : 1.0  
**Date** : 24 septembre 2024  
**Endpoints** : `/api/v1/entreprises`  
**Compatibilité** : Table entreprises backend
