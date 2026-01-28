package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreementDocument;
import abdaty_technologie.API_Invest.dto.InvestmentAgreementRequest;
import abdaty_technologie.API_Invest.dto.InvestmentAgreementDocumentDto;
import abdaty_technologie.API_Invest.service.InvestmentAgreementService;
import abdaty_technologie.API_Invest.util.JwtUtil;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/investment-agreements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvestmentAgreementController {

    private final InvestmentAgreementService investmentAgreementService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UtilisateursRepository utilisateursRepository;

    /**
     * Récupérer toutes les demandes d'agrément d'investissement
     * GET /api/v1/investment-agreements
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllInvestmentAgreements() {
        try {
            List<InvestmentAgreement> agreements = investmentAgreementService.getAllInvestmentAgreements();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", agreements);
            response.put("total", agreements.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Erreur lors de la récupération des demandes: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la récupération des demandes");
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Soumettre une nouvelle demande d'agrément d'investissement
     * POST /api/v1/investment-agreements
     */
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> submitInvestmentAgreement(
            @RequestParam("data") String dataJson,
            @RequestPart(value = "demandeTimbree", required = false) MultipartFile demandeTimbree,
            @RequestPart(value = "etudeFaisabilite", required = false) MultipartFile etudeFaisabilite,
            @RequestPart(value = "statuts", required = false) MultipartFile statuts,
            @RequestPart(value = "autorisationExercice", required = false) MultipartFile autorisationExercice,
            @RequestPart(value = "autreDocument", required = false) MultipartFile autreDocument,
            HttpServletRequest httpRequest) {
        
        try {
            System.out.println("🔍 [DEBUG] Début soumission Investment Agreement");
            System.out.println("🔍 [DEBUG] Data JSON reçu: " + dataJson);
            System.out.println("🔍 [DEBUG] DemandeTimbree: " + (demandeTimbree != null ? demandeTimbree.getOriginalFilename() : "null"));
            System.out.println("🔍 [DEBUG] EtudeFaisabilite: " + (etudeFaisabilite != null ? etudeFaisabilite.getOriginalFilename() : "null"));
            System.out.println("🔍 [DEBUG] Statuts: " + (statuts != null ? statuts.getOriginalFilename() : "null"));
            System.out.println("🔍 [DEBUG] AutorisationExercice: " + (autorisationExercice != null ? autorisationExercice.getOriginalFilename() : "null"));
            System.out.println("🔍 [DEBUG] AutreDocument: " + (autreDocument != null ? autreDocument.getOriginalFilename() : "null"));
            
            // Parser le JSON manuellement
            ObjectMapper objectMapper = new ObjectMapper();
            InvestmentAgreementRequest request = objectMapper.readValue(dataJson, InvestmentAgreementRequest.class);
            System.out.println("🔍 [DEBUG] Request parsé: " + request);
            
            // Récupérer l'utilisateur authentifié depuis SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = getCurrentUserId(authentication);
            System.out.println("🔍 [DEBUG] UserId récupéré: " + userId);
            System.out.println("🔍 [DEBUG] Authentication: " + authentication);
            System.out.println("🔍 [DEBUG] Authentication name: " + (authentication != null ? authentication.getName() : "null"));
            
            // Créer une liste de tous les documents uploadés
            List<MultipartFile> allDocuments = new ArrayList<>();
            if (demandeTimbree != null) allDocuments.add(demandeTimbree);
            if (etudeFaisabilite != null) allDocuments.add(etudeFaisabilite);
            if (statuts != null) allDocuments.add(statuts);
            if (autorisationExercice != null) allDocuments.add(autorisationExercice);
            if (autreDocument != null) allDocuments.add(autreDocument);
            
            System.out.println("🔍 [DEBUG] Nombre total de documents: " + allDocuments.size());
            
            InvestmentAgreement agreement = investmentAgreementService.createInvestmentAgreement(request, userId, allDocuments);
            System.out.println("🔍 [DEBUG] Agreement créé avec succès: " + agreement.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande d'agrément soumise avec succès");
            response.put("data", Map.of(
                "id", agreement.getId(),
                "referenceNumber", agreement.getReferenceNumber(),
                "status", agreement.getStatut(),
                "regimeSollicite", agreement.getRegimeSollicite(),
                "dateCreation", agreement.getDateCreation()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Exception dans submitInvestmentAgreement: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la soumission de la demande");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer toutes les demandes d'agrément de l'utilisateur connecté
     * GET /api/v1/investment-agreements/my-requests
     */
    @GetMapping("/my-requests")
    public ResponseEntity<List<InvestmentAgreement>> getMyInvestmentAgreements(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<InvestmentAgreement> agreements = investmentAgreementService.getUserInvestmentAgreements(userId);
            return ResponseEntity.ok(agreements);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer une demande d'agrément spécifique
     * GET /api/v1/investment-agreements/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<InvestmentAgreement> getInvestmentAgreement(
            @PathVariable String id,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            InvestmentAgreement agreement = investmentAgreementService.getInvestmentAgreement(id, userId);
            return ResponseEntity.ok(agreement);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mettre à jour une demande d'agrément (avant soumission finale)
     * PUT /api/v1/investment-agreements/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateInvestmentAgreement(
            @PathVariable String id,
            @Valid @RequestBody InvestmentAgreementRequest request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            InvestmentAgreement agreement = investmentAgreementService.updateInvestmentAgreement(id, request, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande d'agrément mise à jour avec succès");
            response.put("data", agreement);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la mise à jour");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Supprimer une demande d'agrément (avant soumission finale)
     * DELETE /api/v1/investment-agreements/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteInvestmentAgreement(
            @PathVariable String id,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            investmentAgreementService.deleteInvestmentAgreement(id, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande d'agrément supprimée avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la suppression");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtenir les frais selon le régime
     * GET /api/v1/investment-agreements/fees/{regime}
     */
    @GetMapping("/fees/{regime}")
    public ResponseEntity<Map<String, Object>> getRegimeFees(@PathVariable String regime) {
        try {
            Map<String, Integer> fees = Map.of(
                "A", 350000,
                "B", 450000,
                "C", 550000,
                "D", 600000,
                "ZONES_ECONOMIQUES", 600000
            );
            
            Integer amount = fees.get(regime.toUpperCase());
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Régime invalide"));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("regime", regime);
            response.put("amount", amount);
            response.put("currency", "FCFA");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la récupération des frais"));
        }
    }

    /**
     * Récupérer les documents d'une demande d'investissement
     * GET /api/v1/investment-agreements/{id}/documents
     */
    @GetMapping("/{id}/documents")
    public ResponseEntity<Map<String, Object>> getInvestmentAgreementDocuments(@PathVariable String id) {
        try {
            System.out.println("🔍 [DEBUG] Récupération des documents pour la demande: " + id);
            
            List<InvestmentAgreementDocumentDto> documents = investmentAgreementService.getDocumentsByAgreementId(id);
            System.out.println("🔍 [DEBUG] Nombre de documents trouvés: " + documents.size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", documents);
            response.put("total", documents.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Erreur lors de la récupération des documents: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la récupération des documents");
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Télécharger un document d'une demande d'investissement
     * GET /api/v1/investment-agreements/{id}/documents/{documentId}/download
     */
    @GetMapping("/{id}/documents/{documentId}/download")
    public ResponseEntity<byte[]> downloadInvestmentAgreementDocument(
            @PathVariable String id, 
            @PathVariable String documentId) {
        try {
            System.out.println("🔍 [DEBUG] Téléchargement document - Agreement ID: " + id + ", Document ID: " + documentId);
            
            byte[] documentData = investmentAgreementService.downloadDocument(id, documentId);
            InvestmentAgreementDocumentDto documentInfo = investmentAgreementService.getDocumentInfo(documentId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(documentInfo.getContentType()));
            headers.setContentDisposition(ContentDisposition.inline().filename(documentInfo.getOriginalFilename()).build());
            headers.setContentLength(documentData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(documentData);
                    
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Erreur lors du téléchargement du document: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Récupère l'ID de l'utilisateur connecté depuis l'authentification.
     */
    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            System.out.println("⚠️ [WARNING] Utilisateur non authentifié, utilisation de 'anonymous' pour les tests");
            return "anonymous";
        }
        
        String email = authentication.getName();
        System.out.println("🔍 [DEBUG] Email extrait de l'authentification: " + email);
        
        // Récupérer le personne_id depuis la table utilisateurs
        try {
            return utilisateursRepository.findByUtilisateur(email)
                .map(user -> {
                    String personneId = user.getPersonne() != null ? user.getPersonne().getId() : null;
                    System.out.println("🔍 [DEBUG] Utilisateur trouvé: " + user.getUtilisateur() + " (personne_id: " + personneId + ")");
                    return personneId != null ? personneId : "anonymous";
                })
                .orElseGet(() -> {
                    System.out.println("⚠️ [WARNING] Aucun utilisateur trouvé pour l'email: " + email + ", utilisation de 'anonymous'");
                    return "anonymous";
                });
        } catch (Exception e) {
            System.err.println("⚠️ [ERROR] Erreur lors de la récupération du personne_id: " + e.getMessage() + ", utilisation de 'anonymous'");
            return "anonymous";
        }
    }
}
