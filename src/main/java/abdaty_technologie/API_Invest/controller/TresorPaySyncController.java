<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.service.TresorPaySyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur pour la synchronisation manuelle des paiements TresorPay
 */
@RestController
@RequestMapping("/payments/sync")
@Tag(name = "TresorPay Sync", description = "API de synchronisation des paiements TresorPay")
public class TresorPaySyncController {
    
    @Autowired
    private TresorPaySyncService tresorPaySyncService;
    
    /**
     * Synchronise manuellement tous les paiements en attente
     */
    @PostMapping("/all")
    @Operation(summary = "Synchronise tous les paiements en attente")
    public ResponseEntity<Map<String, String>> syncAllPayments() {
        Map<String, String> response = new HashMap<>();
        
        try {
            System.out.println("🚀 [Manual Sync] Déclenchement de la synchronisation manuelle");
            tresorPaySyncService.syncPendingPayments();
            
            response.put("status", "success");
            response.put("message", "Synchronisation déclenchée avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [Manual Sync] Erreur: " + e.getMessage());
            
            response.put("status", "error");
            response.put("message", "Erreur lors de la synchronisation: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Synchronise manuellement un paiement spécifique par référence
     */
    @PostMapping("/{reference}")
    @Operation(summary = "Synchronise un paiement spécifique par référence TresorPay")
    public ResponseEntity<Map<String, String>> syncPaymentByReference(@PathVariable String reference) {
        Map<String, String> response = new HashMap<>();
        
        try {
            System.out.println("🎯 [Manual Sync] Synchronisation du paiement: " + reference);
            
            boolean success = tresorPaySyncService.syncPaymentByReference(reference);
            
            if (success) {
                response.put("status", "success");
                response.put("message", "Paiement " + reference + " synchronisé avec succès");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "not_found");
                response.put("message", "Paiement " + reference + " non trouvé");
                return ResponseEntity.status(404).body(response);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [Manual Sync] Erreur: " + e.getMessage());
            
            response.put("status", "error");
            response.put("message", "Erreur lors de la synchronisation: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.service.TresorPaySyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur pour la synchronisation manuelle des paiements TresorPay
 */
@RestController
@RequestMapping("/payments/sync")
@Tag(name = "TresorPay Sync", description = "API de synchronisation des paiements TresorPay")
public class TresorPaySyncController {
    
    @Autowired
    private TresorPaySyncService tresorPaySyncService;
    
    /**
     * Synchronise manuellement tous les paiements en attente
     */
    @PostMapping("/all")
    @Operation(summary = "Synchronise tous les paiements en attente")
    public ResponseEntity<Map<String, String>> syncAllPayments() {
        Map<String, String> response = new HashMap<>();
        
        try {
            System.out.println("🚀 [Manual Sync] Déclenchement de la synchronisation manuelle");
            tresorPaySyncService.syncPendingPayments();
            
            response.put("status", "success");
            response.put("message", "Synchronisation déclenchée avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [Manual Sync] Erreur: " + e.getMessage());
            
            response.put("status", "error");
            response.put("message", "Erreur lors de la synchronisation: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Synchronise manuellement un paiement spécifique par référence
     */
    @PostMapping("/{reference}")
    @Operation(summary = "Synchronise un paiement spécifique par référence TresorPay")
    public ResponseEntity<Map<String, String>> syncPaymentByReference(@PathVariable String reference) {
        Map<String, String> response = new HashMap<>();
        
        try {
            System.out.println("🎯 [Manual Sync] Synchronisation du paiement: " + reference);
            
            boolean success = tresorPaySyncService.syncPaymentByReference(reference);
            
            if (success) {
                response.put("status", "success");
                response.put("message", "Paiement " + reference + " synchronisé avec succès");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "not_found");
                response.put("message", "Paiement " + reference + " non trouvé");
                return ResponseEntity.status(404).body(response);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [Manual Sync] Erreur: " + e.getMessage());
            
            response.put("status", "error");
            response.put("message", "Erreur lors de la synchronisation: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
