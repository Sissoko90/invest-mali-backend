<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO pour les réponses de paiement
 */
public class PaymentResponse {
    
    /**
     * ID unique du paiement
     */
    private String paymentId;
    
    /**
     * ID de l'entreprise
     */
    private String entrepriseId;
    
    /**
     * Statut du paiement
     */
    private PaymentStatus status;
    
    /**
     * Méthode de paiement utilisée
     */
    private String paymentMethod;
    
    /**
     * Montant en centimes
     */
    private Long amount;
    
    /**
     * Devise
     */
    private String currency;
    
    /**
     * URL de redirection (pour Stripe)
     */
    private String redirectUrl;
    
    /**
     * Client secret (pour Stripe)
     */
    private String clientSecret;
    
    /**
     * Référence de transaction
     */
    private String transactionReference;
    
    /**
     * Instructions de paiement (pour virement, espèces)
     */
    private String paymentInstructions;
    
    /**
     * Date de création
     */
    private LocalDateTime createdAt;
    
    /**
     * Date de mise à jour
     */
    private LocalDateTime updatedAt;
    
    /**
     * Message d'erreur en cas d'échec
     */
    private String errorMessage;
    
    /**
     * Données additionnelles selon la méthode
     */
    private Map<String, Object> metadata;
    
    /**
     * Statuts possibles d'un paiement
     */
    public enum PaymentStatus {
        PENDING("En attente"),
        PROCESSING("En cours de traitement"),
        SUCCEEDED("Réussi"),
        FAILED("Échoué"),
        CANCELLED("Annulé"),
        REQUIRES_ACTION("Action requise"),
        REQUIRES_CONFIRMATION("Confirmation requise");
        
        private final String description;
        
        PaymentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // Constructors
    public PaymentResponse() {}
    
    public PaymentResponse(String paymentId, String entrepriseId, PaymentStatus status, String paymentMethod, Long amount) {
        this.paymentId = paymentId;
        this.entrepriseId = entrepriseId;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.currency = "xof";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    
    public String getEntrepriseId() { return entrepriseId; }
    public void setEntrepriseId(String entrepriseId) { this.entrepriseId = entrepriseId; }
    
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
    
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    
    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
    
    public String getPaymentInstructions() { return paymentInstructions; }
    public void setPaymentInstructions(String paymentInstructions) { this.paymentInstructions = paymentInstructions; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    /**
     * Constructeur pour succès rapide
     */
    public static PaymentResponse success(String paymentId, String entrepriseId, String method, Long amount) {
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(paymentId);
        response.setEntrepriseId(entrepriseId);
        response.setStatus(PaymentStatus.SUCCEEDED);
        response.setPaymentMethod(method);
        response.setAmount(amount);
        response.setCurrency("xof");
        response.setCreatedAt(LocalDateTime.now());
        response.setUpdatedAt(LocalDateTime.now());
        return response;
    }
    
    /**
     * Constructeur pour erreur rapide
     */
    public static PaymentResponse error(String entrepriseId, String method, String errorMessage) {
        PaymentResponse response = new PaymentResponse();
        response.setEntrepriseId(entrepriseId);
        response.setStatus(PaymentStatus.FAILED);
        response.setPaymentMethod(method);
        response.setErrorMessage(errorMessage);
        response.setCreatedAt(LocalDateTime.now());
        response.setUpdatedAt(LocalDateTime.now());
        return response;
    }
    
    /**
     * Builder pattern pour PaymentResponse
     */
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private PaymentResponse response = new PaymentResponse();
        
        public Builder paymentId(String paymentId) {
            response.setPaymentId(paymentId);
            return this;
        }
        
        public Builder entrepriseId(String entrepriseId) {
            response.setEntrepriseId(entrepriseId);
            return this;
        }
        
        public Builder status(PaymentStatus status) {
            response.setStatus(status);
            return this;
        }
        
        public Builder paymentMethod(String paymentMethod) {
            response.setPaymentMethod(paymentMethod);
            return this;
        }
        
        public Builder amount(Long amount) {
            response.setAmount(amount);
            return this;
        }
        
        public Builder currency(String currency) {
            response.setCurrency(currency);
            return this;
        }
        
        public Builder redirectUrl(String redirectUrl) {
            response.setRedirectUrl(redirectUrl);
            return this;
        }
        
        public Builder clientSecret(String clientSecret) {
            response.setClientSecret(clientSecret);
            return this;
        }
        
        public Builder transactionReference(String transactionReference) {
            response.setTransactionReference(transactionReference);
            return this;
        }
        
        public Builder paymentInstructions(String paymentInstructions) {
            response.setPaymentInstructions(paymentInstructions);
            return this;
        }
        
        public Builder createdAt(LocalDateTime createdAt) {
            response.setCreatedAt(createdAt);
            return this;
        }
        
        public Builder updatedAt(LocalDateTime updatedAt) {
            response.setUpdatedAt(updatedAt);
            return this;
        }
        
        public Builder errorMessage(String errorMessage) {
            response.setErrorMessage(errorMessage);
            return this;
        }
        
        public Builder metadata(Map<String, Object> metadata) {
            response.setMetadata(metadata);
            return this;
        }
        
        public PaymentResponse build() {
            return response;
        }
    }
}
=======
package abdaty_technologie.API_Invest.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO pour les réponses de paiement
 */
public class PaymentResponse {
    
