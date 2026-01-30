<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.tresorpay.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * Service pour l'intégration avec TresorPay
 */
@Service
public class TresorPayService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${tresorpay.base-url:https://recette.tresorpay.finances.ml/api/public/v1}")
    private String baseUrl;
    
    @Value("${tresorpay.auth-url:https://recette.auth.finances.ml/realms/tresorpay/protocol/openid-connect/token}")
    private String authUrl;
    
    @Value("${tresorpay.client-id:api-mali}")
    private String clientId;
    
    @Value("${tresorpay.client-secret:SYhpGoLQoojalN56CLyox2Cirqsm1q6k}")
    private String clientSecret;
    
    @Value("${tresorpay.code-client:APP-API-MALI}")
    private String codeClient;
    
    @Value("${tresorpay.code-structure:API-MALI}")
    private String codeStructure;
    
    @Value("${tresorpay.callback-url:}")
    private String callbackUrl;
    
    @Value("${tresorpay.redirect-url:}")
    private String redirectUrl;
    
    @Value("${tresorpay.test-phone:+22370000000}")
    private String testPhoneNumber;
    
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;
    
    private String cachedAccessToken;
    private LocalDateTime tokenExpiryTime;
    
    public TresorPayService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Obtient un token d'accès OAuth2
     */
    public String getAccessToken() {
        // Vérifier si le token en cache est encore valide
        if (cachedAccessToken != null && tokenExpiryTime != null && 
            LocalDateTime.now().isBefore(tokenExpiryTime.minusMinutes(5))) {
            return cachedAccessToken;
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("scope", "openid");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<TresorPayOAuthResponse> response = restTemplate.postForEntity(
                authUrl, request, TresorPayOAuthResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                TresorPayOAuthResponse oauthResponse = response.getBody();
                cachedAccessToken = oauthResponse.getAccessToken();
                tokenExpiryTime = LocalDateTime.now().plusSeconds(oauthResponse.getExpiresIn());
                
                System.out.println("🔑 Token TresorPay obtenu avec succès, expire à: " + tokenExpiryTime);
                return cachedAccessToken;
            } else {
                throw new RuntimeException("Échec de l'authentification TresorPay: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'obtention du token TresorPay: " + e.getMessage());
            throw new RuntimeException("Impossible d'obtenir le token d'accès TresorPay", e);
        }
    }
    
    /**
     * Crée un avis de recette TresorPay
     */
    public TresorPayNoticeResponse createNotice(TresorPayNoticeRequest request) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            HttpEntity<TresorPayNoticeRequest> entity = new HttpEntity<>(request, headers);
            
            String url = baseUrl + "/payment/create-notice-recette";
            System.out.println("📝 Création avis TresorPay pour référence: " + request.getReference());
            
            // Log détaillé de la requête pour debug
            try {
                String jsonRequest = objectMapper.writeValueAsString(request);
                System.out.println("📤 Requête JSON TresorPay: " + jsonRequest);
                System.out.println("📞 Téléphone dans requête: '" + request.getTaxPayer().getPhoneNumber() + "' (longueur: " + request.getTaxPayer().getPhoneNumber().length() + ")");
                System.out.println("🔗 Callback: " + request.getCallback());
                System.out.println("🔗 RedirectUrl: " + request.getRedirectUrl());
            } catch (Exception e) {
                System.err.println("⚠️ Impossible de sérialiser la requête pour debug: " + e.getMessage());
            }
            
            ResponseEntity<TresorPayNoticeResponse> response = restTemplate.postForEntity(
                url, entity, TresorPayNoticeResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("✅ Avis TresorPay créé avec succès: " + response.getBody().getReference());
                return response.getBody();
            } else {
                throw new RuntimeException("Échec de création de l'avis TresorPay: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la création de l'avis TresorPay: " + e.getMessage());
            throw new RuntimeException("Impossible de créer l'avis TresorPay", e);
        }
    }
    
    /**
     * Vérifie le statut d'un avis de recette
     */
    public TresorPayStatusResponse getNoticeStatus(String reference) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            String url = baseUrl + "/notice-recette/status/" + reference;
            System.out.println("🔍 Vérification statut avis TresorPay: " + reference);
            
