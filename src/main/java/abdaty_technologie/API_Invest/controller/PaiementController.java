package abdaty_technologie.API_Invest.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.dto.requests.PaiementRequest;
import abdaty_technologie.API_Invest.dto.responses.ErrorResponse;
import abdaty_technologie.API_Invest.dto.responses.PaiementResponse;
import abdaty_technologie.API_Invest.dto.responses.SuccessResponse;
import abdaty_technologie.API_Invest.dto.responses.TotalResponse;
import abdaty_technologie.API_Invest.service.IPaiementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/paiements")
@Tag(name = "Paiements", description = "API de gestion des paiements")
@CrossOrigin(origins = "*")
public class PaiementController {

    @Autowired
    private IPaiementService paiementService;

    @PostMapping
    @Operation(summary = "Créer un paiement", description = "Crée un nouveau paiement")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<?> creerPaiement(@Valid @RequestBody PaiementRequest request) {
        try {
            PaiementResponse response = paiementService.creerPaiement(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.PAYMENT_CREATION_ERROR + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Obtenir tous les paiements", description = "Récupère la liste de tous les paiements")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> obtenirTousPaiements() {
        try {
            List<PaiementResponse> paiements = paiementService.obtenirTousPaiements();
            return ResponseEntity.ok(paiements);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.PAYMENT_RETRIEVAL_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un paiement par ID", description = "Récupère un paiement spécifique par son ID")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<?> obtenirPaiementParId(@PathVariable String id) {
        try {
            PaiementResponse paiement = paiementService.obtenirPaiementParId(id);
            return ResponseEntity.ok(paiement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.PAYMENT_NOT_FOUND_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/reference/{reference}")
    @Operation(summary = "Obtenir un paiement par référence", description = "Récupère un paiement par sa référence de transaction")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<?> obtenirPaiementParReference(@PathVariable String reference) {
        try {
            PaiementResponse paiement = paiementService.obtenirPaiementParReference(reference);
            return ResponseEntity.ok(paiement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.PAYMENT_NOT_FOUND_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/personne/{personneId}")
    @Operation(summary = "Obtenir les paiements d'une personne", description = "Récupère tous les paiements d'une personne")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<?> obtenirPaiementsParPersonne(@PathVariable String personneId) {
        try {
            List<PaiementResponse> paiements = paiementService.obtenirPaiementsParPersonne(personneId);
            return ResponseEntity.ok(paiements);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.PAYMENT_RETRIEVAL_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/entreprise/{entrepriseId}")
    @Operation(summary = "Obtenir les paiements d'une entreprise", description = "Récupère tous les paiements d'une entreprise")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> obtenirPaiementsParEntreprise(@PathVariable String entrepriseId) {
        try {
            List<PaiementResponse> paiements = paiementService.obtenirPaiementsParEntreprise(entrepriseId);
            return ResponseEntity.ok(paiements);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.PAYMENT_RETRIEVAL_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/statut/{statut}")
    @Operation(summary = "Obtenir les paiements par statut", description = "Récupère tous les paiements ayant un statut spécifique")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> obtenirPaiementsParStatut(@PathVariable StatutPaiement statut) {
        try {
            List<PaiementResponse> paiements = paiementService.obtenirPaiementsParStatut(statut);
            return ResponseEntity.ok(paiements);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.PAYMENT_RETRIEVAL_ERROR + e.getMessage()));
        }
    }

    @PutMapping("/{id}/valider")
    @Operation(summary = "Valider un paiement", description = "Valide un paiement en attente")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> validerPaiement(@PathVariable String id) {
        try {
            PaiementResponse paiement = paiementService.validerPaiement(id);
            return ResponseEntity.ok(paiement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.VALIDATION_ERROR + e.getMessage()));
        }
    }

    @PutMapping("/{id}/refuser")
    @Operation(summary = "Refuser un paiement", description = "Refuse un paiement en attente")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> refuserPaiement(@PathVariable String id) {
        try {
            PaiementResponse paiement = paiementService.refuserPaiement(id);
            return ResponseEntity.ok(paiement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.REFUSAL_ERROR + e.getMessage()));
        }
    }

    @PutMapping("/{id}/annuler")
    @Operation(summary = "Annuler un paiement", description = "Annule un paiement")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<?> annulerPaiement(@PathVariable String id) {
        try {
            PaiementResponse paiement = paiementService.annulerPaiement(id);
            return ResponseEntity.ok(paiement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.CANCELLATION_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/total/personne/{personneId}")
    @Operation(summary = "Total des paiements d'une personne", description = "Calcule le total des paiements validés d'une personne")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<?> calculerTotalPaiementsPersonne(@PathVariable String personneId, 
                                                           @RequestParam(defaultValue = "VALIDE") StatutPaiement statut) {
        try {
            BigDecimal total = paiementService.calculerTotalPaiementsPersonne(personneId, statut);
            return ResponseEntity.ok(new TotalResponse(total, statut.name()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.CALCULATION_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/total/entreprise/{entrepriseId}")
    @Operation(summary = "Total des paiements d'une entreprise", description = "Calcule le total des paiements validés d'une entreprise")
    //@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> calculerTotalPaiementsEntreprise(@PathVariable String entrepriseId, 
                                                            @RequestParam(defaultValue = "VALIDE") StatutPaiement statut) {
        try {
            BigDecimal total = paiementService.calculerTotalPaiementsEntreprise(entrepriseId, statut);
            return ResponseEntity.ok(new TotalResponse(total, statut.name()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.CALCULATION_ERROR + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un paiement", description = "Supprime un paiement (réservé aux super admins)")
    //@PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> supprimerPaiement(@PathVariable String id) {
        try {
            paiementService.supprimerPaiement(id);
            return ResponseEntity.ok(new SuccessResponse(Messages.PAYMENT_DELETED_SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.DELETION_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/confirmes")
    @Operation(summary = "Récupérer les paiements confirmés", description = "Récupère tous les paiements avec le statut REUSSI")
    public ResponseEntity<?> getPaiementsConfirmes() {
        try {
            System.out.println("🔍 [PaiementController] Récupération des paiements confirmés...");
            
            List<PaiementResponse> paiementsConfirmes = paiementService.getPaiementsByStatut(StatutPaiement.VALIDE);
            
            System.out.println("✅ [PaiementController] " + paiementsConfirmes.size() + " paiements confirmés trouvés");
            
            return ResponseEntity.ok(paiementsConfirmes);
        } catch (Exception e) {
            System.err.println("❌ [PaiementController] Erreur lors de la récupération des paiements confirmés: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse("Erreur lors de la récupération des paiements confirmés: " + e.getMessage()));
        }
    }

}
