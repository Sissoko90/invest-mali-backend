<<<<<<< HEAD
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
    @Operation(summary = "Récupérer les paiements confirmés", description = "Récupère tous les paiements avec le statut REUSSI avec pagination et recherche")
    public ResponseEntity<?> getPaiementsConfirmes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        try {
            System.out.println("🔍 [PaiementController] Récupération des paiements confirmés...");
            System.out.println("📄 [PaiementController] Page: " + page + ", Size: " + size + ", Search: '" + search + "'");
            System.out.println("🔍 [PaiementController] Search is null? " + (search == null) + ", Search is empty? " + (search != null && search.trim().isEmpty()));
            
            List<PaiementResponse> paiementsConfirmes = paiementService.getPaiementsByStatut(StatutPaiement.VALIDE);
            
            System.out.println("📋 [PaiementController] " + paiementsConfirmes.size() + " paiements confirmés trouvés");
            
            // Debug: Afficher les champs du premier paiement pour vérifier
            if (!paiementsConfirmes.isEmpty()) {
                PaiementResponse first = paiementsConfirmes.get(0);
                System.out.println("🔍 [DEBUG] Premier paiement:");
                System.out.println("   - EntrepriseNom: '" + first.getEntrepriseNom() + "'");
                System.out.println("   - EntrepriseReference: '" + first.getEntrepriseReference() + "'");
                System.out.println("   - GerantNom: '" + first.getGerantNom() + "'");
                System.out.println("   - GerantPrenom: '" + first.getGerantPrenom() + "'");
                System.out.println("   - PersonneNom (Agent): '" + first.getPersonneNom() + "'");
                System.out.println("   - PersonnePrenom (Agent): '" + first.getPersonnePrenom() + "'");
                System.out.println("   - ReferenceTransaction: '" + first.getReferenceTransaction() + "'");
                System.out.println("   - Description: '" + first.getDescription() + "'");
                System.out.println("   - TypePaiement: '" + first.getTypePaiement() + "'");
            }
            
            // Filtrer par recherche si fournie
            if (search != null && !search.trim().isEmpty()) {
                String searchLower = search.toLowerCase().trim();
                System.out.println("🔍 [PaiementController] Recherche avec: '" + searchLower + "'");
                
                paiementsConfirmes = paiementsConfirmes.stream()
                    .filter(p -> 
                        (p.getEntrepriseNom() != null && !p.getEntrepriseNom().equals("null") && p.getEntrepriseNom().toLowerCase().contains(searchLower)) ||
                        (p.getEntrepriseReference() != null && p.getEntrepriseReference().toLowerCase().contains(searchLower)) ||
                        (p.getGerantNom() != null && p.getGerantNom().toLowerCase().contains(searchLower)) ||
                        (p.getGerantPrenom() != null && p.getGerantPrenom().toLowerCase().contains(searchLower)) ||
                        (p.getReferenceTransaction() != null && p.getReferenceTransaction().toLowerCase().contains(searchLower)) ||
                        (p.getPersonneNom() != null && p.getPersonneNom().toLowerCase().contains(searchLower)) ||
                        (p.getPersonnePrenom() != null && p.getPersonnePrenom().toLowerCase().contains(searchLower)) ||
                        (p.getDescription() != null && p.getDescription().toLowerCase().contains(searchLower)) ||
                        (p.getTypePaiement() != null && p.getTypePaiement().toString().toLowerCase().contains(searchLower))
                    )
                    .collect(java.util.stream.Collectors.toList());
                System.out.println("✅ [PaiementController] Après filtrage: " + paiementsConfirmes.size() + " paiements trouvés");
            }
            
            // Calculer la pagination
            int totalElements = paiementsConfirmes.size();
            int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
            int fromIndex = page * size;
            int toIndex = Math.min(fromIndex + size, totalElements);
            
            System.out.println("📊 [PaiementController] Calcul pagination:");
            System.out.println("   - totalElements: " + totalElements);
            System.out.println("   - size: " + size);
            System.out.println("   - totalPages calculé: " + totalPages);
            System.out.println("   - fromIndex: " + fromIndex);
            System.out.println("   - toIndex: " + toIndex);
            
            // Extraire la page demandée
            List<PaiementResponse> pagedPaiements = fromIndex < totalElements 
                ? paiementsConfirmes.subList(fromIndex, toIndex)
                : java.util.Collections.emptyList();
            
            // Créer la réponse paginée
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("content", pagedPaiements);
            response.put("currentPage", page);
            response.put("totalElements", totalElements);
            response.put("totalPages", totalPages);
            response.put("size", size);
            response.put("hasNext", page < totalPages - 1);
            response.put("hasPrevious", page > 0);
            
            System.out.println("✅ [PaiementController] Réponse paginée:");
            System.out.println("   - Page actuelle: " + page);
            System.out.println("   - Total pages: " + totalPages);
            System.out.println("   - Éléments sur cette page: " + pagedPaiements.size());
            System.out.println("   - Total éléments: " + totalElements);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ [PaiementController] Erreur lors de la récupération des paiements confirmés: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse("Erreur lors de la récupération des paiements confirmés: " + e.getMessage()));
        }
    }

}
=======
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
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
