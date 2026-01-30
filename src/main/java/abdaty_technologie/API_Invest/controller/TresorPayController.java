<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.service.TresorPayService;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayStatusResponse;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Contrôleur spécifique pour TresorPay
 */
@RestController
@RequestMapping("/tresorpay")
@Tag(name = "TresorPay", description = "API spécifique pour TresorPay")
public class TresorPayController {
    
    @Autowired
    private TresorPayService tresorPayService;
    
    /**
     * Vérifie le statut d'un avis TresorPay
     */
    @GetMapping("/status/{reference}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Vérifie le statut d'un avis TresorPay")
    public ResponseEntity<TresorPayStatusResponse> getNoticeStatus(@PathVariable String reference) {
        System.out.println("🔍 Vérification statut TresorPay: " + reference);
        
        TresorPayStatusResponse status = tresorPayService.getNoticeStatus(reference);
        return ResponseEntity.ok(status);
    }
    
    /**
     * Vérifie le statut de plusieurs avis TresorPay
     */
    @PostMapping("/status/multiple")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Vérifie le statut de plusieurs avis TresorPay")
    public ResponseEntity<List<TresorPayStatusResponse>> getMultipleNoticeStatus(@RequestBody List<String> references) {
        System.out.println("🔍 Vérification statut multiple TresorPay: " + references.size() + " références");
        
        List<TresorPayStatusResponse> statuses = tresorPayService.getMultipleNoticeStatus(references);
        return ResponseEntity.ok(statuses);
    }
    
    /**
     * Annule un avis TresorPay
     */
    @PostMapping("/cancel/{referenceClient}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Annule un avis TresorPay")
    public ResponseEntity<TresorPayNoticeResponse> cancelNotice(@PathVariable String referenceClient) {
        System.out.println("❌ Annulation avis TresorPay: " + referenceClient);
        
        TresorPayNoticeResponse response = tresorPayService.cancelNotice(referenceClient);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Génère l'URL de paiement TresorPay
     */
    @GetMapping("/payment-url/{reference}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Génère l'URL de paiement TresorPay")
    public ResponseEntity<Map<String, String>> getPaymentUrl(@PathVariable String reference) {
        try {
            String paymentUrl = tresorPayService.generatePaymentUrl(reference);
            
            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            response.put("reference", reference);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la génération de l'URL de paiement");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Vérifier et marquer un avis comme livré (Étape 7 - OBLIGATOIRE après paiement)
     */
    @PostMapping("/verify/{tresorPayReference}")
    public ResponseEntity<TresorPayNoticeResponse> verifyNotice(@PathVariable String tresorPayReference) {
        try {
            TresorPayNoticeResponse response = tresorPayService.verifyNotice(tresorPayReference);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new TresorPayNoticeResponse(tresorPayReference, "ERROR"));
        }
    }
    
    /**
     * Télécharger le reçu PDF d'un paiement (Étape 8)
     */
    @GetMapping("/receipt/download/{tresorPayReference}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String tresorPayReference) {
        try {
            byte[] pdfContent = tresorPayService.downloadReceipt(tresorPayReference);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("receipt_" + tresorPayReference + ".pdf")
                    .build());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfContent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Endpoint de test pour vérifier la connectivité TresorPay
     */
    @GetMapping("/test-connection")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Test de connectivité TresorPay")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Tenter d'obtenir un token pour tester la connectivité
            // Cette méthode est privée dans TresorPayService, donc on va créer un avis de test
            System.out.println(" Test de connectivité TresorPay...");
            
            response.put("status", "success");
            response.put("message", "Connectivité TresorPay OK");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erreur test connectivité TresorPay: " + e.getMessage());
            
            response.put("status", "error");
            response.put("message", "Erreur de connectivité TresorPay: " + e.getMessage());
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.service.TresorPayService;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayStatusResponse;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Contrôleur spécifique pour TresorPay
 */
@RestController
@RequestMapping("/tresorpay")
@Tag(name = "TresorPay", description = "API spécifique pour TresorPay")
public class TresorPayController {
    
    @Autowired
    private TresorPayService tresorPayService;
    
    /**
     * Vérifie le statut d'un avis TresorPay
     */
    @GetMapping("/status/{reference}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Vérifie le statut d'un avis TresorPay")
    public ResponseEntity<TresorPayStatusResponse> getNoticeStatus(@PathVariable String reference) {
        System.out.println("🔍 Vérification statut TresorPay: " + reference);
        
        TresorPayStatusResponse status = tresorPayService.getNoticeStatus(reference);
        return ResponseEntity.ok(status);
    }
    
    /**
     * Vérifie le statut de plusieurs avis TresorPay
     */
    @PostMapping("/status/multiple")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Vérifie le statut de plusieurs avis TresorPay")
    public ResponseEntity<List<TresorPayStatusResponse>> getMultipleNoticeStatus(@RequestBody List<String> references) {
        System.out.println("🔍 Vérification statut multiple TresorPay: " + references.size() + " références");
        
        List<TresorPayStatusResponse> statuses = tresorPayService.getMultipleNoticeStatus(references);
        return ResponseEntity.ok(statuses);
    }
    
    /**
     * Annule un avis TresorPay
     */
    @PostMapping("/cancel/{referenceClient}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Annule un avis TresorPay")
    public ResponseEntity<TresorPayNoticeResponse> cancelNotice(@PathVariable String referenceClient) {
        System.out.println("❌ Annulation avis TresorPay: " + referenceClient);
        
        TresorPayNoticeResponse response = tresorPayService.cancelNotice(referenceClient);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Génère l'URL de paiement TresorPay
     */
    @GetMapping("/payment-url/{reference}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Génère l'URL de paiement TresorPay")
    public ResponseEntity<Map<String, String>> getPaymentUrl(@PathVariable String reference) {
        try {
            String paymentUrl = tresorPayService.generatePaymentUrl(reference);
            
            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            response.put("reference", reference);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la génération de l'URL de paiement");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Vérifier et marquer un avis comme livré (Étape 7 - OBLIGATOIRE après paiement)
     */
    @PostMapping("/verify/{tresorPayReference}")
    public ResponseEntity<TresorPayNoticeResponse> verifyNotice(@PathVariable String tresorPayReference) {
        try {
            TresorPayNoticeResponse response = tresorPayService.verifyNotice(tresorPayReference);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new TresorPayNoticeResponse(tresorPayReference, "ERROR"));
        }
    }
    
    /**
     * Télécharger le reçu PDF d'un paiement (Étape 8)
     */
    @GetMapping("/receipt/download/{tresorPayReference}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String tresorPayReference) {
        try {
            byte[] pdfContent = tresorPayService.downloadReceipt(tresorPayReference);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("receipt_" + tresorPayReference + ".pdf")
                    .build());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfContent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Endpoint de test pour vérifier la connectivité TresorPay
     */
    @GetMapping("/test-connection")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Test de connectivité TresorPay")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Tenter d'obtenir un token pour tester la connectivité
            // Cette méthode est privée dans TresorPayService, donc on va créer un avis de test
            System.out.println(" Test de connectivité TresorPay...");
            
            response.put("status", "success");
            response.put("message", "Connectivité TresorPay OK");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erreur test connectivité TresorPay: " + e.getMessage());
            
            response.put("status", "error");
            response.put("message", "Erreur de connectivité TresorPay: " + e.getMessage());
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
