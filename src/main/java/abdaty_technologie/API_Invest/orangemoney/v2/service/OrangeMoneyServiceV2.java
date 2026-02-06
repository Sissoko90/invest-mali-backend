package abdaty_technologie.API_Invest.orangemoney.v2.service;

import abdaty_technologie.API_Invest.orangemoney.v2.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import abdaty_technologie.API_Invest.service.OrderCounterService;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Service Orange Money V2 - Version propre avec HttpURLConnection
 */
@Service
public class OrangeMoneyServiceV2 {
    
    private static final Logger logger = LoggerFactory.getLogger(OrangeMoneyServiceV2.class);
    
    @Autowired
    private OrderCounterService orderCounterService;
    
    // Configuration injectée depuis application.yml
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
    
    @Value("${orange-money.v2.urls.return-url}")
    private String returnUrl;
    
    @Value("${orange-money.v2.urls.cancel-url}")
    private String cancelUrl;
    
    @Value("${orange-money.v2.urls.notif-url}")
    private String notifUrl;
    
    // Cache du token d'accès
    private String currentAccessToken = null;
    private LocalDateTime tokenExpiryTime = null;
    
    /**
     * Vérifie si le token actuel est encore valide
     */
    private boolean isTokenValid() {
        return currentAccessToken != null && 
               tokenExpiryTime != null && 
               LocalDateTime.now().isBefore(tokenExpiryTime);
    }
    
