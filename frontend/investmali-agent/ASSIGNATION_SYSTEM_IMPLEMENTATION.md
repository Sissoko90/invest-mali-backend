# Système d'Assignation des Demandes - Implémentation Complète

## 🎯 **Objectif**
Permettre aux agents d'assigner des demandes d'entreprises à eux-mêmes, les retirer de la liste commune et les traiter en privé jusqu'à validation finale.

## ✅ **Backend - Modifications Implémentées**

### **1. Entité Entreprise**
**Fichier** : `src/main/java/abdaty_technologie/API_Invest/Entity/Entreprise.java`

**Nouveau champ ajouté** :
```java
// Agent assigné pour traiter cette demande
@ManyToOne
@JoinColumn(name = "assigned_to")
private Utilisateurs assignedTo;
```

### **2. Repository EntrepriseRepository**
**Fichier** : `src/main/java/abdaty_technologie/API_Invest/repository/EntrepriseRepository.java`

**Nouvelles méthodes** :
```java
// Entreprises assignées à un agent spécifique
Page<Entreprise> findByAssignedToId(String agentId, Pageable pageable);

// Entreprises non assignées pour une étape donnée
Page<Entreprise> findByEtapeValidationAndAssignedToIsNull(EtapeValidation etape, Pageable pageable);

// Entreprises non assignées avec filtrage par statuts
Page<Entreprise> findByEtapeValidationAndAssignedToIsNullAndStatutCreationIn(
    EtapeValidation etape, List<StatutCreation> statuts, Pageable pageable);
```

### **3. Service EntrepriseService**
**Fichier** : `src/main/java/abdaty_technologie/API_Invest/service/EntrepriseService.java`

**Nouvelles méthodes d'interface** :
```java
// Assignation des demandes aux agents
Entreprise assignToAgent(String entrepriseId, Utilisateurs agent);
Entreprise unassignFromAgent(String entrepriseId);
Page<Entreprise> getAssignedToAgent(String agentId, Pageable pageable);
Page<Entreprise> getUnassignedForStep(EtapeValidation etape, Pageable pageable);
```

### **4. Implémentation EntrepriseServiceImpl**
**Fichier** : `src/main/java/abdaty_technologie/API_Invest/service/impl/EntrepriseServiceImpl.java`

**Fonctionnalités implémentées** :
- **Assignation avec vérification de rôle** : Vérifie que l'agent a le bon rôle pour l'étape
- **Désassignation** : Remet la demande dans la liste commune
- **Récupération des demandes assignées** : Pour l'agent connecté
- **Validation des permissions** : Mapping rôle/étape (AGENT_ACCEUIL → ACCUEIL, etc.)

### **5. Contrôleur EntrepriseController**
**Fichier** : `src/main/java/abdaty_technologie/API_Invest/controller/EntrepriseController.java`

**Nouveaux endpoints** :
```java
// S'assigner une demande (ou assigner à un autre agent)
@PatchMapping("/{id}/assign")
ResponseEntity<EntrepriseResponse> assignToAgent(@PathVariable String id, @RequestBody Map<String, String> request, HttpServletRequest httpRequest)

// Désassigner une demande
@PatchMapping("/{id}/unassign") 
ResponseEntity<EntrepriseResponse> unassignFromAgent(@PathVariable String id)

// Récupérer ses demandes assignées
@GetMapping("/assigned-to-me")
ResponseEntity<Page<EntrepriseResponse>> getAssignedToMe(Pageable pageable, HttpServletRequest httpRequest)
```

## ✅ **Frontend - Modifications Implémentées**

### **1. Service API**
**Fichier** : `src/services/api.ts`

**Nouvelles méthodes** :
```typescript
// Assignation des demandes
assign: (id: string | number, agentId?: string) => api.patch(`/entreprises/${id}/assign`, { agentId }),
unassign: (id: string | number) => api.patch(`/entreprises/${id}/unassign`),
// Mes demandes assignées
assignedToMe: (params: Record<string, any> = {}) => api.get('/entreprises/assigned-to-me', { params }),
```

### **2. Composant AccueilStep**
**Fichier** : `src/components/AccueilStep.tsx`

**Nouveaux états** :
```typescript
const [assignedDemandes, setAssignedDemandes] = useState<DemandeEntreprise[]>([]);
const [assignedLoading, setAssignedLoading] = useState(false);
```

**Nouvelles fonctions** :
- `loadAssignedDemandes()` : Charge les demandes assignées à l'agent
- `handleAssignToMe()` : Assigne une demande à l'agent connecté
- `handleUnassign()` : Désassigne une demande (la remet en commun)

### **3. Interface Utilisateur**

#### **Nouvel Onglet "Mes demandes assignées"**
- **Navigation** : Onglet avec compteur de demandes assignées
- **Badge bleu** : Indique le nombre de demandes assignées
- **Icône horloge** : Représente les demandes en cours de traitement

