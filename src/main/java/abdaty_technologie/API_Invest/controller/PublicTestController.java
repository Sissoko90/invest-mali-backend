package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.orangemoney.v2.service.OrangeMoneyServiceV2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur de test public (sans sécurité)
 */
@RestController
@RequestMapping("/public/test")
@CrossOrigin(origins = "*")
public class PublicTestController {
    
    private static final Logger logger = LoggerFactory.getLogger(PublicTestController.class);
    
    @Autowired
    private OrangeMoneyServiceV2 orangeMoneyServiceV2;
    
    /**
     * Test ping public
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        logger.info("🏓 [PublicTest] Ping public reçu");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Public Test Controller is working");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test Orange Money complet public
     */
    @PostMapping("/orange-money")
    public ResponseEntity<Map<String, Object>> testOrangeMoney(@RequestBody Map<String, Object> request) {
        logger.info("💳 [PublicTest] Test Orange Money public");
        
        try {
            Object amountObj = request.get("amount");
            Integer amount = 1000; // Défaut
            
            if (amountObj instanceof Integer) {
                amount = (Integer) amountObj;
            } else if (amountObj instanceof Double) {
                amount = ((Double) amountObj).intValue();
            }
            
            // Générer un order_id simple
            String orderId = "PUBLIC-TEST-" + System.currentTimeMillis();
            String reference = "PUBLIC-REF-" + orderId;
            
            logger.info("💳 [PublicTest] Test avec amount: {}, orderId: {}", amount, orderId);
            
            // Tester l'appel Orange Money
            var omResponse = orangeMoneyServiceV2.createWebPayment(orderId, amount, reference);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", omResponse != null && omResponse.isSuccess());
            response.put("order_id", orderId);
            response.put("amount", amount);
            response.put("reference", reference);
            
            if (omResponse != null) {
                response.put("om_success", omResponse.isSuccess());
                response.put("om_status", omResponse.getStatus());
                response.put("om_message", omResponse.getMessage());
                response.put("payment_url", omResponse.getPaymentUrl());
                response.put("pay_token", omResponse.getPayToken());
                response.put("notif_token", omResponse.getNotifToken());
            } else {
                response.put("om_response", "null");
                response.put("error", "createWebPayment returned null");
            }
            
            logger.info("✅ [PublicTest] Test Orange Money terminé");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [PublicTest] Erreur test Orange Money: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            
            if (e.getCause() != null) {
                response.put("cause", e.getCause().getMessage());
            }
            
            return ResponseEntity.ok(response);
        }
    }
}
