<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.service.DemandeAutorisationExerciceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/demandes-autorisation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeAutorisationExerciceController {

    private final DemandeAutorisationExerciceService demandeService;

    // ==================== CRÉATION ET GESTION DES DEMANDES ====================

    /**
     * Créer une nouvelle demande d'autorisation d'exercice indépendante
     */
    @PostMapping("/creer")
    public ResponseEntity<?> creerDemande(@RequestBody DemandeAutorisationExercice demande) {
        try {
            System.out.println("=== CRÉATION DEMANDE INDÉPENDANTE ===");
            System.out.println("Type: " + demande.getTypeDemande());
            System.out.println("Demandeur: " + demande.getNomDemandeur());

            DemandeAutorisationExercice nouvelleDemande = demandeService.creerDemande(demande);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande créée avec succès");
            response.put("demande", nouvelleDemande);
            response.put("numeroDemande", nouvelleDemande.getNumeroDemande());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erreur création demande: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Mettre à jour une demande existante
     */
    @PutMapping("/{demandeId}")
    public ResponseEntity<?> mettreAJourDemande(
            @PathVariable Long demandeId,
            @RequestBody DemandeAutorisationExercice demande) {
        try {
            DemandeAutorisationExercice demandeModifiee = demandeService.mettreAJourDemande(demandeId, demande);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande mise à jour avec succès");
            response.put("demande", demandeModifiee);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Supprimer une demande
     */
    @DeleteMapping("/{demandeId}")
    public ResponseEntity<?> supprimerDemande(
            @PathVariable Long demandeId,
            @RequestParam(required = false) String motif) {
        try {
            demandeService.supprimerDemande(demandeId, motif != null ? motif : "Suppression demandée");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande supprimée avec succès");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== CONSULTATION DES DEMANDES ====================

    /**
     * Récupérer une demande par son ID
     */
    @GetMapping("/{demandeId}")
    public ResponseEntity<?> getDemandeById(@PathVariable Long demandeId) {
        try {
            Optional<DemandeAutorisationExercice> demande = demandeService.getDemandeById(demandeId);

            if (demande.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("demande", demande.get());
                response.put("historiqueEtapes", demandeService.getHistoriqueEtapes(demandeId));
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Demande non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer une demande par son numéro
     */
    @GetMapping("/numero/{numeroDemande}")
    public ResponseEntity<?> getDemandeByNumero(@PathVariable String numeroDemande) {
        try {
            Optional<DemandeAutorisationExercice> demande = demandeService.getDemandeByNumero(numeroDemande);

            if (demande.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("demande", demande.get());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Demande non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer les demandes d'un demandeur
     */
    @GetMapping("/demandeur/{email}")
    public ResponseEntity<?> getDemandesByDemandeur(@PathVariable String email) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.getDemandesByDemandeur(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer les demandes par type
     */
    @GetMapping("/type/{typeDemande}")
    public ResponseEntity<?> getDemandesByType(@PathVariable TypeDemandeAgrement typeDemande) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.getDemandesByType(typeDemande);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer les demandes par statut
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<?> getDemandesByStatut(@PathVariable String statut) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.getDemandesByStatut(statut);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== GESTION DU WORKFLOW ====================

    /**
     * Assigner une demande à un agent
     */
    @PostMapping("/{demandeId}/assigner")
    public ResponseEntity<?> assignerDemande(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam String antenneTraitement) {
        try {
            DemandeAutorisationExercice demande = demandeService.assignerDemande(demandeId, agentId, antenneTraitement);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande assignée avec succès");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Faire passer une demande à l'étape suivante
     */
    @PostMapping("/{demandeId}/etape-suivante")
    public ResponseEntity<?> passerEtapeSuivante(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam(required = false) String observations) {
        try {
            DemandeAutorisationExercice demande = demandeService.passerEtapeSuivante(
                demandeId, 
                agentId, 
                observations != null ? observations : "Passage à l'étape suivante"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande passée à l'étape suivante");
            response.put("demande", demande);
            response.put("nouvelleEtape", demande.getEtapeActuelle());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Rejeter une demande
     */
    @PostMapping("/{demandeId}/rejeter")
    public ResponseEntity<?> rejeterDemande(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam String motifRejet) {
        try {
            DemandeAutorisationExercice demande = demandeService.rejeterDemande(demandeId, agentId, motifRejet);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetée");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Valider une demande
     */
    @PostMapping("/{demandeId}/valider")
    public ResponseEntity<?> validerDemande(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam(required = false) String observations) {
        try {
            DemandeAutorisationExercice demande = demandeService.validerDemande(
                demandeId, 
                agentId, 
                observations != null ? observations : "Demande validée"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande validée avec succès");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== GESTION DES PAIEMENTS ====================

    /**
     * Générer une demande de paiement
     */
    @PostMapping("/{demandeId}/paiement/generer")
    public ResponseEntity<?> genererDemandePaiement(@PathVariable Long demandeId) {
        try {
            Map<String, Object> demandePaiement = demandeService.genererDemandePaiement(demandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandePaiement", demandePaiement);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Marquer le paiement comme effectué
     */
    @PostMapping("/{demandeId}/paiement/confirmer")
    public ResponseEntity<?> confirmerPaiement(
            @PathVariable Long demandeId,
            @RequestParam String referencePaiement) {
        try {
            DemandeAutorisationExercice demande = demandeService.marquerPaiementEffectue(demandeId, referencePaiement);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Paiement confirmé");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Vérifier le statut du paiement
     */
    @GetMapping("/{demandeId}/paiement/statut")
    public ResponseEntity<?> verifierStatutPaiement(@PathVariable Long demandeId) {
        try {
            Map<String, Object> statutPaiement = demandeService.verifierStatutPaiement(demandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("statutPaiement", statutPaiement);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== STATISTIQUES ET RAPPORTS ====================

    /**
     * Obtenir les statistiques générales
     */
    @GetMapping("/statistiques")
    public ResponseEntity<?> getStatistiques() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("statistiquesParType", demandeService.getStatistiquesParType());
            response.put("statistiquesParStatut", demandeService.getStatistiquesParStatut());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtenir le tableau de bord pour un agent
     */
    @GetMapping("/tableau-bord/{agentId}")
    public ResponseEntity<?> getTableauDeBordAgent(@PathVariable String agentId) {
        try {
            Map<String, Object> tableauDeBord = demandeService.getTableauDeBordAgent(agentId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tableauDeBord", tableauDeBord);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Recherche textuelle dans les demandes
     */
    @GetMapping("/recherche")
    public ResponseEntity<?> rechercheTextuelle(@RequestParam String searchTerm) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.rechercheTextuelle(searchTerm);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtenir l'historique des étapes d'une demande
     */
    @GetMapping("/{demandeId}/historique")
    public ResponseEntity<?> getHistoriqueEtapes(@PathVariable Long demandeId) {
        try {
            List<Map<String, Object>> historique = demandeService.getHistoriqueEtapes(demandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("historique", historique);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.service.DemandeAutorisationExerciceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/demandes-autorisation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeAutorisationExerciceController {

    private final DemandeAutorisationExerciceService demandeService;

    // ==================== CRÉATION ET GESTION DES DEMANDES ====================

    /**
     * Créer une nouvelle demande d'autorisation d'exercice indépendante
     */
    @PostMapping("/creer")
    public ResponseEntity<?> creerDemande(@RequestBody DemandeAutorisationExercice demande) {
        try {
            System.out.println("=== CRÉATION DEMANDE INDÉPENDANTE ===");
            System.out.println("Type: " + demande.getTypeDemande());
            System.out.println("Demandeur: " + demande.getNomDemandeur());

            DemandeAutorisationExercice nouvelleDemande = demandeService.creerDemande(demande);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande créée avec succès");
            response.put("demande", nouvelleDemande);
            response.put("numeroDemande", nouvelleDemande.getNumeroDemande());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erreur création demande: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Mettre à jour une demande existante
     */
    @PutMapping("/{demandeId}")
    public ResponseEntity<?> mettreAJourDemande(
            @PathVariable Long demandeId,
            @RequestBody DemandeAutorisationExercice demande) {
        try {
            DemandeAutorisationExercice demandeModifiee = demandeService.mettreAJourDemande(demandeId, demande);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande mise à jour avec succès");
            response.put("demande", demandeModifiee);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Supprimer une demande
     */
    @DeleteMapping("/{demandeId}")
    public ResponseEntity<?> supprimerDemande(
            @PathVariable Long demandeId,
            @RequestParam(required = false) String motif) {
        try {
            demandeService.supprimerDemande(demandeId, motif != null ? motif : "Suppression demandée");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande supprimée avec succès");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== CONSULTATION DES DEMANDES ====================

    /**
     * Récupérer une demande par son ID
     */
    @GetMapping("/{demandeId}")
    public ResponseEntity<?> getDemandeById(@PathVariable Long demandeId) {
        try {
            Optional<DemandeAutorisationExercice> demande = demandeService.getDemandeById(demandeId);

            if (demande.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("demande", demande.get());
                response.put("historiqueEtapes", demandeService.getHistoriqueEtapes(demandeId));
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Demande non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer une demande par son numéro
     */
    @GetMapping("/numero/{numeroDemande}")
    public ResponseEntity<?> getDemandeByNumero(@PathVariable String numeroDemande) {
        try {
            Optional<DemandeAutorisationExercice> demande = demandeService.getDemandeByNumero(numeroDemande);

            if (demande.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("demande", demande.get());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Demande non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer les demandes d'un demandeur
     */
    @GetMapping("/demandeur/{email}")
    public ResponseEntity<?> getDemandesByDemandeur(@PathVariable String email) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.getDemandesByDemandeur(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer les demandes par type
     */
    @GetMapping("/type/{typeDemande}")
    public ResponseEntity<?> getDemandesByType(@PathVariable TypeDemandeAgrement typeDemande) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.getDemandesByType(typeDemande);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer les demandes par statut
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<?> getDemandesByStatut(@PathVariable String statut) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.getDemandesByStatut(statut);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== GESTION DU WORKFLOW ====================

    /**
     * Assigner une demande à un agent
     */
    @PostMapping("/{demandeId}/assigner")
    public ResponseEntity<?> assignerDemande(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam String antenneTraitement) {
        try {
            DemandeAutorisationExercice demande = demandeService.assignerDemande(demandeId, agentId, antenneTraitement);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande assignée avec succès");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Faire passer une demande à l'étape suivante
     */
    @PostMapping("/{demandeId}/etape-suivante")
    public ResponseEntity<?> passerEtapeSuivante(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam(required = false) String observations) {
        try {
            DemandeAutorisationExercice demande = demandeService.passerEtapeSuivante(
                demandeId, 
                agentId, 
                observations != null ? observations : "Passage à l'étape suivante"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande passée à l'étape suivante");
            response.put("demande", demande);
            response.put("nouvelleEtape", demande.getEtapeActuelle());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Rejeter une demande
     */
    @PostMapping("/{demandeId}/rejeter")
    public ResponseEntity<?> rejeterDemande(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam String motifRejet) {
        try {
            DemandeAutorisationExercice demande = demandeService.rejeterDemande(demandeId, agentId, motifRejet);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetée");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Valider une demande
     */
    @PostMapping("/{demandeId}/valider")
    public ResponseEntity<?> validerDemande(
            @PathVariable Long demandeId,
            @RequestParam String agentId,
            @RequestParam(required = false) String observations) {
        try {
            DemandeAutorisationExercice demande = demandeService.validerDemande(
                demandeId, 
                agentId, 
                observations != null ? observations : "Demande validée"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande validée avec succès");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== GESTION DES PAIEMENTS ====================

    /**
     * Générer une demande de paiement
     */
    @PostMapping("/{demandeId}/paiement/generer")
    public ResponseEntity<?> genererDemandePaiement(@PathVariable Long demandeId) {
        try {
            Map<String, Object> demandePaiement = demandeService.genererDemandePaiement(demandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandePaiement", demandePaiement);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Marquer le paiement comme effectué
     */
    @PostMapping("/{demandeId}/paiement/confirmer")
    public ResponseEntity<?> confirmerPaiement(
            @PathVariable Long demandeId,
            @RequestParam String referencePaiement) {
        try {
            DemandeAutorisationExercice demande = demandeService.marquerPaiementEffectue(demandeId, referencePaiement);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Paiement confirmé");
            response.put("demande", demande);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Vérifier le statut du paiement
     */
    @GetMapping("/{demandeId}/paiement/statut")
    public ResponseEntity<?> verifierStatutPaiement(@PathVariable Long demandeId) {
        try {
            Map<String, Object> statutPaiement = demandeService.verifierStatutPaiement(demandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("statutPaiement", statutPaiement);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== STATISTIQUES ET RAPPORTS ====================

    /**
     * Obtenir les statistiques générales
     */
    @GetMapping("/statistiques")
    public ResponseEntity<?> getStatistiques() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("statistiquesParType", demandeService.getStatistiquesParType());
            response.put("statistiquesParStatut", demandeService.getStatistiquesParStatut());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtenir le tableau de bord pour un agent
     */
    @GetMapping("/tableau-bord/{agentId}")
    public ResponseEntity<?> getTableauDeBordAgent(@PathVariable String agentId) {
        try {
            Map<String, Object> tableauDeBord = demandeService.getTableauDeBordAgent(agentId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tableauDeBord", tableauDeBord);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Recherche textuelle dans les demandes
     */
    @GetMapping("/recherche")
    public ResponseEntity<?> rechercheTextuelle(@RequestParam String searchTerm) {
        try {
            List<DemandeAutorisationExercice> demandes = demandeService.rechercheTextuelle(searchTerm);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("demandes", demandes);
            response.put("total", demandes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtenir l'historique des étapes d'une demande
     */
    @GetMapping("/{demandeId}/historique")
    public ResponseEntity<?> getHistoriqueEtapes(@PathVariable Long demandeId) {
        try {
            List<Map<String, Object>> historique = demandeService.getHistoriqueEtapes(demandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("historique", historique);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
