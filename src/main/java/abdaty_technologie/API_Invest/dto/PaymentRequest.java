<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
/**
 * DTO pour les requêtes de paiement
 */
public class PaymentRequest {
    
    /**
     * ID de l'entreprise pour laquelle le paiement est effectué
     */
    @NotBlank(message = "L'ID de l'entreprise est obligatoire")
    private String entrepriseId;
    
    /**
     * Méthode de paiement choisie
     */
    @NotBlank(message = "La méthode de paiement est obligatoire")
    @Pattern(regexp = "TRESORPAY|CASH", 
             message = "Méthode de paiement invalide. Utilisez TRESORPAY ou CASH.")
    private String paymentMethod;
    
    /**
     * Montant en centimes (XOF)
     */
    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private Long amount;
    
    /**
     * Devise (par défaut XOF)
     */
    private String currency = "xof";
    
    /**
     * Description du paiement
     */
    private String description;
    
    /**
     * URL de retour après paiement réussi
     */
    private String successUrl;
    
    /**
     * URL de retour après paiement annulé
     */
    private String cancelUrl;
    
    /**
     * Données spécifiques à la méthode de paiement
     */
    private PaymentMethodData methodData;
    
    // Constructors
    public PaymentRequest() {}
    
    public PaymentRequest(String entrepriseId, String paymentMethod, Long amount) {
        this.entrepriseId = entrepriseId;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
    }
    
    // Getters and Setters
    public String getEntrepriseId() { return entrepriseId; }
    public void setEntrepriseId(String entrepriseId) { this.entrepriseId = entrepriseId; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getSuccessUrl() { return successUrl; }
    public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }
    
    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
    
    public PaymentMethodData getMethodData() { return methodData; }
    public void setMethodData(PaymentMethodData methodData) { this.methodData = methodData; }
    
    /**
     * Données spécifiques selon la méthode de paiement
     */
    public static class PaymentMethodData {
        // Pour Orange Money / Moov Money
        private String phoneNumber;
        private String paymentProvider;
        
        // Pour virement bancaire
        private String bankAccount;
        private String bankCode;
        
        // Pour Stripe
        private String stripeToken;
        private String paymentMethodId;
        
        // Pour espèces
        private String cashReference;
        private String agencyLocation;
        
        // Constructors
        public PaymentMethodData() {}
        
        public PaymentMethodData(String phoneNumber, String bankAccount, String bankCode) {
            this.phoneNumber = phoneNumber;
            this.bankAccount = bankAccount;
            this.bankCode = bankCode;
        }
        
        // Getters and Setters
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        
        public String getPaymentProvider() { return paymentProvider; }
        public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
        
        public String getBankAccount() { return bankAccount; }
        public void setBankAccount(String bankAccount) { this.bankAccount = bankAccount; }
        
        public String getBankCode() { return bankCode; }
        public void setBankCode(String bankCode) { this.bankCode = bankCode; }
        
        public String getStripeToken() { return stripeToken; }
        public void setStripeToken(String stripeToken) { this.stripeToken = stripeToken; }
        
        public String getPaymentMethodId() { return paymentMethodId; }
        public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }
        
        public String getCashReference() { return cashReference; }
        public void setCashReference(String cashReference) { this.cashReference = cashReference; }
        
        public String getAgencyLocation() { return agencyLocation; }
        public void setAgencyLocation(String agencyLocation) { this.agencyLocation = agencyLocation; }
    }
}
=======
package abdaty_technologie.API_Invest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
/**
 * DTO pour les requêtes de paiement
 */
public class PaymentRequest {
    
    /**
     * ID de l'entreprise pour laquelle le paiement est effectué
     */
    @NotBlank(message = "L'ID de l'entreprise est obligatoire")
    private String entrepriseId;
    
    /**
     * Méthode de paiement choisie
     */
    @NotBlank(message = "La méthode de paiement est obligatoire")
    @Pattern(regexp = "TRESORPAY|CASH", 
             message = "Méthode de paiement invalide. Utilisez TRESORPAY ou CASH.")
    private String paymentMethod;
    
    /**
     * Montant en centimes (XOF)
     */
    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private Long amount;
    
    /**
     * Devise (par défaut XOF)
     */
    private String currency = "xof";
    
    /**
     * Description du paiement
     */
    private String description;
    
    /**
     * URL de retour après paiement réussi
     */
    private String successUrl;
    
    /**
     * URL de retour après paiement annulé
     */
    private String cancelUrl;
    
    /**
     * Données spécifiques à la méthode de paiement
     */
    private PaymentMethodData methodData;
    
    // Constructors
    public PaymentRequest() {}
    
    public PaymentRequest(String entrepriseId, String paymentMethod, Long amount) {
        this.entrepriseId = entrepriseId;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
    }
    
    // Getters and Setters
    public String getEntrepriseId() { return entrepriseId; }
    public void setEntrepriseId(String entrepriseId) { this.entrepriseId = entrepriseId; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getSuccessUrl() { return successUrl; }
    public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }
    
    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
    
    public PaymentMethodData getMethodData() { return methodData; }
    public void setMethodData(PaymentMethodData methodData) { this.methodData = methodData; }
    
    /**
     * Données spécifiques selon la méthode de paiement
     */
    public static class PaymentMethodData {
        // Pour Orange Money / Moov Money
        private String phoneNumber;
        private String paymentProvider;
        
        // Pour virement bancaire
        private String bankAccount;
        private String bankCode;
        
        // Pour Stripe
        private String stripeToken;
        private String paymentMethodId;
        
        // Pour espèces
        private String cashReference;
        private String agencyLocation;
        
        // Constructors
        public PaymentMethodData() {}
        
        public PaymentMethodData(String phoneNumber, String bankAccount, String bankCode) {
            this.phoneNumber = phoneNumber;
            this.bankAccount = bankAccount;
            this.bankCode = bankCode;
        }
        
        // Getters and Setters
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        
        public String getPaymentProvider() { return paymentProvider; }
        public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
        
        public String getBankAccount() { return bankAccount; }
        public void setBankAccount(String bankAccount) { this.bankAccount = bankAccount; }
        
        public String getBankCode() { return bankCode; }
        public void setBankCode(String bankCode) { this.bankCode = bankCode; }
        
        public String getStripeToken() { return stripeToken; }
        public void setStripeToken(String stripeToken) { this.stripeToken = stripeToken; }
        
        public String getPaymentMethodId() { return paymentMethodId; }
        public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }
        
        public String getCashReference() { return cashReference; }
        public void setCashReference(String cashReference) { this.cashReference = cashReference; }
        
        public String getAgencyLocation() { return agencyLocation; }
        public void setAgencyLocation(String agencyLocation) { this.agencyLocation = agencyLocation; }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