            ResponseEntity<TresorPayStatusResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TresorPayStatusResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("✅ Statut récupéré: " + response.getBody().getStatus());
                return response.getBody();
            } else {
                throw new RuntimeException("Échec de récupération du statut: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la vérification du statut: " + e.getMessage());
            throw new RuntimeException("Impossible de vérifier le statut de l'avis", e);
        }
    }
    
    /**
     * Vérifie le statut de plusieurs avis
     */
    public List<TresorPayStatusResponse> getMultipleNoticeStatus(List<String> references) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            HttpEntity<List<String>> entity = new HttpEntity<>(references, headers);
            
            String url = baseUrl + "/notice-recette/status/references";
            System.out.println("🔍 Vérification statut multiple avis TresorPay: " + references.size() + " références");
            
            ResponseEntity<TresorPayStatusResponse[]> response = restTemplate.postForEntity(
                url, entity, TresorPayStatusResponse[].class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<TresorPayStatusResponse> statusList = Arrays.asList(response.getBody());
                System.out.println("✅ Statuts récupérés pour " + statusList.size() + " avis");
                return statusList;
            } else {
                throw new RuntimeException("Échec de récupération des statuts: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la vérification des statuts multiples: " + e.getMessage());
            throw new RuntimeException("Impossible de vérifier les statuts des avis", e);
        }
    }
    
    /**
     * Annule un avis de recette
     */
    public TresorPayNoticeResponse cancelNotice(String referenceClient) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            // Créer le body pour l'annulation
            final String refClient = referenceClient; // Capture the parameter
            var cancelRequest = new Object() {
                public final String referenceClient = refClient;
                public final String codeClient = TresorPayService.this.codeClient;
                public final String codeStructure = TresorPayService.this.codeStructure;
            };
            
            HttpEntity<Object> entity = new HttpEntity<>(cancelRequest, headers);
            
            String url = baseUrl + "/payment/cancel-notice-recette";
            System.out.println("❌ Annulation avis TresorPay: " + referenceClient);
            
            ResponseEntity<TresorPayNoticeResponse> response = restTemplate.postForEntity(
                url, entity, TresorPayNoticeResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("✅ Avis TresorPay annulé: " + response.getBody().getReference());
                return response.getBody();
            } else {
                throw new RuntimeException("Échec d'annulation de l'avis: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'annulation de l'avis: " + e.getMessage());
            throw new RuntimeException("Impossible d'annuler l'avis TresorPay", e);
        }
    }
    
    /**
     * Génère l'URL de paiement TresorPay
     */
    public String generatePaymentUrl(String tresorPayReference) {
        return "https://tresorpay.ml/public/init-paiement?id=" + tresorPayReference;
    }
    
    /**
     * Formate un numéro de téléphone pour TresorPay
     * TresorPay ajoute automatiquement le +223, donc on envoie SEULEMENT les 8 chiffres
     * Format attendu: exactement 8 chiffres commençant par 6, 7, 8 ou 9
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            System.out.println("⚠️ [TresorPay] Aucun numéro fourni, le champ sera omis");
            return "";
        }
        
        // Nettoyer le numéro (enlever TOUS les espaces, tirets, parenthèses, points, caractères non-numériques sauf +)
        String cleaned = phone.trim().replaceAll("[\\s\\-\\(\\)\\.\\t\\r\\n]+", "").trim();
        
        // Log pour debug
        System.out.println("🧹 [TresorPay] Nettoyage: '" + phone + "' (longueur: " + phone.length() + ") -> '" + cleaned + "' (longueur: " + cleaned.length() + ")");
        
        String digits = "";
        
        // Extraire les 8 chiffres selon le format
        if (cleaned.startsWith("+223")) {
            digits = cleaned.substring(4); // Après +223
        } else if (cleaned.startsWith("00223")) {
            digits = cleaned.substring(5); // Après 00223
        } else if (cleaned.startsWith("223")) {
            digits = cleaned.substring(3); // Après 223
        } else if (cleaned.startsWith("0")) {
            digits = cleaned.substring(1); // Après 0
        } else {
            digits = cleaned; // Numéro local
        }
        
        // Si plus de 8 chiffres, tronquer à 8 chiffres (prendre les 8 premiers)
        if (digits.length() > 8) {
            System.out.println("⚠️ [TresorPay] Numéro trop long (" + digits.length() + " chiffres), troncature aux 8 premiers: '" + digits + "' -> '" + digits.substring(0, 8) + "'");
            digits = digits.substring(0, 8);
        }
        
        // Valider qu'il y a exactement 8 chiffres commençant par 6-9
        if (!digits.matches("^[6-9]\\d{7}$")) {
            System.err.println("⚠️ [TresorPay] Numéro invalide (doit être exactement 8 chiffres commençant par 6-9): '" + phone + "' -> '" + digits + "' (longueur: " + digits.length() + ")");
            System.out.println("🔧 [TresorPay] Le champ phoneNumber sera omis de la requête");
            return "";
        }
        
        // Liste de numéros connus pour être invalides dans TresorPay
        String[] invalidNumbers = {
            "70000000",  // Numéro de test par défaut
            "91234567"   // Numéro rejeté par TresorPay
        };
        
        for (String invalidNum : invalidNumbers) {
            if (digits.equals(invalidNum)) {
                System.err.println("⚠️ [TresorPay] Numéro connu comme invalide dans TresorPay: " + digits);
                System.out.println("🔧 [TresorPay] Le champ phoneNumber sera omis de la requête");
                return "";
            }
        }
        
        // Retourner SEULEMENT les 8 chiffres (TresorPay ajoute automatiquement +223)
        System.out.println("✅ [TresorPay] Numéro formaté: '" + phone + "' -> '" + digits + "' (8 chiffres seulement, TresorPay ajoutera +223)");
        return digits;
    }
    
    /**
     * Construit une requête TresorPay à partir des données de paiement
     */
    public TresorPayNoticeRequest buildNoticeRequest(String entrepriseId, String entrepriseReference, 
                                                   String entrepriseName, Long amount, String description, 
                                                   String customerFirstName, String customerLastName, 
                                                   String customerEmail, String customerPhone) {
        
        // Utiliser la référence de l'entreprise + timestamp pour garantir l'unicité
        // Chaque avis TresorPay doit avoir une référence unique, même pour la même entreprise
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7); // Derniers 6 chiffres du timestamp
        String reference = entrepriseReference != null 
            ? (entrepriseReference + "-" + timestamp) 
            : ("API-INVEST-" + entrepriseId + "-" + System.currentTimeMillis());
        
        System.out.println("📝 [TresorPay] Référence générée: " + reference);
        
        // Formater le numéro de téléphone au format international
        System.out.println("🔍 [TresorPay] Profil actif: " + activeProfile);
        System.out.println("🔍 [TresorPay] Numéro de test configuré: " + testPhoneNumber);
        String formattedPhone = formatPhoneNumber(customerPhone);
        System.out.println("📞 [TresorPay] Téléphone original: '" + customerPhone + "' -> formaté: '" + formattedPhone + "' (longueur: " + formattedPhone.length() + ")");
        
        // Item principal avec le nom de l'entreprise dans le champ name (affiché sur le reçu)
        // Déterminer le type de paiement selon la description
        String itemName;
        String defaultDescription;
        if (description != null && description.contains("agrément")) {
            itemName = "Paiement d'agrément - " + (entrepriseName != null ? entrepriseName : "");
            defaultDescription = "Frais d'agrément d'investissement pour " + (entrepriseName != null ? entrepriseName : "");
        } else {
            itemName = "Création d'entreprise - " + (entrepriseName != null ? entrepriseName : "");
            defaultDescription = "Frais de création d'entreprise pour " + (entrepriseName != null ? entrepriseName : "");
        }
        
        TresorPayNoticeRequest.Item item = TresorPayNoticeRequest.Item.builder()
                .name(itemName)
                .quantity(1)
                .unitPrice(amount)
                .description(description != null ? description : defaultDescription)
                .codeNatureRecette("7222") // Code officiel TresorPay pour registre de commercetratifs
                .build();
        
        // Informations du contribuable (gérant de l'entreprise)
        // Ne pas envoyer le numéro de téléphone s'il est vide ou invalide
        TresorPayNoticeRequest.TaxPayer.TaxPayerBuilder taxPayerBuilder = TresorPayNoticeRequest.TaxPayer.builder()
                .name(customerLastName != null ? customerLastName : "")
                .firstName(customerFirstName != null ? customerFirstName : "")
                .companyName(entrepriseName != null ? entrepriseName : "")
                .address("Bamako, Mali")
                .email(customerEmail != null ? customerEmail : "")
                .nif("");
        
        // Ajouter le téléphone seulement s'il est valide et non vide
        if (formattedPhone != null && !formattedPhone.isEmpty()) {
            taxPayerBuilder.phoneNumber(formattedPhone);
            System.out.println("✅ [TresorPay] Numéro de téléphone inclus dans la requête: " + formattedPhone);
        } else {
            System.out.println("⚠️ [TresorPay] Numéro de téléphone omis (invalide ou vide)");
        }
        
        TresorPayNoticeRequest.TaxPayer taxPayer = taxPayerBuilder.build();
        
        // Modes de paiement autorisés (tous les providers TresorPay)
        // Utiliser le numéro de téléphone fourni par l'utilisateur si disponible
        List<TresorPayNoticeRequest.AuthorizedPaymentMode> paymentModes = Arrays.asList(
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("ORANGE_MONEY")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("MOOV_MONEY")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("SAMA_MONEY")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("WAVE")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("CARD")
                        .paymentNumber(null)
                        .amount(amount)
                        .build()
        );
        
        // Ne pas envoyer les URLs localhost à TresorPay (elles ne sont pas accessibles)
        String safeCallback = (callbackUrl != null && !callbackUrl.contains("localhost")) ? callbackUrl : null;
        String safeRedirect = (redirectUrl != null && !redirectUrl.contains("localhost")) ? redirectUrl : null;
        
        return TresorPayNoticeRequest.builder()
                .reference(reference)
                .codeClient(codeClient)
                .codeStructure(codeStructure)
                .callback(safeCallback)
                .redirectUrl(safeRedirect)
                .netTotal(amount)
                .taxPayer(taxPayer)
                .items(Arrays.asList(item))
                .authorizedPaymentModes(paymentModes)
                .build();
    }

    /**
     * Vérifier et marquer un avis comme livré (OBLIGATOIRE après paiement)
     * Étape 7 du workflow TresorPay
     */
    public TresorPayNoticeResponse verifyNotice(String tresorPayReference) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            // Créer le body pour la vérification
            var verifyRequest = new Object() {
                public final String reference = tresorPayReference;
                public final String codeClient = TresorPayService.this.codeClient;
                public final String codeStructure = TresorPayService.this.codeStructure;
            };
            
            HttpEntity<Object> entity = new HttpEntity<>(verifyRequest, headers);
            
            String url = baseUrl + "/payment/verified-notice-recette";
            System.out.println("✅ Vérification avis TresorPay: " + tresorPayReference);
            
            ResponseEntity<TresorPayNoticeResponse> response = restTemplate.postForEntity(
                url, entity, TresorPayNoticeResponse.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("✅ Avis TresorPay vérifié avec succès: " + tresorPayReference);
                return response.getBody();
            } else {
                throw new RuntimeException("Échec de la vérification de l'avis TresorPay");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la vérification de l'avis TresorPay: " + e.getMessage());
            throw new RuntimeException("Erreur lors de la vérification de l'avis TresorPay", e);
        }
    }

    /**
     * Télécharger le reçu PDF d'un paiement
     * Étape 8 du workflow TresorPay
     */
    public byte[] downloadReceipt(String tresorPayReference) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            String url = baseUrl + "/documents/receipt/download/" + tresorPayReference;
            System.out.println("📄 Téléchargement reçu TresorPay: " + tresorPayReference);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, byte[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("✅ Reçu TresorPay téléchargé avec succès: " + tresorPayReference);
                return response.getBody();
            } else {
                throw new RuntimeException("Échec du téléchargement du reçu TresorPay");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors du téléchargement du reçu TresorPay: " + e.getMessage());
            throw new RuntimeException("Erreur lors du téléchargement du reçu TresorPay", e);
        }
    }
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.tresorpay.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Service pour l'intégration avec TresorPay
 */
