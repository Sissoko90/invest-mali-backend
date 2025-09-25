package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import abdaty_technologie.API_Invest.service.EntrepriseService;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.dto.response.EntrepriseResponse;

import java.util.*;

@RestController
@RequestMapping("/agent")
public class AgentController {

    @Autowired
    private EntrepriseService entrepriseService;

    @GetMapping("/applications")
    public ResponseEntity<?> getApplications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "all") String assigned,
            @RequestParam(defaultValue = "-submitted_at") String sort) {
        
        try {
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
            
            // Récupérer les entreprises depuis le service
            Page<Entreprise> entreprisePage = entrepriseService.listEntreprises(pageable);
            
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
        
        // Simulation de changement de statut
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Statut mis à jour avec succès");
        response.put("id", id);
        response.put("newStatus", statusData.get("status"));
        
        return ResponseEntity.ok(response);
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
}
