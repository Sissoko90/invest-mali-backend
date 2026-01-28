package abdaty_technologie.API_Invest.orangemoney.v2.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèle pour la requête de webpayment Orange Money
 * Basé exactement sur le test Postman fourni
 */
public class WebPaymentRequest {
    
    @JsonProperty("merchant_key")
    private String merchantKey;
    
    @JsonProperty("currency")
    private String currency = "OUV"; // Devise par défaut selon le test
    
    @JsonProperty("order_id")
    private String orderId;
    
    @JsonProperty("amount")
    private Integer amount; // Utiliser Integer selon le test (14000)
    
    @JsonProperty("return_url")
    private String returnUrl;
    
    @JsonProperty("cancel_url")
    private String cancelUrl;
    
    @JsonProperty("notif_url")
    private String notifUrl;
    
    @JsonProperty("lang")
    private String lang = "fr";
    
    @JsonProperty("reference")
    private String reference;
    
    public WebPaymentRequest() {}
    
    public WebPaymentRequest(String merchantKey, String orderId, Integer amount, String reference) {
        this.merchantKey = merchantKey;
        this.orderId = orderId;
        this.amount = amount;
        this.reference = reference;
    }
    
    // Getters et Setters
    public String getMerchantKey() {
        return merchantKey;
    }
    
    public void setMerchantKey(String merchantKey) {
        this.merchantKey = merchantKey;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public Integer getAmount() {
        return amount;
    }
    
    public void setAmount(Integer amount) {
        this.amount = amount;
    }
    
    public String getReturnUrl() {
        return returnUrl;
    }
    
    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }
    
    public String getCancelUrl() {
        return cancelUrl;
    }
    
    public void setCancelUrl(String cancelUrl) {
        this.cancelUrl = cancelUrl;
    }
    
    public String getNotifUrl() {
        return notifUrl;
    }
    
    public void setNotifUrl(String notifUrl) {
        this.notifUrl = notifUrl;
    }
    
    public String getLang() {
        return lang;
    }
    
    public void setLang(String lang) {
        this.lang = lang;
    }
    
    public String getReference() {
        return reference;
    }
    
    public void setReference(String reference) {
        this.reference = reference;
    }
    
    @Override
    public String toString() {
        return "WebPaymentRequest{" +
                "merchantKey='" + (merchantKey != null ? "***" : null) + '\'' +
                ", currency='" + currency + '\'' +
                ", orderId='" + orderId + '\'' +
                ", amount=" + amount +
                ", returnUrl='" + returnUrl + '\'' +
                ", cancelUrl='" + cancelUrl + '\'' +
                ", notifUrl='" + notifUrl + '\'' +
                ", lang='" + lang + '\'' +
                ", reference='" + reference + '\'' +
                '}';
    }
}