#### **Bouton "S'assigner" dans la Liste Commune**
- **Couleur verte** (mali-emerald) pour se distinguer
- **Icône horloge** : Cohérent avec le thème d'assignation
- **Action** : Retire la demande de la liste commune et l'ajoute aux demandes assignées

#### **Actions dans les Demandes Assignées**
- **Valider et passer au Régisseur** : Finalise le traitement et passe à l'étape suivante
- **Info requise** : Demande des informations supplémentaires
- **Rejeter** : Refuse la demande
- **Désassigner** : Remet la demande dans la liste commune
- **Détails** : Ouvre la page de détails complète

## 🔄 **Flux de Fonctionnement**

### **Assignation d'une Demande**
1. **Agent consulte** la liste "Demandes à traiter"
2. **Clic sur "S'assigner"** pour une demande spécifique
3. **API Call** : `PATCH /api/v1/entreprises/{id}/assign`
4. **Backend** : Vérifie les permissions et assigne la demande
5. **Frontend** : Recharge les deux listes (commune et assignée)
6. **Résultat** : Demande disparaît de la liste commune, apparaît dans "Mes demandes assignées"

### **Traitement d'une Demande Assignée**
1. **Agent consulte** "Mes demandes assignées"
2. **Actions possibles** :
   - **Valider** → `statutCreation: 'VALIDEE'`, `etapeValidation: 'REGISSEUR'`
   - **Rejeter** → `statutCreation: 'REFUSEE'`
   - **Info requise** → `statutCreation: 'EN_ATTENTE'`
   - **Désassigner** → `assignedTo: null` (retour en liste commune)

### **Passage à l'Étape Suivante**
1. **Validation réussie** → `etapeValidation: 'REGISSEUR'`
2. **Demande disparaît** de l'étape ACCUEIL
3. **Apparaît** dans l'étape REGISSEUR pour les agents registre
4. **Workflow continue** selon le processus métier

## 🔒 **Sécurité et Permissions**

### **Vérification des Rôles**
```java
private boolean canAgentHandleStep(Utilisateurs agent, EtapeValidation etape) {
    switch (etape) {
        case ACCUEIL: return agent.getRole().name().equals("AGENT_ACCEUIL");
        case REGISSEUR: return agent.getRole().name().equals("AGENT_REGISTER");
        case REVISION: return agent.getRole().name().equals("AGENT_REVISION");
        // ... autres étapes
    }
}
```

### **Authentification JWT**
- **Token Bearer** : Extraction automatique de l'agent connecté
- **Assignation personnelle** : Par défaut, s'assigne à soi-même
- **Assignation à autrui** : Possible via paramètre `agentId` (pour superviseurs)

## 📊 **Avantages du Système**

### **Pour les Agents**
✅ **Gestion personnelle** : Chaque agent gère ses propres demandes  
✅ **Pas de conflit** : Évite que plusieurs agents traitent la même demande  
✅ **Suivi clair** : Séparation entre demandes communes et assignées  
✅ **Flexibilité** : Possibilité de désassigner si nécessaire  

### **Pour l'Organisation**
✅ **Traçabilité** : Qui traite quoi et quand  
✅ **Répartition de charge** : Distribution équitable des demandes  
✅ **Responsabilisation** : Chaque agent responsable de ses assignations  
✅ **Workflow fluide** : Passage automatique entre étapes  

## 🎯 **Utilisation Pratique**

### **Scénario Type**
1. **Nouvelle demande** arrive → Visible dans "Demandes à traiter" pour tous les agents ACCUEIL
2. **Agent A** s'assigne la demande → Disparaît de la liste commune
3. **Agent A** traite en privé → Visible uniquement dans "Mes demandes assignées"
4. **Agent A** valide → Demande passe automatiquement à l'étape REGISSEUR
5. **Agents REGISSEUR** voient la demande dans leur liste commune

### **Cas d'Usage Avancés**
- **Réassignation** : Superviseur peut assigner à un agent spécifique
- **Désassignation** : Agent peut remettre en commun si indisponible
- **Suivi global** : Possibilité de voir qui traite quoi (pour superviseurs)

## 🚀 **Résultat Final**

Le système d'assignation est maintenant **complètement opérationnel** ! Les agents peuvent :
- ✅ **S'assigner** des demandes depuis la liste commune
- ✅ **Traiter en privé** leurs demandes assignées
- ✅ **Valider et faire progresser** le workflow
- ✅ **Désassigner** si nécessaire
- ✅ **Suivre clairement** leurs responsabilités

**Le workflow de traitement des demandes d'entreprises est maintenant optimisé pour une gestion efficace et sans conflit !** 🎉

---

**Version** : 1.0  
**Date** : 24 septembre 2024  
**Composants** : Backend (Entité, Service, Contrôleur) + Frontend (API, Interface)  
**Endpoints** : `/assign`, `/unassign`, `/assigned-to-me`