@Service
public class TresorPayService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${tresorpay.base-url:https://recette.tresorpay.finances.ml/api/public/v1}")
    private String baseUrl;
    
    @Value("${tresorpay.auth-url:https://recette.auth.finances.ml/realms/tresorpay/protocol/openid-connect/token}")
    private String authUrl;
    
    @Value("${tresorpay.client-id:api-mali}")
    private String clientId;
    
    @Value("${tresorpay.client-secret:SYhpGoLQoojalN56CLyox2Cirqsm1q6k}")
    private String clientSecret;
    
    @Value("${tresorpay.code-client:APP-API-MALI}")
    private String codeClient;
    
    @Value("${tresorpay.code-structure:API-MALI}")
    private String codeStructure;
    
    @Value("${tresorpay.callback-url:}")
    private String callbackUrl;
    
    @Value("${tresorpay.redirect-url:}")
    private String redirectUrl;
    
    @Value("${tresorpay.test-phone:+22370000000}")
    private String testPhoneNumber;
    
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;
    
    private String cachedAccessToken;
    private LocalDateTime tokenExpiryTime;
    
    public TresorPayService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Obtient un token d'accès OAuth2
     */
    public String getAccessToken() {
        // Vérifier si le token en cache est encore valide
        if (cachedAccessToken != null && tokenExpiryTime != null && 
            LocalDateTime.now().isBefore(tokenExpiryTime.minusMinutes(5))) {
            return cachedAccessToken;
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("scope", "openid");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<TresorPayOAuthResponse> response = restTemplate.postForEntity(
                authUrl, request, TresorPayOAuthResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                TresorPayOAuthResponse oauthResponse = response.getBody();
                cachedAccessToken = oauthResponse.getAccessToken();
                tokenExpiryTime = LocalDateTime.now().plusSeconds(oauthResponse.getExpiresIn());
                
                System.out.println("🔑 Token TresorPay obtenu avec succès, expire à: " + tokenExpiryTime);
                return cachedAccessToken;
            } else {
                throw new RuntimeException("Échec de l'authentification TresorPay: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'obtention du token TresorPay: " + e.getMessage());
            throw new RuntimeException("Impossible d'obtenir le token d'accès TresorPay", e);
        }
    }
    
    /**
     * Crée un avis de recette TresorPay
     */
    public TresorPayNoticeResponse createNotice(TresorPayNoticeRequest request) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            HttpEntity<TresorPayNoticeRequest> entity = new HttpEntity<>(request, headers);
            
            String url = baseUrl + "/payment/create-notice-recette";
            System.out.println("📝 Création avis TresorPay pour référence: " + request.getReference());
            
            // Log détaillé de la requête pour debug
            try {
                String jsonRequest = objectMapper.writeValueAsString(request);
                System.out.println("📤 Requête JSON TresorPay: " + jsonRequest);
                System.out.println("📞 Téléphone dans requête: '" + request.getTaxPayer().getPhoneNumber() + "' (longueur: " + request.getTaxPayer().getPhoneNumber().length() + ")");
                System.out.println("🔗 Callback: " + request.getCallback());
                System.out.println("🔗 RedirectUrl: " + request.getRedirectUrl());
            } catch (Exception e) {
                System.err.println("⚠️ Impossible de sérialiser la requête pour debug: " + e.getMessage());
            }
            
            ResponseEntity<TresorPayNoticeResponse> response = restTemplate.postForEntity(
                url, entity, TresorPayNoticeResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("✅ Avis TresorPay créé avec succès: " + response.getBody().getReference());
                return response.getBody();
            } else {
                throw new RuntimeException("Échec de création de l'avis TresorPay: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la création de l'avis TresorPay: " + e.getMessage());
            throw new RuntimeException("Impossible de créer l'avis TresorPay", e);
        }
    }
    