    /**
     * ID unique du paiement
     */
    private String paymentId;
    
    /**
     * ID de l'entreprise
     */
    private String entrepriseId;
    
    /**
     * Statut du paiement
     */
    private PaymentStatus status;
    
    /**
     * Méthode de paiement utilisée
     */
    private String paymentMethod;
    
    /**
     * Montant en centimes
     */
    private Long amount;
    
    /**
     * Devise
     */
    private String currency;
    
    /**
     * URL de redirection (pour Stripe)
     */
    private String redirectUrl;
    
    /**
     * Client secret (pour Stripe)
     */
    private String clientSecret;
    
    /**
     * Référence de transaction
     */
    private String transactionReference;
    
    /**
     * Instructions de paiement (pour virement, espèces)
     */
    private String paymentInstructions;
    
    /**
     * Date de création
     */
    private LocalDateTime createdAt;
    
    /**
     * Date de mise à jour
     */
    private LocalDateTime updatedAt;
    
    /**
     * Message d'erreur en cas d'échec
     */
    private String errorMessage;
    
    /**
     * Données additionnelles selon la méthode
     */
    private Map<String, Object> metadata;
    
    /**
     * Statuts possibles d'un paiement
     */
    public enum PaymentStatus {
        PENDING("En attente"),
        PROCESSING("En cours de traitement"),
        SUCCEEDED("Réussi"),
        FAILED("Échoué"),
        CANCELLED("Annulé"),
        REQUIRES_ACTION("Action requise"),
        REQUIRES_CONFIRMATION("Confirmation requise");
        
        private final String description;
        
        PaymentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // Constructors
    public PaymentResponse() {}
    
    public PaymentResponse(String paymentId, String entrepriseId, PaymentStatus status, String paymentMethod, Long amount) {
        this.paymentId = paymentId;
        this.entrepriseId = entrepriseId;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.currency = "xof";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    
    public String getEntrepriseId() { return entrepriseId; }
    public void setEntrepriseId(String entrepriseId) { this.entrepriseId = entrepriseId; }
    
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
    
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    
    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
    
    public String getPaymentInstructions() { return paymentInstructions; }
    public void setPaymentInstructions(String paymentInstructions) { this.paymentInstructions = paymentInstructions; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    /**
     * Constructeur pour succès rapide
     */
    public static PaymentResponse success(String paymentId, String entrepriseId, String method, Long amount) {
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(paymentId);
        response.setEntrepriseId(entrepriseId);
        response.setStatus(PaymentStatus.SUCCEEDED);
        response.setPaymentMethod(method);
        response.setAmount(amount);
        response.setCurrency("xof");
        response.setCreatedAt(LocalDateTime.now());
        response.setUpdatedAt(LocalDateTime.now());
        return response;
    }
    
    /**
     * Constructeur pour erreur rapide
     */
    public static PaymentResponse error(String entrepriseId, String method, String errorMessage) {
        PaymentResponse response = new PaymentResponse();
        response.setEntrepriseId(entrepriseId);
        response.setStatus(PaymentStatus.FAILED);
        response.setPaymentMethod(method);
        response.setErrorMessage(errorMessage);
        response.setCreatedAt(LocalDateTime.now());
        response.setUpdatedAt(LocalDateTime.now());
        return response;
    }
    
    /**
     * Builder pattern pour PaymentResponse
     */
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private PaymentResponse response = new PaymentResponse();
        
        public Builder paymentId(String paymentId) {
            response.setPaymentId(paymentId);
            return this;
        }
        
        public Builder entrepriseId(String entrepriseId) {
            response.setEntrepriseId(entrepriseId);
            return this;
        }
        
        public Builder status(PaymentStatus status) {
            response.setStatus(status);
            return this;
        }
        
        public Builder paymentMethod(String paymentMethod) {
            response.setPaymentMethod(paymentMethod);
            return this;
        }
        
        public Builder amount(Long amount) {
            response.setAmount(amount);
            return this;
        }
        
        public Builder currency(String currency) {
            response.setCurrency(currency);
            return this;
        }
        
        public Builder redirectUrl(String redirectUrl) {
            response.setRedirectUrl(redirectUrl);
            return this;
        }
        
        public Builder clientSecret(String clientSecret) {
            response.setClientSecret(clientSecret);
            return this;
        }
        
        public Builder transactionReference(String transactionReference) {
            response.setTransactionReference(transactionReference);
            return this;
        }
        
        public Builder paymentInstructions(String paymentInstructions) {
            response.setPaymentInstructions(paymentInstructions);
            return this;
        }
        
        public Builder createdAt(LocalDateTime createdAt) {
            response.setCreatedAt(createdAt);
            return this;
        }
        
        public Builder updatedAt(LocalDateTime updatedAt) {
            response.setUpdatedAt(updatedAt);
            return this;
        }
        
        public Builder errorMessage(String errorMessage) {
            response.setErrorMessage(errorMessage);
            return this;
        }
        
        public Builder metadata(Map<String, Object> metadata) {
            response.setMetadata(metadata);
            return this;
        }
        
        public PaymentResponse build() {
            return response;
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
