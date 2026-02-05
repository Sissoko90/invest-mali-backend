package abdaty_technologie.API_Invest.orangemoney.v2.controller;

import abdaty_technologie.API_Invest.orangemoney.v2.service.OrangeMoneyServiceV2;
import abdaty_technologie.API_Invest.service.OrderCounterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller de test simple pour Orange Money V2 (SANS authentification)
 * Pour diagnostiquer les problèmes de configuration
 */
@RestController
@RequestMapping("/orange-money/v2/test")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class OrangeMoneyTestController {
    
    private static final Logger logger = LoggerFactory.getLogger(OrangeMoneyTestController.class);
    
    @Autowired
    private OrangeMoneyServiceV2 orangeMoneyServiceV2;
    
    @Autowired
    private OrderCounterService orderCounterService;
    
    // Configuration injectée pour vérification
    @Value("${orange-money.v2.client.id}")
    private String clientId;
    
    @Value("${orange-money.v2.client.secret}")
    private String clientSecret;
    
    @Value("${orange-money.v2.merchant.key}")
    private String merchantKey;
    
    @Value("${orange-money.v2.api.oauth-url}")
    private String oauthUrl;
    
    @Value("${orange-money.v2.api.webpay-url}")
    private String webpayUrl;
    
    /**
     * Test simple de connectivité (SANS authentification)
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        logger.info("🏓 [OrangeMoneyTest] Ping reçu");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Orange Money V2 Test Controller is working");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Vérifier la configuration (SANS authentification)
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> checkConfig() {
        logger.info("🔧 [OrangeMoneyTest] Vérification de la configuration");
        
        Map<String, Object> config = new HashMap<>();
        config.put("client_id", clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "NULL");
        config.put("client_secret_exists", clientSecret != null && !clientSecret.trim().isEmpty());
        config.put("merchant_key", merchantKey != null ? merchantKey : "NULL");
        config.put("oauth_url", oauthUrl != null ? oauthUrl : "NULL");
        config.put("webpay_url", webpayUrl != null ? webpayUrl : "NULL");
        
        logger.info(" [OrangeMoneyTest] Configuration: {}", config);
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * Tester l'obtention du token OAuth2 avec détails (SANS authentification)
     */
    @GetMapping("/oauth-detailed")
    public ResponseEntity<Map<String, Object>> testOAuthDetailed() {
        logger.info(" [OrangeMoneyTest] Test OAuth2 détaillé");
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Vérifier la configuration
            response.put("client_id", clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "null");
            response.put("client_secret", clientSecret != null ? "***" + clientSecret.substring(Math.max(0, clientSecret.length()-4)) : "null");
            response.put("oauth_url", oauthUrl);
            
            // Tester l'obtention du token
            String token = orangeMoneyServiceV2.getAccessToken();
            
            response.put("success", token != null);
            response.put("token_obtained", token != null);
            
            if (token != null) {
                response.put("token_preview", token.substring(0, Math.min(20, token.length())) + "...");
                response.put("token_length", token.length());
            } else {
                response.put("error", "Token is null");
            }
            
            logger.info(" [OrangeMoneyTest] Test OAuth2 détaillé terminé");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error(" [OrangeMoneyTest] Erreur test OAuth2: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Tester l'obtention du token OAuth2 (SANS authentification)
     */
    @GetMapping("/oauth")
    public ResponseEntity<Map<String, Object>> testOAuth() {
        logger.info(" [OrangeMoneyTest] Test OAuth2 uniquement");
        
        try {
            String token = orangeMoneyServiceV2.getAccessToken();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", token != null);
            response.put("has_token", token != null);
            
            if (token != null) {
                response.put("token_preview", token.substring(0, Math.min(20, token.length())) + "...");
                response.put("token_length", token.length());
            }
            
            logger.info("✅ [OrangeMoneyTest] OAuth test result: {}", response);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyTest] Erreur OAuth: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Tester la génération d'order_id incrémenté
     */
    @GetMapping("/order-id")
    public ResponseEntity<Map<String, Object>> testOrderIdGeneration() {
        logger.info("🔢 [OrangeMoneyTest] Test génération order_id");
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Générer plusieurs order_id pour voir l'incrémentation
            for (int i = 1; i <= 5; i++) {
                String orderId = orangeMoneyServiceV2.generateOrderId("test-entreprise");
                response.put("order_id_" + i, orderId);
            }
            
            // Ajouter la valeur actuelle du compteur
            Long currentValue = orderCounterService.getCurrentCounterValue("ORANGE_MONEY_V2");
            response.put("current_counter_value", currentValue);
            response.put("success", true);
            
            logger.info("✅ [OrangeMoneyTest] Order IDs générés avec succès");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyTest] Erreur génération order_id: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Tester le paiement complet comme le frontend (SANS authentification)
     */
    @PostMapping("/payment-full")
    public ResponseEntity<Map<String, Object>> testFullPayment(@RequestBody Map<String, Object> request) {
        logger.info("💳 [OrangeMoneyTest] Test paiement complet (comme frontend)");
        
        try {
            String entrepriseId = (String) request.get("entrepriseId");
            Object amountObj = request.get("amount");
            
            if (entrepriseId == null || amountObj == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Données manquantes: entrepriseId et amount requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Convertir le montant
            Integer amount;
            if (amountObj instanceof Integer) {
                amount = (Integer) amountObj;
            } else if (amountObj instanceof Double) {
                amount = ((Double) amountObj).intValue();
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Format de montant invalide");
                return ResponseEntity.badRequest().body(response);
            }
            
            logger.info("💳 [OrangeMoneyTest] Test avec entrepriseId: {}, amount: {}", entrepriseId, amount);
            
            // Générer un order_id
            String orderId = orangeMoneyServiceV2.generateOrderId(entrepriseId);
            String reference = "TEST-API-INVEST-V2-" + entrepriseId;
            
            logger.info("💳 [OrangeMoneyTest] OrderID généré: {}, Reference: {}", orderId, reference);
            
            // Tester l'appel Orange Money directement
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
            }
            
            logger.info("✅ [OrangeMoneyTest] Test paiement terminé");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyTest] Erreur test paiement: {}", e.getMessage(), e);
            
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
    
    /**
     * Tester la création d'un webpayment simple (SANS authentification)
     */
    @PostMapping("/webpay")
    public ResponseEntity<Map<String, Object>> testWebPayment(@RequestBody Map<String, Object> request) {
        logger.info("💳 [OrangeMoneyTest] Test webpayment");
        
        try {
            Integer amount = (Integer) request.get("amount");
            if (amount == null) {
                amount = 1000; // Montant par défaut pour test
            }
            
            String orderId = "TEST-" + System.currentTimeMillis();
            String reference = "TEST-REF-" + orderId;
            
            logger.info("💳 [OrangeMoneyTest] Test avec montant: {}, orderId: {}", amount, orderId);
            
            var webPaymentResponse = orangeMoneyServiceV2.createWebPayment(orderId, amount, reference);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", webPaymentResponse != null && webPaymentResponse.isSuccess());
            response.put("order_id", orderId);
            response.put("amount", amount);
            
            if (webPaymentResponse != null) {
                response.put("status", webPaymentResponse.getStatus());
                response.put("message", webPaymentResponse.getMessage());
                response.put("has_payment_url", webPaymentResponse.getPaymentUrl() != null);
                response.put("has_pay_token", webPaymentResponse.getPayToken() != null);
            }
            
            logger.info("📋 [OrangeMoneyTest] Webpayment test result: {}", response);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyTest] Erreur webpayment: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            
            return ResponseEntity.ok(response);
        }
    }
}