    /**
     * Vérifie le statut d'un avis de recette
     */
    public TresorPayStatusResponse getNoticeStatus(String reference) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            String url = baseUrl + "/notice-recette/status/" + reference;
            System.out.println("🔍 Vérification statut avis TresorPay: " + reference);
            
            ResponseEntity<TresorPayStatusResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TresorPayStatusResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("✅ Statut récupéré: " + response.getBody().getStatus());
                return response.getBody();
            } else {
                throw new RuntimeException("Échec de récupération du statut: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la vérification du statut: " + e.getMessage());
            throw new RuntimeException("Impossible de vérifier le statut de l'avis", e);
        }
    }
    
    /**
     * Vérifie le statut de plusieurs avis
     */
    public List<TresorPayStatusResponse> getMultipleNoticeStatus(List<String> references) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            HttpEntity<List<String>> entity = new HttpEntity<>(references, headers);
            
            String url = baseUrl + "/notice-recette/status/references";
            System.out.println("🔍 Vérification statut multiple avis TresorPay: " + references.size() + " références");
            
            ResponseEntity<TresorPayStatusResponse[]> response = restTemplate.postForEntity(
                url, entity, TresorPayStatusResponse[].class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<TresorPayStatusResponse> statusList = Arrays.asList(response.getBody());
                System.out.println("✅ Statuts récupérés pour " + statusList.size() + " avis");
                return statusList;
            } else {
                throw new RuntimeException("Échec de récupération des statuts: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la vérification des statuts multiples: " + e.getMessage());
            throw new RuntimeException("Impossible de vérifier les statuts des avis", e);
        }
    }
    
    /**
     * Annule un avis de recette
     */
    public TresorPayNoticeResponse cancelNotice(String referenceClient) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            // Créer le body pour l'annulation
            final String refClient = referenceClient; // Capture the parameter
            var cancelRequest = new Object() {
                public final String referenceClient = refClient;
                public final String codeClient = TresorPayService.this.codeClient;
                public final String codeStructure = TresorPayService.this.codeStructure;
            };
            
            HttpEntity<Object> entity = new HttpEntity<>(cancelRequest, headers);
            
            String url = baseUrl + "/payment/cancel-notice-recette";
            System.out.println("❌ Annulation avis TresorPay: " + referenceClient);
            
            ResponseEntity<TresorPayNoticeResponse> response = restTemplate.postForEntity(
                url, entity, TresorPayNoticeResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("✅ Avis TresorPay annulé: " + response.getBody().getReference());
                return response.getBody();
            } else {
                throw new RuntimeException("Échec d'annulation de l'avis: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'annulation de l'avis: " + e.getMessage());
            throw new RuntimeException("Impossible d'annuler l'avis TresorPay", e);
        }
    }
    
    /**
     * Génère l'URL de paiement TresorPay
     */
    public String generatePaymentUrl(String tresorPayReference) {
        return "https://tresorpay.ml/public/init-paiement?id=" + tresorPayReference;
    }
    
    /**
     * Formate un numéro de téléphone pour TresorPay
     * TresorPay ajoute automatiquement le +223, donc on envoie SEULEMENT les 8 chiffres
     * Format attendu: exactement 8 chiffres commençant par 6, 7, 8 ou 9
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            System.out.println("⚠️ [TresorPay] Aucun numéro fourni, le champ sera omis");
            return "";
        }
        
        // Nettoyer le numéro (enlever TOUS les espaces, tirets, parenthèses, points, caractères non-numériques sauf +)
        String cleaned = phone.trim().replaceAll("[\\s\\-\\(\\)\\.\\t\\r\\n]+", "").trim();
        
        // Log pour debug
        System.out.println("🧹 [TresorPay] Nettoyage: '" + phone + "' (longueur: " + phone.length() + ") -> '" + cleaned + "' (longueur: " + cleaned.length() + ")");
        
        String digits = "";
        
        // Extraire les 8 chiffres selon le format
        if (cleaned.startsWith("+223")) {
            digits = cleaned.substring(4); // Après +223
        } else if (cleaned.startsWith("00223")) {
            digits = cleaned.substring(5); // Après 00223
        } else if (cleaned.startsWith("223")) {
            digits = cleaned.substring(3); // Après 223
        } else if (cleaned.startsWith("0")) {
            digits = cleaned.substring(1); // Après 0
        } else {
            digits = cleaned; // Numéro local
        }
        
        // Si plus de 8 chiffres, tronquer à 8 chiffres (prendre les 8 premiers)
        if (digits.length() > 8) {
            System.out.println("⚠️ [TresorPay] Numéro trop long (" + digits.length() + " chiffres), troncature aux 8 premiers: '" + digits + "' -> '" + digits.substring(0, 8) + "'");
            digits = digits.substring(0, 8);
        }
        
        // Valider qu'il y a exactement 8 chiffres commençant par 6-9
        if (!digits.matches("^[6-9]\\d{7}$")) {
            System.err.println("⚠️ [TresorPay] Numéro invalide (doit être exactement 8 chiffres commençant par 6-9): '" + phone + "' -> '" + digits + "' (longueur: " + digits.length() + ")");
            System.out.println("🔧 [TresorPay] Le champ phoneNumber sera omis de la requête");
            return "";
        }
        
        // Liste de numéros connus pour être invalides dans TresorPay
        String[] invalidNumbers = {
            "70000000",  // Numéro de test par défaut
            "91234567"   // Numéro rejeté par TresorPay
        };
        
        for (String invalidNum : invalidNumbers) {
            if (digits.equals(invalidNum)) {
                System.err.println("⚠️ [TresorPay] Numéro connu comme invalide dans TresorPay: " + digits);
                System.out.println("🔧 [TresorPay] Le champ phoneNumber sera omis de la requête");
                return "";
            }
        }
        
        // Retourner SEULEMENT les 8 chiffres (TresorPay ajoute automatiquement +223)
        System.out.println("✅ [TresorPay] Numéro formaté: '" + phone + "' -> '" + digits + "' (8 chiffres seulement, TresorPay ajoutera +223)");
        return digits;
    }
    
    /**
     * Construit une requête TresorPay à partir des données de paiement
     */
    public TresorPayNoticeRequest buildNoticeRequest(String entrepriseId, String entrepriseReference, 
                                                   String entrepriseName, Long amount, String description, 
                                                   String customerFirstName, String customerLastName, 
                                                   String customerEmail, String customerPhone) {
        
        // Utiliser la référence de l'entreprise + timestamp pour garantir l'unicité
        // Chaque avis TresorPay doit avoir une référence unique, même pour la même entreprise
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7); // Derniers 6 chiffres du timestamp
        String reference = entrepriseReference != null 
            ? (entrepriseReference + "-" + timestamp) 
            : ("API-INVEST-" + entrepriseId + "-" + System.currentTimeMillis());
        
        System.out.println("📝 [TresorPay] Référence générée: " + reference);
        
        // Formater le numéro de téléphone au format international
        System.out.println("🔍 [TresorPay] Profil actif: " + activeProfile);
        System.out.println("🔍 [TresorPay] Numéro de test configuré: " + testPhoneNumber);
        String formattedPhone = formatPhoneNumber(customerPhone);
        System.out.println("📞 [TresorPay] Téléphone original: '" + customerPhone + "' -> formaté: '" + formattedPhone + "' (longueur: " + formattedPhone.length() + ")");
        
        // Item principal avec le nom de l'entreprise dans le champ name (affiché sur le reçu)
        // Déterminer le type de paiement selon la description
        String itemName;
        String defaultDescription;
        if (description != null && description.contains("agrément")) {
            itemName = "Paiement d'agrément - " + (entrepriseName != null ? entrepriseName : "");
            defaultDescription = "Frais d'agrément d'investissement pour " + (entrepriseName != null ? entrepriseName : "");
        } else {
            itemName = "Création d'entreprise - " + (entrepriseName != null ? entrepriseName : "");
            defaultDescription = "Frais de création d'entreprise pour " + (entrepriseName != null ? entrepriseName : "");
        }
        
        TresorPayNoticeRequest.Item item = TresorPayNoticeRequest.Item.builder()
                .name(itemName)
                .quantity(1)
                .unitPrice(amount)
                .description(description != null ? description : defaultDescription)
                .codeNatureRecette("7222") // Code officiel TresorPay pour registre de commercetratifs
                .build();
        
        // Informations du contribuable (gérant de l'entreprise)
        // Ne pas envoyer le numéro de téléphone s'il est vide ou invalide
        TresorPayNoticeRequest.TaxPayer.TaxPayerBuilder taxPayerBuilder = TresorPayNoticeRequest.TaxPayer.builder()
                .name(customerLastName != null ? customerLastName : "")
                .firstName(customerFirstName != null ? customerFirstName : "")
                .companyName(entrepriseName != null ? entrepriseName : "")
                .address("Bamako, Mali")
                .email(customerEmail != null ? customerEmail : "")
                .nif("");
        
        // Ajouter le téléphone seulement s'il est valide et non vide
        if (formattedPhone != null && !formattedPhone.isEmpty()) {
            taxPayerBuilder.phoneNumber(formattedPhone);
            System.out.println("✅ [TresorPay] Numéro de téléphone inclus dans la requête: " + formattedPhone);
        } else {
            System.out.println("⚠️ [TresorPay] Numéro de téléphone omis (invalide ou vide)");
        }
        
        TresorPayNoticeRequest.TaxPayer taxPayer = taxPayerBuilder.build();
        
        // Modes de paiement autorisés (tous les providers TresorPay)
        // Utiliser le numéro de téléphone fourni par l'utilisateur si disponible
        List<TresorPayNoticeRequest.AuthorizedPaymentMode> paymentModes = Arrays.asList(
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("ORANGE_MONEY")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("MOOV_MONEY")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("SAMA_MONEY")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("WAVE")
                        .paymentNumber(formattedPhone)
                        .amount(amount)
                        .build(),
                TresorPayNoticeRequest.AuthorizedPaymentMode.builder()
                        .codeProvider("CARD")
                        .paymentNumber(null)
                        .amount(amount)
                        .build()
        );
        
        // Ne pas envoyer les URLs localhost à TresorPay (elles ne sont pas accessibles)
        String safeCallback = (callbackUrl != null && !callbackUrl.contains("localhost")) ? callbackUrl : null;
        String safeRedirect = (redirectUrl != null && !redirectUrl.contains("localhost")) ? redirectUrl : null;
        
        return TresorPayNoticeRequest.builder()
                .reference(reference)
                .codeClient(codeClient)
                .codeStructure(codeStructure)
                .callback(safeCallback)
                .redirectUrl(safeRedirect)
                .netTotal(amount)
                .taxPayer(taxPayer)
                .items(Arrays.asList(item))
                .authorizedPaymentModes(paymentModes)
                .build();
    }

    /**
     * Vérifier et marquer un avis comme livré (OBLIGATOIRE après paiement)
     * Étape 7 du workflow TresorPay
     */
    public TresorPayNoticeResponse verifyNotice(String tresorPayReference) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            // Créer le body pour la vérification
            var verifyRequest = new Object() {
                public final String reference = tresorPayReference;
                public final String codeClient = TresorPayService.this.codeClient;
                public final String codeStructure = TresorPayService.this.codeStructure;
            };
            
            HttpEntity<Object> entity = new HttpEntity<>(verifyRequest, headers);
            
            String url = baseUrl + "/payment/verified-notice-recette";
            System.out.println("✅ Vérification avis TresorPay: " + tresorPayReference);
            
            ResponseEntity<TresorPayNoticeResponse> response = restTemplate.postForEntity(
                url, entity, TresorPayNoticeResponse.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("✅ Avis TresorPay vérifié avec succès: " + tresorPayReference);
                return response.getBody();
            } else {
                throw new RuntimeException("Échec de la vérification de l'avis TresorPay");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la vérification de l'avis TresorPay: " + e.getMessage());
            throw new RuntimeException("Erreur lors de la vérification de l'avis TresorPay", e);
        }
    }

    /**
     * Télécharger le reçu PDF d'un paiement
     * Étape 8 du workflow TresorPay
     */
    public byte[] downloadReceipt(String tresorPayReference) {
        try {
            String accessToken = getAccessToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            String url = baseUrl + "/documents/receipt/download/" + tresorPayReference;
            System.out.println("📄 Téléchargement reçu TresorPay: " + tresorPayReference);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, byte[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("✅ Reçu TresorPay téléchargé avec succès: " + tresorPayReference);
                return response.getBody();
            } else {
                throw new RuntimeException("Échec du téléchargement du reçu TresorPay");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors du téléchargement du reçu TresorPay: " + e.getMessage());
            throw new RuntimeException("Erreur lors du téléchargement du reçu TresorPay", e);
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
