package abdaty_technologie.API_Invest.orangemoney.v2.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèle pour les notifications de callback Orange Money V2
 * Utilisé pour recevoir les notifications de statut de paiement
 */
public class PaymentNotificationV2 {
    
    @JsonProperty("order_id")
    private String orderId;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("transaction_id")
    private String transactionId;
    
    @JsonProperty("amount")
    private Integer amount;
    
    @JsonProperty("currency")
    private String currency;
    
    @JsonProperty("notif_token")
    private String notifToken;
    
    @JsonProperty("pay_token")
    private String payToken;
    
    @JsonProperty("message")
    private String message;
    
    public PaymentNotificationV2() {}
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public Integer getAmount() {
        return amount;
    }
    
    public void setAmount(Integer amount) {
        this.amount = amount;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getNotifToken() {
        return notifToken;
    }
    
    public void setNotifToken(String notifToken) {
        this.notifToken = notifToken;
    }
    
    public String getPayToken() {
        return payToken;
    }
    
    public void setPayToken(String payToken) {
        this.payToken = payToken;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    /**
     * Vérifie si la notification indique un paiement réussi
     */
    public boolean isSuccess() {
        return "success".equalsIgnoreCase(status) || "completed".equalsIgnoreCase(status);
    }
    
    /**
     * Vérifie si la notification indique un paiement échoué
     */
    public boolean isFailed() {
        return "failed".equalsIgnoreCase(status) || "error".equalsIgnoreCase(status);
    }
    
    /**
     * Vérifie si la notification indique un paiement annulé
     */
    public boolean isCancelled() {
        return "cancelled".equalsIgnoreCase(status) || "canceled".equalsIgnoreCase(status);
    }
    
    @Override
    public String toString() {
        return "PaymentNotificationV2{" +
                "orderId='" + orderId + '\'' +
                ", status='" + status + '\'' +
                ", transactionId='" + transactionId + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", notifToken='" + (notifToken != null ? "***" : null) + '\'' +
                ", payToken='" + (payToken != null ? "***" : null) + '\'' +
                ", message='" + message + '\'' +
                '}';
    }
}
