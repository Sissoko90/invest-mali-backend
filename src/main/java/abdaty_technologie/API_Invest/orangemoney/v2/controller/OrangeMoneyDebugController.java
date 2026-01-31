package abdaty_technologie.API_Invest.orangemoney.v2.controller;

import abdaty_technologie.API_Invest.orangemoney.v2.service.OrangeMoneyServiceV2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller de debug pour Orange Money V2
 * Permet de vérifier la configuration et tester les composants
 */
@RestController
@RequestMapping("/orange-money/v2/debug")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class OrangeMoneyDebugController {
    
    private static final Logger logger = LoggerFactory.getLogger(OrangeMoneyDebugController.class);
    
    @Autowired
    private OrangeMoneyServiceV2 orangeMoneyServiceV2;
    
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
     * Endpoint pour vérifier la configuration Orange Money V2
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> checkConfig() {
        logger.info("🔧 [OrangeMoneyDebug] Vérification de la configuration");
        
        Map<String, Object> config = new HashMap<>();
        config.put("client_id", clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "NULL");
        config.put("client_secret", clientSecret != null ? "***" + clientSecret.substring(Math.max(0, clientSecret.length() - 4)) : "NULL");
        config.put("merchant_key", merchantKey != null ? merchantKey : "NULL");
        config.put("oauth_url", oauthUrl != null ? oauthUrl : "NULL");
        config.put("webpay_url", webpayUrl != null ? webpayUrl : "NULL");
        
        logger.info("📋 [OrangeMoneyDebug] Configuration: {}", config);
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * Endpoint pour tester uniquement l'obtention du token OAuth2
     */
    @GetMapping("/test-oauth")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> testOAuth() {
        logger.info("🔑 [OrangeMoneyDebug] Test OAuth2 uniquement");
        
        try {
            String token = orangeMoneyServiceV2.getAccessToken();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", token != null);
            response.put("has_token", token != null);
            
            if (token != null) {
                response.put("token_preview", token.substring(0, Math.min(20, token.length())) + "...");
                response.put("token_length", token.length());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyDebug] Erreur OAuth: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Endpoint pour tester la génération d'order ID
     */
    @GetMapping("/test-order-id")
    public ResponseEntity<Map<String, Object>> testOrderId() {
        logger.info("[OrangeMoneyDebug] Test génération Order ID");
        
        String orderId = orangeMoneyServiceV2.generateOrderId("test-entreprise");
        
        Map<String, Object> response = new HashMap<>();
        response.put("order_id", orderId);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}