    /**
     * Obtenir le token d'accès OAuth2 avec HttpURLConnection
     */
    public String getAccessToken() {
        // Vérifier si le token en cache est encore valide
        if (isTokenValid()) {
            logger.debug("🔑 [OrangeMoneyV2] Utilisation du token en cache");
            return currentAccessToken;
        }
        
        logger.info("🔑 [OrangeMoneyV2] Demande d'un nouveau token d'accès OAuth2");
        
        try {
            URL url = new URL(oauthUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            
            // Headers
            String credentials = clientId + ":" + clientSecret;
            String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Basic " + encodedCredentials);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            
            // Body
            String body = "grant_type=client_credentials";
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = body.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Réponse
            int responseCode = conn.getResponseCode();
            logger.info("🔑 [OrangeMoneyV2] OAuth Response Code: {}", responseCode);
            
            if (responseCode == 200) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    
                    String responseBody = response.toString();
                    logger.info("🔑 [OrangeMoneyV2] OAuth Response: {}", responseBody);
                    
                    // Parser le JSON simple (chercher access_token)
                    if (responseBody.contains("\"access_token\"")) {
                        int start = responseBody.indexOf("\"access_token\": \"") + 17;
                        if (start == 16) { // Si pas d'espace après :
                            start = responseBody.indexOf("\"access_token\":\"") + 16;
                        }
                        int end = responseBody.indexOf("\"", start);
                        if (start > 0 && end > start) {
                            String token = responseBody.substring(start, end);
                            
                            // Mettre en cache le token
                            this.currentAccessToken = token;
                            this.tokenExpiryTime = LocalDateTime.now().plusSeconds(3600 - 300); // 1h - 5min de marge
                            
                            logger.info("✅ [OrangeMoneyV2] Token obtenu: {}... (length: {})", 
                                       token.substring(0, Math.min(20, token.length())), token.length());
                            return token;
                        } else {
                            logger.error("❌ [OrangeMoneyV2] Impossible d'extraire le token du JSON: {}", responseBody);
                        }
                    } else {
                        logger.error("❌ [OrangeMoneyV2] access_token non trouvé dans: {}", responseBody);
                    }
                }
            } else {
                logger.error("❌ [OrangeMoneyV2] OAuth failed: {}", responseCode);
            }
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] OAuth Exception: {}", e.getMessage(), e);
        }
        
        return null;
    }
    
    /**
     * Créer le webpayment avec HttpURLConnection
     */
    public WebPaymentResponse createWebPayment(String orderId, Integer amount, String reference) {
        logger.info("💳 [OrangeMoneyV2] Création webpayment - OrderID: {}, Montant: {} OUV", orderId, amount);
        
        // Obtenir le token d'accès
        String token = getAccessToken();
        if (token == null) {
            logger.error("❌ [OrangeMoneyV2] Impossible d'obtenir le token d'accès");
            return null;
        }
        
        try {
            URL url = new URL(webpayUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            
            // Headers
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            
            // JSON Body
            String jsonBody = "{\n" +
                "\"merchant_key\": \"" + merchantKey + "\",\n" +
                "\"currency\": \"OUV\",\n" +
                "\"order_id\": \"" + orderId + "\",\n" +
                "\"amount\": " + amount + ",\n" +
                "\"return_url\": \"" + returnUrl + "\",\n" +
                "\"cancel_url\": \"" + cancelUrl + "\",\n" +
                "\"notif_url\": \"" + notifUrl + "\",\n" +
                "\"lang\": \"fr\",\n" +
                "\"reference\": \"" + reference + "\"\n" +
                "}";
            
            logger.info("💳 [OrangeMoneyV2] JSON: {}", jsonBody);
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Réponse
            int responseCode = conn.getResponseCode();
            logger.info("💳 [OrangeMoneyV2] Webpay Response Code: {}", responseCode);
            
            InputStream inputStream = (responseCode >= 200 && responseCode < 300) 
                ? conn.getInputStream() 
                : conn.getErrorStream();
                
            try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                
                String responseBody = response.toString();
                logger.info("💳 [OrangeMoneyV2] Webpay Response: {}", responseBody);
                
                if (responseCode == 201) {
                    // Parser la réponse JSON et créer WebPaymentResponse
                    WebPaymentResponse paymentResponse = new WebPaymentResponse();
                    paymentResponse.setStatus(201);
                    paymentResponse.setMessage("OK");
                    
                    // Extraire payment_url
                    if (responseBody.contains("\"payment_url\"")) {
                        int start = responseBody.indexOf("\"payment_url\":\"") + 15;
                        int end = responseBody.indexOf("\"", start);
                        if (start > 14 && end > start) {
                            String paymentUrl = responseBody.substring(start, end);
                            paymentResponse.setPaymentUrl(paymentUrl);
                        }
                    }
                    
                    // Extraire pay_token
                    if (responseBody.contains("\"pay_token\"")) {
                        int start = responseBody.indexOf("\"pay_token\":\"") + 13;
                        int end = responseBody.indexOf("\"", start);
                        if (start > 12 && end > start) {
                            String payToken = responseBody.substring(start, end);
                            paymentResponse.setPayToken(payToken);
                        }
                    }
                    
                    // Extraire notif_token
                    if (responseBody.contains("\"notif_token\"")) {
                        int start = responseBody.indexOf("\"notif_token\":\"") + 15;
                        int end = responseBody.indexOf("\"", start);
                        if (start > 14 && end > start) {
                            String notifToken = responseBody.substring(start, end);
                            paymentResponse.setNotifToken(notifToken);
                        }
                    }
                    
                    logger.info("✅ [OrangeMoneyV2] Webpayment créé avec succès");
                    logger.info("🔗 [OrangeMoneyV2] URL de paiement: {}", paymentResponse.getPaymentUrl());
                    return paymentResponse;
                } else {
                    logger.error("❌ [OrangeMoneyV2] Webpayment échoué - Code: {}, Response: {}", responseCode, responseBody);
                }
            }
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Webpay Exception: {}", e.getMessage(), e);
        }
        
        return null;
    }
    
    /**
     * Générer un order_id unique
     */
    public String generateOrderId(String entrepriseId) {
        try {
            String orderId = orderCounterService.generateNextOrderId();
            logger.debug("🔢 [OrangeMoneyV2] Order ID généré: {} pour entreprise: {}", orderId, entrepriseId);
            return orderId;
        } catch (Exception e) {
            logger.warn("⚠️ [OrangeMoneyV2] Erreur compteur, utilisation fallback pour entreprise: {}", entrepriseId);
            long timestamp = System.currentTimeMillis();
            int random = (int) (Math.random() * 10000);
            return "merchant_order_" + timestamp + "_" + random;
        }
    }
    
    /**
     * Vérifier le statut d'une transaction avec pay_token
     */
    public TransactionStatusResponse checkTransactionStatus(String orderId, Integer amount, String payToken) {
        logger.info("🔍 [OrangeMoneyV2] Vérification statut transaction - OrderID: {}, Amount: {}", orderId, amount);
        
        // Obtenir le token d'accès
        String token = getAccessToken();
        if (token == null) {
            logger.error("❌ [OrangeMoneyV2] Impossible d'obtenir le token d'accès pour vérification statut");
            return null;
        }
        
        try {
            // URL de l'API de vérification du statut
            String statusUrl = "https://api.orange.com/orange-money-webpay/dev/v1/transactionstatus";
            URL url = new URL(statusUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            
            // Headers
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            
            // JSON Body
            String jsonBody = "{\n" +
                "\"order_id\": \"" + orderId + "\",\n" +
                "\"amount\": " + amount + ",\n" +
                "\"pay_token\": \"" + payToken + "\"\n" +
                "}";
            
            logger.info("🔍 [OrangeMoneyV2] Transaction Status JSON: {}", jsonBody);
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Réponse
            int responseCode = conn.getResponseCode();
            logger.info("🔍 [OrangeMoneyV2] Transaction Status Response Code: {}", responseCode);
            
            InputStream inputStream = (responseCode >= 200 && responseCode < 300) 
                ? conn.getInputStream() 
                : conn.getErrorStream();
                
            try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                
                String responseBody = response.toString();
                logger.info("🔍 [OrangeMoneyV2] Transaction Status Response: {}", responseBody);
                
                if (responseCode == 200) {
                    // Parser la réponse JSON
                    TransactionStatusResponse statusResponse = new TransactionStatusResponse();
                    
                    // Extraire status
                    if (responseBody.contains("\"status\"")) {
                        int start = responseBody.indexOf("\"status\":\"") + 10;
                        int end = responseBody.indexOf("\"", start);
                        if (start > 9 && end > start) {
                            String status = responseBody.substring(start, end);
                            statusResponse.setStatus(status);
                        }
                    }
                    
                    // Extraire order_id
                    if (responseBody.contains("\"order_id\"")) {
                        int start = responseBody.indexOf("\"order_id\":\"") + 12;
                        int end = responseBody.indexOf("\"", start);
                        if (start > 11 && end > start) {
                            String orderIdResponse = responseBody.substring(start, end);
                            statusResponse.setOrderId(orderIdResponse);
                        }
                    }
                    
                    // Extraire txnid
                    if (responseBody.contains("\"txnid\"")) {
                        int start = responseBody.indexOf("\"txnid\":\"") + 9;
                        int end = responseBody.indexOf("\"", start);
                        if (start > 8 && end > start) {
                            String txnid = responseBody.substring(start, end);
                            statusResponse.setTxnid(txnid);
                        }
                    }
                    
                    // Log du statut analysé
                    String status = statusResponse.getStatus();
                    logger.info("✅ [OrangeMoneyV2] Statut analysé: {} -> Success: {}, Failed: {}, Pending: {}", 
                               status, statusResponse.isSuccess(), statusResponse.isFailed(), statusResponse.isPending());
                    
                    logger.info("✅ [OrangeMoneyV2] Statut transaction récupéré: {}", statusResponse.getStatus());
                    return statusResponse;
                } else if (responseCode == 404 || responseCode == 400) {
                    // 404/400 peut signifier que le paiement n'a pas encore été traité par Orange Money
                    logger.warn("⚠️ [OrangeMoneyV2] Paiement non trouvé ou non traité - Code: {}, Response: {}", responseCode, responseBody);
                    TransactionStatusResponse pendingResponse = new TransactionStatusResponse();
                    pendingResponse.setStatus("PENDING");
                    pendingResponse.setOrderId(orderId);
                    pendingResponse.setTxnid(null);
                    return pendingResponse;
                } else {
                    logger.error("❌ [OrangeMoneyV2] Échec vérification statut - Code: {}, Response: {}", responseCode, responseBody);
                    TransactionStatusResponse errorResponse = new TransactionStatusResponse();
                    errorResponse.setStatus("ERROR");
                    errorResponse.setOrderId(orderId);
                    errorResponse.setTxnid(null);
                    return errorResponse;
                }
            }
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Exception lors de la vérification du statut: {}", e.getMessage(), e);
            TransactionStatusResponse errorResponse = new TransactionStatusResponse();
            errorResponse.setStatus("ERROR");
            errorResponse.setOrderId(orderId);
            errorResponse.setTxnid(null);
            return errorResponse;
        }
    }
    
    /**
     * Valider une notification de callback Orange Money
     */
    public boolean validateNotification(String notifToken, String orderId) {
        logger.info("🔍 [OrangeMoneyV2] Validation de la notification - OrderID: {}, NotifToken: {}...", 
                   orderId, notifToken != null ? notifToken.substring(0, Math.min(10, notifToken.length())) : "null");
        
        boolean isValid = notifToken != null && !notifToken.trim().isEmpty() && 
                         orderId != null && !orderId.trim().isEmpty();
        
        if (isValid) {
            logger.info("✅ [OrangeMoneyV2] Notification validée");
        } else {
            logger.warn("⚠️ [OrangeMoneyV2] Notification invalide");
        }
        
        return isValid;
    }
}
