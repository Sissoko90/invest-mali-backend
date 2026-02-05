package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.NinaResponse;
import abdaty_technologie.API_Invest.service.NinaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/nina")
public class NinaController {

    private static final Logger log = LoggerFactory.getLogger(NinaController.class);
    private final NinaService ninaService;
    
    public NinaController(NinaService ninaService) {
        this.ninaService = ninaService;
    }

    /**
     * Génère un numéro NINA pour une entreprise
     * @param entrepriseId L'ID de l'entreprise
     * @param rccm Le numéro RCCM (obligatoire)
     * @return La réponse contenant le numéro NINA généré
     */
    @GetMapping("/certificate/{entrepriseId}")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<byte[]> generateCertificate(@PathVariable String entrepriseId) {
        
        log.info("📄 [NinaController] Demande de génération certificat NINA pour entreprise: {}", entrepriseId);
        
        try {
            // Générer le certificat PDF
            byte[] pdfBytes = ninaService.generateCertificatePdf(entrepriseId);
            
            // Configurer les headers pour le téléchargement PDF
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename("Certificat_NINA_" + entrepriseId + ".pdf")
                .build());
            headers.setContentLength(pdfBytes.length);
            
            log.info("✅ [NinaController] Certificat NINA généré avec succès, taille: {} bytes", pdfBytes.length);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
                
        } catch (Exception e) {
            log.error("❌ [NinaController] Erreur lors de la génération du certificat: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate/{entrepriseId}")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<NinaResponse> generateNina(
            @PathVariable String entrepriseId,
            @RequestParam String rccm) {
        
        log.info("🔄 [NinaController] Demande de génération NINA pour entreprise: {} avec RCCM: {}", 
            entrepriseId, rccm);
        log.info("📋 [NinaController] RCCM reçu comme paramètre: {}", rccm);
        
        try {
            // Validation des paramètres
            if (rccm == null || rccm.trim().isEmpty()) {
                log.error("❌ [NinaController] Numéro RCCM manquant");
                return ResponseEntity.badRequest().build();
            }
            
            // Génération du NINA
            NinaResponse response = ninaService.generateNina(entrepriseId, rccm.trim());
            
            if (response != null && response.getStatus() != null && "success".equals(response.getStatus())) {
                log.info("✅ [NinaController] NINA généré avec succès: {}", 
                    response.getRes() != null ? response.getRes().getNina() : "N/A");
                return ResponseEntity.ok(response);
            } else {
                log.error("❌ [NinaController] Échec de la génération NINA: {}", response);
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("❌ [NinaController] Erreur lors de la génération NINA: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Test simple du contrôleur NINA
     */
    @GetMapping("/test")
    public ResponseEntity<String> testNina() {
        log.info("🧪 [NinaController] Test du contrôleur NINA");
        return ResponseEntity.ok("Contrôleur NINA fonctionnel");
    }

    /**
     * Test ultra simple - juste retourner une chaîne
     */
    @GetMapping("/ping")
    public String ping() {
        return "PONG - NinaController fonctionne";
    }

    /**
     * Test encore plus simple - sans logs
     */
    @GetMapping("/simple")
    public String simple() {
        return "OK";
    }
    
    
    /**
     * Endpoint pour tester la vérification d'unicité RCCM
     */
    @GetMapping("/test-rccm/{rccm}")
    public ResponseEntity<Map<String, Object>> testRccm(@PathVariable String rccm) {
        log.info("🧪 [NinaController] Test unicité RCCM: {}", rccm);
        
        Map<String, Object> response = new HashMap<>();
        response.put("rccm", rccm);
        
        try {
            // Simuler la vérification (vous pouvez appeler directement la méthode du service)
            List<String> rccmDejaUtilises = List.of(
                "ML-BKO-01-2025-A-00004",
                "ML-BKO-01-2025-A-00005",
                "ML-BKO-01-2025-A-00001",
                "ML-BKO-01-2025-A-00002"
            );
            
            boolean dejaUtilise = rccmDejaUtilises.contains(rccm);
            
            response.put("dejaUtilise", dejaUtilise);
            response.put("status", dejaUtilise ? "error" : "success");
            response.put("message", dejaUtilise ? 
                "RCCM déjà utilisé dans l'API INSTAT" : 
                "RCCM disponible");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [NinaController] Erreur test RCCM: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Test sans sécurité pour diagnostiquer le problème d'authentification
     */
    @PostMapping("/test-no-auth/{entrepriseId}")
    public ResponseEntity<String> testNoAuth(
            @PathVariable String entrepriseId,
            @RequestParam String rccm) {
        
        log.info("🧪 [NinaController] Test SANS sécurité - Entreprise: {}, RCCM: {}", entrepriseId, rccm);
        
        try {
            String testResponse = "Test NINA SANS AUTH pour entreprise " + entrepriseId + " avec RCCM " + rccm;
            log.info("✅ [NinaController] Test sans auth réussi: {}", testResponse);
            return ResponseEntity.ok(testResponse);
            
        } catch (Exception e) {
            log.error("❌ [NinaController] Erreur dans le test sans auth: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Test de génération NINA sans appel au service
     */
    @PostMapping("/test-generate/{entrepriseId}")
    public ResponseEntity<String> testGenerateNina(
            @PathVariable String entrepriseId,
            @RequestParam String rccm) {
        
        log.info("🧪 [NinaController] Test génération NINA - Entreprise: {}, RCCM: {}", entrepriseId, rccm);
        
        try {
            // Test simple sans appel au service
            String testResponse = "Test NINA généré pour entreprise " + entrepriseId + " avec RCCM " + rccm;
            log.info("✅ [NinaController] Test réussi: {}", testResponse);
            return ResponseEntity.ok(testResponse);
            
        } catch (Exception e) {
            log.error("❌ [NinaController] Erreur dans le test: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Récupère le numéro NINA d'une entreprise s'il existe
     * @param entrepriseId L'ID de l'entreprise
     * @return Le numéro NINA ou null
     */
    @GetMapping("/entreprise/{entrepriseId}")
    public ResponseEntity<String> getNinaByEntreprise(@PathVariable String entrepriseId) {
        
        log.info("🔍 [NinaController] Recherche NINA pour entreprise: {}", entrepriseId);
        
        try {
            // Récupérer l'entreprise et son numéro NINA
            // Cette logique pourrait être dans le service
            return ResponseEntity.ok("Fonctionnalité à implémenter");
            
        } catch (Exception e) {
            log.error("❌ [NinaController] Erreur lors de la recherche NINA: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
