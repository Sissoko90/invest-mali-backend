package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import abdaty_technologie.API_Invest.service.EntrepriseService;
import abdaty_technologie.API_Invest.service.PersonsService;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.dto.request.EntrepriseRequest;
import abdaty_technologie.API_Invest.dto.response.EntrepriseResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.validation.Valid;
import java.util.*;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/agent")
public class AgentController {

    @Autowired
    private EntrepriseService entrepriseService;
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private PersonsRepository personsRepository;
    
    @Autowired
    private PersonsService personsService;
    
    /**
     * Obtenir l'agent connecté depuis le contexte de sécurité
     */
    private Persons getCurrentAgent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || 
            "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Agent non authentifié - Token manquant ou invalide");
        }
        
        String email = authentication.getName(); // Le token contient l'email
        System.out.println(" [AgentController] Email agent: " + email);
        System.out.println(" [AgentController] Principal: " + authentication.getPrincipal());
        System.out.println(" [AgentController] Authorities: " + authentication.getAuthorities());
        
        // Chercher l'agent par email dans la table Persons
        Optional<Persons> agentOpt = personsRepository.findByEmail(email);
        if (!agentOpt.isPresent()) {
            throw new RuntimeException("Agent non trouvé avec l'email: " + email);
        }
        
        Persons agent = agentOpt.get();
        
        // Vérifier que c'est bien un agent (pas un utilisateur normal)
        if (agent.getRole() == null || 
            (!agent.getRole().name().startsWith("AGENT_") && agent.getRole() != Roles.SUPER_ADMIN)) {
            throw new RuntimeException("Accès refusé - Seuls les agents peuvent accéder à cette ressource");
        }
        
        return agent;
    }
    
    /**
     * Vérifier si l'agent peut voir toutes les entreprises (Super Admin)
     */
    private boolean canViewAllEntreprises(Persons agent) {
        return agent.getRole() == Roles.SUPER_ADMIN;
    }
    
    /**
     * Mapper une antenne vers les codes de division correspondants
     * Retourne le code de division ou une partie du nom pour filtrer par localisation
     */
    private String mapAntenneToLocalisation(AntenneAgents antenne) {
        switch (antenne) {
            case BAMAKO:
                // Retourner un pattern qui matche les divisions de Bamako
                return "BAMAKO";
            case KAYES:
                return "KAYES";
            case KOULIKORO:
                return "KOULIKORO";
            case SIKASSO:
                return "SIKASSO";
            case SÉGOU:
                return "SEGOU";
            case MOPTI:
                return "MOPTI";
            case GAO:
                return "GAO";
            case TOMBOUCTOU:
                return "TOMBOUCTOU";
            case KIDAL:
                return "KIDAL";
            // Ajouter les autres antennes si nécessaire
            case TAOUDÉNIT:
                return "TAOUDENIT";
            case MÉNAKA:
                return "MENAKA";
            case NIORO:
                return "NIORO";
            case BOUGOUNI:
                return "BOUGOUNI";
            case DIOÏLA:
                return "DIOILA";
            case KOUTIALA:
                return "KOUTIALA";
            case KITA:
                return "KITA";
            case NARA:
                return "NARA";
            case BANDIAGARA:
                return "BANDIAGARA";
            case SAN:
                return "SAN";
            case DOUENTZA:
                return "DOUENTZA";
            default:
                return null;
        }
    }
    
    /**
     * Filtrer les entreprises par région géographique
     * Recherche dans les noms de division qui contiennent le nom de la région
     */
    private Page<Entreprise> filterEntreprisesByRegion(String regionName, Pageable pageable) {
        try {
            // Récupérer toutes les entreprises
            Page<Entreprise> allEntreprises = entrepriseService.listEntreprises(pageable);
            
            // Filtrer par nom de division qui contient la région
            List<Entreprise> filteredList = allEntreprises.getContent().stream()
                .filter(entreprise -> {
                    if (entreprise.getDivision() != null && entreprise.getDivision().getNom() != null) {
                        String divisionNom = entreprise.getDivision().getNom().toUpperCase();
                        String region = regionName.toUpperCase();
                        
                        // Vérifier si le nom de la division contient la région
                        // ou si c'est une correspondance géographique connue
                        return divisionNom.contains(region) || 
                               isGeographicalMatch(divisionNom, region);
                    }
                    return false;
                })
                .collect(java.util.stream.Collectors.toList());
            
            System.out.println("📝 [AgentController] Entreprises filtrées pour " + regionName + ": " + filteredList.size());
            
            // Créer une nouvelle page avec les résultats filtrés
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredList.size());
            List<Entreprise> pageContent = filteredList.subList(start, end);
            
            return new org.springframework.data.domain.PageImpl<>(
                pageContent, 
                pageable, 
                filteredList.size()
            );
            
        } catch (Exception e) {
            System.err.println("❌ [AgentController] Erreur lors du filtrage par région: " + e.getMessage());
            // En cas d'erreur, retourner toutes les entreprises
            return entrepriseService.listEntreprises(pageable);
        }
    }
    
    /**
     * Vérifier les correspondances géographiques connues
     * Par exemple, certaines divisions peuvent avoir des noms différents mais appartenir à la même région
     */
    private boolean isGeographicalMatch(String divisionNom, String region) {
        // Correspondances géographiques spécifiques au Mali
        switch (region) {
            case "BAMAKO":
                return divisionNom.contains("SOTUBA") || 
                       divisionNom.contains("COMMUNE I") ||
                       divisionNom.contains("COMMUNE II") ||
                       divisionNom.contains("COMMUNE III") ||
                       divisionNom.contains("COMMUNE IV") ||
                       divisionNom.contains("COMMUNE V") ||
                       divisionNom.contains("COMMUNE VI");
            case "KAYES":
                return divisionNom.contains("KAYES") ||
                       divisionNom.contains("KITA") ||
                       divisionNom.contains("NIORO");
            case "KOULIKORO":
                return divisionNom.contains("KOULIKORO") ||
                       divisionNom.contains("KATI") ||
                       divisionNom.contains("DIOILA");
            case "SIKASSO":
                return divisionNom.contains("SIKASSO") ||
                       divisionNom.contains("BOUGOUNI") ||
                       divisionNom.contains("KOUTIALA");
            case "SEGOU":
                return divisionNom.contains("SEGOU") ||
                       divisionNom.contains("SAN");
            case "MOPTI":
                return divisionNom.contains("MOPTI") ||
                       divisionNom.contains("BANDIAGARA") ||
                       divisionNom.contains("DOUENTZA");
            default:
                return false;
        }
    }

    /**
     * Endpoint pour créer une entreprise via l'interface agent
     * Contrairement à l'endpoint utilisateur, celui-ci ne nécessite pas d'utilisateur connecté
     */
    @PostMapping("/applications")
    public ResponseEntity<EntrepriseResponse> createEntreprise(@RequestBody @Valid EntrepriseRequest request) {
        try {
            // Créer l'entreprise sans utilisateur connecté (pour les agents)
            Entreprise created = entrepriseService.createEntrepriseForAgent(request);
            
            // Convertir en réponse
            EntrepriseResponse response = new EntrepriseResponse();
            response.id = created.getId();
            response.reference = created.getReference();
            response.nom = created.getNom();
            response.sigle = created.getSigle();
            response.statutCreation = created.getStatutCreation();
            response.etapeValidation = created.getEtapeValidation();
            response.creation = created.getCreation();
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // En cas d'erreur, retourner une erreur 400
            throw new RuntimeException("Erreur lors de la création de l'entreprise: " + e.getMessage());
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getApplications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "all") String assigned,
            @RequestParam(defaultValue = "-submitted_at") String sort) {
        
        try {
            // Obtenir l'agent connecté
            Persons currentAgent = getCurrentAgent();
            
            // Créer un Pageable pour Spring Data (page commence à 0)
            Sort.Direction direction = sort.startsWith("-") ? Sort.Direction.DESC : Sort.Direction.ASC;
            String sortField = sort.startsWith("-") ? sort.substring(1) : sort;
            
            // Mapper les champs de tri de l'agent vers les champs d'entreprise
            switch (sortField) {
                case "submitted_at":
                    sortField = "creation";
                    break;
                case "company_name":
                    sortField = "nom";
                    break;
                default:
                    sortField = "creation"; // Par défaut
            }
            
            Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(direction, sortField));
            
            // Récupérer les entreprises selon les antennes de l'agent (nouveau système)
            Page<Entreprise> entreprisePage;
            if (canViewAllEntreprises(currentAgent)) {
                // Super admin peut voir toutes les entreprises
                System.out.println("📝 [AgentController] SUPER_ADMIN - Accès à toutes les entreprises");
                entreprisePage = entrepriseService.listEntreprises(pageable);
            } else {
                // Agent normal : filtrer par toutes ses antennes avec le nouveau système INSTAT
                List<AntenneAgents> agentAntennes = personsService.getAgentAntennes(currentAgent.getId());
                if (!agentAntennes.isEmpty()) {
                    System.out.println("📝 [AgentController] Agent " + currentAgent.getId() + " - Filtrage par antennes: " + 
                        agentAntennes.stream().map(AntenneAgents::name).collect(Collectors.toList()));
                    entreprisePage = entrepriseService.listEntreprisesByAgentAntennes(pageable, agentAntennes);
                } else {
                    System.out.println("⚠️ [AgentController] Agent sans antenne assignée - accès à toutes les entreprises");
                    entreprisePage = entrepriseService.listEntreprises(pageable);
                }
            }
            
            // Adapter le format pour l'application agent (frontend attend snake_case)
            List<Map<String, Object>> applications = new ArrayList<>();
            for (Entreprise entreprise : entreprisePage.getContent()) {
                Map<String, Object> app = new HashMap<>();
                app.put("id", entreprise.getId());
                app.put("reference", entreprise.getReference());
                // Nom d'entreprise attendu sous company_name
                app.put("company_name", entreprise.getNom());
                app.put("sigle", entreprise.getSigle());
                // Mapper les statuts backend -> frontend
                String statusCode = "pending";
                if (entreprise.getStatutCreation() != null) {
                    switch (entreprise.getStatutCreation()) {
                        case VALIDEE: statusCode = "approved"; break;
                        case REFUSEE: statusCode = "rejected"; break;
                        case EN_COURS: statusCode = "in_review"; break;
                        default: statusCode = "pending"; break;
                    }
                }
                app.put("status", statusCode);
                // Date soumission attendue sous submitted_at
                app.put("submitted_at", entreprise.getCreation());
                app.put("typeEntreprise", entreprise.getTypeEntreprise() != null ? entreprise.getTypeEntreprise().toString() : null);
                app.put("formeJuridique", entreprise.getFormeJuridique() != null ? entreprise.getFormeJuridique().toString() : null);
                app.put("domaineActivite", entreprise.getDomaineActivite() != null ? entreprise.getDomaineActivite().toString() : null);
                app.put("domaineActiviteNr", entreprise.getDomaineActiviteNr() != null ? entreprise.getDomaineActiviteNr().toString() : null);
                app.put("divisionCode", entreprise.getDivision() != null ? entreprise.getDivision().getCode() : null);
                app.put("divisionNom", entreprise.getDivision() != null ? entreprise.getDivision().getNom() : null);
                // Champs attendus par le tableau ApplicationsTable
                app.put("priority", "medium");
                app.put("payment_status", "pending");
                app.put("assigned_agent", null); // À implémenter si nécessaire
                app.put("user", null); // Demandeur (si disponible)
                applications.add(app);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("applications", applications);
            response.put("total", entreprisePage.getTotalElements());
            response.put("page", page);
            response.put("limit", limit);
            response.put("totalPages", entreprisePage.getTotalPages());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // En cas d'erreur, retourner une réponse vide
            Map<String, Object> response = new HashMap<>();
            response.put("applications", new ArrayList<>());
            response.put("total", 0);
            response.put("page", page);
            response.put("limit", limit);
            response.put("totalPages", 0);
            response.put("error", e.getMessage());
            
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            // Récupérer toutes les entreprises pour calculer les statistiques
            Pageable allPages = PageRequest.of(0, Integer.MAX_VALUE);
            Page<Entreprise> allEntreprises = entrepriseService.listEntreprises(allPages);
            
            long totalApplications = allEntreprises.getTotalElements();
            long pendingApplications = allEntreprises.getContent().stream()
                .filter(e -> e.getStatutCreation() == null || 
                           e.getStatutCreation().toString().equals("EN_COURS") ||
                           e.getStatutCreation().toString().equals("PENDING"))
                .count();
            
            long approvedApplications = allEntreprises.getContent().stream()
                .filter(e -> e.getStatutCreation() != null && 
                           e.getStatutCreation().toString().equals("VALIDEE"))
                .count();
                
            long rejectedApplications = allEntreprises.getContent().stream()
                .filter(e -> e.getStatutCreation() != null && 
                           e.getStatutCreation().toString().equals("REJETEE"))
                .count();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalApplications", totalApplications);
            stats.put("pendingApplications", pendingApplications);
            stats.put("approvedApplications", approvedApplications);
            stats.put("rejectedApplications", rejectedApplications);
            stats.put("myAssignedApplications", 0); // À implémenter si système d'assignation
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            // En cas d'erreur, retourner des statistiques vides
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalApplications", 0);
            stats.put("pendingApplications", 0);
            stats.put("approvedApplications", 0);
            stats.put("rejectedApplications", 0);
            stats.put("myAssignedApplications", 0);
            stats.put("error", e.getMessage());
            
            return ResponseEntity.ok(stats);
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        
        // Notifications fictives
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", new ArrayList<>());
        response.put("total", 0);
        response.put("unreadCount", 0);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<?> getApplication(@PathVariable String id) {
        // Détail d'une application fictive
        Map<String, Object> application = new HashMap<>();
        application.put("id", id);
        application.put("status", "PENDING");
        application.put("companyName", "Entreprise Test");
        application.put("submittedAt", new Date());
        
        return ResponseEntity.ok(application);
    }

    @PatchMapping("/applications/{id}")
    public ResponseEntity<?> updateApplication(
            @PathVariable String id, 
            @RequestBody Map<String, Object> updates) {
        
        // Simulation de mise à jour
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Application mise à jour avec succès");
        response.put("id", id);
        
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/applications/{id}/assign")
    public ResponseEntity<?> assignApplication(
            @PathVariable String id,
            @RequestBody Map<String, Object> assignData) {
        
        // Simulation d'assignation
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Application assignée avec succès");
        response.put("id", id);
        
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/applications/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> statusData) {
        
        try {
            String newStatus = (String) statusData.get("status");
            String note = (String) statusData.get("note");
            
            System.out.println("🚨 [AgentController] Mise à jour statut entreprise: " + id + " vers " + newStatus);
            
            // Récupérer l'entreprise
            Entreprise entreprise = entrepriseService.findById(id);
            if (entreprise == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Entreprise non trouvée");
                return ResponseEntity.notFound().build();
            }
            
            // Utiliser la même logique que EntrepriseController
            abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation nouvelleEtape = determinerEtapeDepuisStatut(newStatus);
            
            // Mettre à jour le statut de création
            if ("VALIDE".equals(newStatus)) {
                entreprise.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.VALIDEE);
            } else if ("REJETE".equals(newStatus)) {
                entreprise.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.REFUSEE);
            } else if ("INCOMPLET".equals(newStatus)) {
                entreprise.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
            } else if ("PAIEMENT".equals(newStatus)) {
                entreprise.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
            } else if ("PAIEMENT_VALIDE".equals(newStatus)) {
                entreprise.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
            }
            
            // Mettre à jour l'étape
            if (nouvelleEtape != null) {
                entreprise.setEtapeValidation(nouvelleEtape);
                
                // Si l'entreprise passe à REVISION après un paiement validé, la désassigner de l'agent d'accueil
                if (nouvelleEtape == abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.REVISION && 
                    "PAIEMENT_VALIDE".equals(newStatus)) {
                    System.out.println("🔄 [AgentController] Désassignation de l'agent d'accueil - Passage en REVISION");
                    entreprise.setAssignedTo(null);
                }
            }
            
            // Sauvegarder
            entreprise = entrepriseService.save(entreprise);
            
            // Ajouter une note dans l'historique si fournie
            if (note != null && !note.trim().isEmpty()) {
                System.out.println("📝 [AgentController] Note ajoutée: " + note);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statut mis à jour avec succès");
            response.put("id", id);
            response.put("newStatus", newStatus);
            response.put("newEtape", nouvelleEtape != null ? nouvelleEtape.toString() : null);
            
            System.out.println("✅ [AgentController] Entreprise " + id + " mise à jour: " + newStatus + " -> " + nouvelleEtape);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [AgentController] Erreur mise à jour statut: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la mise à jour: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Déterminer l'étape de validation basée sur le statut (copié depuis EntrepriseController)
     */
    private abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation determinerEtapeDepuisStatut(String status) {
        switch (status) {
            case "VALIDE":
                return abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.REGISSEUR;
            case "PAIEMENT":
                return abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.PAIEMENT_AGENT;
            case "PAIEMENT_VALIDE":
                return abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.REVISION;
            case "REJETE":
            case "INCOMPLET":
            default:
                return abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.ACCUEIL;
        }
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notification marquée comme lue");
        
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Toutes les notifications marquées comme lues");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Endpoint pour récupérer les entreprises par antenne (accessible à tous les agents)
     */
    @GetMapping("/entreprises")
    public ResponseEntity<?> getEntreprisesByAntenne(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000") int size,
            @RequestParam(required = false) String antenne,
            @RequestParam(defaultValue = "creation") String sort) {
        
        try {
            // Obtenir l'agent connecté
            Persons currentAgent = getCurrentAgent();
            
            System.out.println("📝 [AgentController] Agent connecté: " + currentAgent.getEmail() + " - Rôle: " + currentAgent.getRole() + " - Antenne: " + currentAgent.getAntenneAgent());
            
            // Créer un Pageable pour Spring Data
            Sort.Direction direction = Sort.Direction.DESC; // Par défaut DESC pour les plus récentes
            if (sort.startsWith("+")) {
                direction = Sort.Direction.ASC;
                sort = sort.substring(1);
            } else if (sort.startsWith("-")) {
                direction = Sort.Direction.DESC;
                sort = sort.substring(1);
            }
            
            // Mapper les champs de tri
            switch (sort) {
                case "dateCreation":
                    sort = "creation";
                    break;
                case "nom":
                    sort = "nom";
                    break;
                default:
                    sort = "creation";
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
            
            // Récupérer les entreprises selon l'antenne demandée
            Page<Entreprise> entreprisePage;
            if (antenne != null && !antenne.isEmpty()) {
                try {
                    AntenneAgents antenneEnum = AntenneAgents.valueOf(antenne.toUpperCase());
                    entreprisePage = entrepriseService.listEntreprisesByAntenne(pageable, antenneEnum);
                } catch (IllegalArgumentException e) {
                    // Antenne invalide, retourner toutes les entreprises
                    entreprisePage = entrepriseService.listEntreprises(pageable);
                }
            } else {
                // Pas d'antenne spécifiée, filtrer par les antennes de l'agent connecté
                List<AntenneAgents> agentAntennes = personsService.getAgentAntennes(currentAgent.getId());
                if (!agentAntennes.isEmpty()) {
                    // Filtrer par les antennes de l'agent
                    entreprisePage = entrepriseService.listEntreprisesByAgentAntennes(pageable, agentAntennes);
                } else {
                    // Agent sans antenne, voir toutes les entreprises
                    entreprisePage = entrepriseService.listEntreprises(pageable);
                }
            }
            
            // Convertir en format attendu par le frontend
            List<Map<String, Object>> entreprises = new ArrayList<>();
            for (Entreprise entreprise : entreprisePage.getContent()) {
                Map<String, Object> ent = new HashMap<>();
                ent.put("id", entreprise.getId());
                ent.put("reference", entreprise.getReference());
                ent.put("nom", entreprise.getNom());
                ent.put("sigle", entreprise.getSigle());
                ent.put("statutCreation", entreprise.getStatutCreation() != null ? entreprise.getStatutCreation().toString() : "EN_COURS");
                ent.put("etapeValidation", entreprise.getEtapeValidation() != null ? entreprise.getEtapeValidation().toString() : "ACCUEIL");
                ent.put("formeJuridique", entreprise.getFormeJuridique() != null ? entreprise.getFormeJuridique().toString() : null);
                ent.put("typeEntreprise", entreprise.getTypeEntreprise() != null ? entreprise.getTypeEntreprise().toString() : "SOCIETE");
                ent.put("domaineActivite", entreprise.getDomaineActivite() != null ? entreprise.getDomaineActivite().toString() : null);
                ent.put("dateCreation", entreprise.getCreation());
                ent.put("creation", entreprise.getCreation());
                ent.put("modification", entreprise.getModification());
                ent.put("banni", entreprise.getBanni());
                ent.put("antenneAgent", entreprise.getAntenneAgent() != null ? entreprise.getAntenneAgent().toString() : null);
                
                // Informations de localisation
                if (entreprise.getDivision() != null) {
                    ent.put("divisionCode", entreprise.getDivision().getCode());
                    ent.put("divisionNom", entreprise.getDivision().getNom());
                    // Note: Les méthodes getRegion() et getCommune() ne sont pas disponibles sur Divisions
                    // Utiliser seulement les informations disponibles
                    ent.put("regionNom", null); // À implémenter selon la structure de Divisions
                    ent.put("communeNom", null); // À implémenter selon la structure de Divisions
                }
                
                // Informations du demandeur (si disponible)
                // TODO: Ajouter les informations du demandeur selon la structure de vos données
                
                entreprises.add(ent);
            }
            
            // Réponse avec pagination
            Map<String, Object> response = new HashMap<>();
            response.put("content", entreprises);
            response.put("totalElements", entreprisePage.getTotalElements());
            response.put("totalPages", entreprisePage.getTotalPages());
            response.put("size", entreprisePage.getSize());
            response.put("number", entreprisePage.getNumber());
            response.put("numberOfElements", entreprisePage.getNumberOfElements());
            response.put("first", entreprisePage.isFirst());
            response.put("last", entreprisePage.isLast());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // En cas d'erreur, retourner une réponse vide
            Map<String, Object> response = new HashMap<>();
            response.put("content", new ArrayList<>());
            response.put("totalElements", 0);
            response.put("totalPages", 0);
            response.put("error", e.getMessage());
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Endpoint pour récupérer la liste des antennes disponibles
     */
    @GetMapping("/antennes")
    public ResponseEntity<?> getAntennes() {
        try {
            List<Map<String, Object>> antennes = new ArrayList<>();
            for (AntenneAgents antenne : AntenneAgents.values()) {
                Map<String, Object> antenneInfo = new HashMap<>();
                antenneInfo.put("code", antenne.name());
                antenneInfo.put("nom", antenne.getValue());
                antennes.add(antenneInfo);
            }
            
            return ResponseEntity.ok(antennes);
            
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    /**
     * Endpoint temporaire pour tester sans authentification
     * À SUPPRIMER EN PRODUCTION
     */
    @GetMapping("/entreprises-test")
    public ResponseEntity<?> getEntreprisesTest(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000") int size,
            @RequestParam(required = false) String antenne,
            @RequestParam(defaultValue = "creation") String sort) {
        
        try {
            System.out.println("📝 [AgentController] Test endpoint appelé avec antenne: " + antenne);
            
            // Créer un Pageable pour Spring Data
            Sort.Direction direction = Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "creation"));
            
            // Récupérer les entreprises selon la localisation correspondant à l'antenne
            Page<Entreprise> entreprisePage;
            if (antenne != null && !antenne.isEmpty()) {
                try {
                    AntenneAgents antenneEnum = AntenneAgents.valueOf(antenne.toUpperCase());
                    System.out.println("📝 [AgentController] Filtrage par localisation pour antenne: " + antenneEnum);
                    
                    // Filtrer par localisation géographique
                    String regionName = mapAntenneToLocalisation(antenneEnum);
                    if (regionName != null) {
                        System.out.println("📝 [AgentController] Filtrage par région: " + regionName);
                        // Utiliser une méthode personnalisée pour filtrer par région
                        entreprisePage = filterEntreprisesByRegion(regionName, pageable);
                    } else {
                        System.out.println("⚠️ [AgentController] Pas de mapping pour antenne: " + antenne);
                        entreprisePage = entrepriseService.listEntreprises(pageable);
                    }
                } catch (IllegalArgumentException e) {
                    System.out.println("⚠️ [AgentController] Antenne invalide: " + antenne + ", retour de toutes les entreprises");
                    entreprisePage = entrepriseService.listEntreprises(pageable);
                }
            } else {
                System.out.println("📝 [AgentController] Pas d'antenne spécifiée, retour de toutes les entreprises");
                entreprisePage = entrepriseService.listEntreprises(pageable);
            }
            
            System.out.println("📝 [AgentController] Entreprises trouvées: " + entreprisePage.getTotalElements());
            
            // Convertir en format attendu par le frontend
            List<Map<String, Object>> entreprises = new ArrayList<>();
            for (Entreprise entreprise : entreprisePage.getContent()) {
                Map<String, Object> ent = new HashMap<>();
                ent.put("id", entreprise.getId());
                ent.put("reference", entreprise.getReference());
                ent.put("nom", entreprise.getNom());
                ent.put("sigle", entreprise.getSigle());
                ent.put("statutCreation", entreprise.getStatutCreation() != null ? entreprise.getStatutCreation().toString() : "EN_COURS");
                ent.put("etapeValidation", entreprise.getEtapeValidation() != null ? entreprise.getEtapeValidation().toString() : "ACCUEIL");
                ent.put("formeJuridique", entreprise.getFormeJuridique() != null ? entreprise.getFormeJuridique().toString() : null);
                ent.put("typeEntreprise", entreprise.getTypeEntreprise() != null ? entreprise.getTypeEntreprise().toString() : "SOCIETE");
                ent.put("domaineActivite", entreprise.getDomaineActivite() != null ? entreprise.getDomaineActivite().toString() : null);
                ent.put("dateCreation", entreprise.getCreation());
                ent.put("creation", entreprise.getCreation());
                ent.put("modification", entreprise.getModification());
                ent.put("banni", entreprise.getBanni());
                ent.put("antenneAgent", entreprise.getAntenneAgent() != null ? entreprise.getAntenneAgent().toString() : null);
                
                // Informations de localisation
                if (entreprise.getDivision() != null) {
                    ent.put("divisionCode", entreprise.getDivision().getCode());
                    ent.put("divisionNom", entreprise.getDivision().getNom());
                    ent.put("regionNom", null);
                    ent.put("communeNom", null);
                }
                
                entreprises.add(ent);
            }
            
            // Réponse avec pagination
            Map<String, Object> response = new HashMap<>();
            response.put("content", entreprises);
            response.put("totalElements", entreprisePage.getTotalElements());
            response.put("totalPages", entreprisePage.getTotalPages());
            response.put("size", entreprisePage.getSize());
            response.put("number", entreprisePage.getNumber());
            response.put("numberOfElements", entreprisePage.getNumberOfElements());
            response.put("first", entreprisePage.isFirst());
            response.put("last", entreprisePage.isLast());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [AgentController] Erreur dans entreprises-test: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", new ArrayList<>());
            response.put("totalElements", 0);
            response.put("totalPages", 0);
            response.put("error", e.getMessage());
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Endpoint temporaire pour assigner une antenne à une entreprise
     * À SUPPRIMER EN PRODUCTION
     */
    @PostMapping("/entreprises-test/{id}/assign-antenne")
    public ResponseEntity<?> assignAntenneToEntreprise(
            @PathVariable String id,
            @RequestParam String antenne) {
        
        try {
            System.out.println("📝 [AgentController] Assignation antenne " + antenne + " à l'entreprise " + id);
            
            // Récupérer l'entreprise
            Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(id);
            if (!entrepriseOpt.isPresent()) {
                throw new RuntimeException("Entreprise non trouvée avec l'ID: " + id);
            }
            
            Entreprise entreprise = entrepriseOpt.get();
            
            // Assigner l'antenne
            try {
                AntenneAgents antenneEnum = AntenneAgents.valueOf(antenne.toUpperCase());
                entreprise.setAntenneAgent(antenneEnum);
                
                // Sauvegarder directement avec le repository
                entrepriseRepository.save(entreprise);
                
                System.out.println("✅ [AgentController] Antenne " + antenne + " assignée avec succès à " + entreprise.getNom());
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Antenne assignée avec succès");
                response.put("entrepriseId", id);
                response.put("antenne", antenne);
                response.put("entrepriseNom", entreprise.getNom());
                
                return ResponseEntity.ok(response);
                
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Antenne invalide: " + antenne);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [AgentController] Erreur lors de l'assignation: " + e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.ok(response);
        }
    }
}
