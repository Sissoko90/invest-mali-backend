<<<<<<< HEAD
package abdaty_technologie.API_Invest.orangemoney.v2.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèle pour la réponse du webpayment Orange Money
 * Basé exactement sur la réponse du test Postman fourni
 */
public class WebPaymentResponse {
    
    @JsonProperty("status")
    private Integer status;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("pay_token")
    private String payToken;
    
    @JsonProperty("payment_url")
    private String paymentUrl;
    
    @JsonProperty("notif_token")
    private String notifToken;
    
    public WebPaymentResponse() {}
    
    public Integer getStatus() {
        return status;
    }
    
    public void setStatus(Integer status) {
        this.status = status;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getPayToken() {
        return payToken;
    }
    
    public void setPayToken(String payToken) {
        this.payToken = payToken;
    }
    
    public String getPaymentUrl() {
        return paymentUrl;
    }
    
    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }
    
    public String getNotifToken() {
        return notifToken;
    }
    
    public void setNotifToken(String notifToken) {
        this.notifToken = notifToken;
    }
    
    /**
     * Vérifie si la réponse indique un succès
     * Selon le test Postman, status = 201 indique un succès
     */
    public boolean isSuccess() {
        return status != null && status == 201 && paymentUrl != null && !paymentUrl.trim().isEmpty();
    }
    
    @Override
    public String toString() {
        return "WebPaymentResponse{" +
                "status=" + status +
                ", message='" + message + '\'' +
                ", payToken='" + (payToken != null ? "***" + payToken.substring(Math.max(0, payToken.length() - 10)) : null) + '\'' +
                ", paymentUrl='" + paymentUrl + '\'' +
                ", notifToken='" + (notifToken != null ? "***" + notifToken.substring(Math.max(0, notifToken.length() - 10)) : null) + '\'' +
                '}';
    }
}
=======
package abdaty_technologie.API_Invest.orangemoney.v2.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèle pour la réponse du webpayment Orange Money
 * Basé exactement sur la réponse du test Postman fourni
 */
public class WebPaymentResponse {
    
    @JsonProperty("status")
    private Integer status;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("pay_token")
    private String payToken;
    
    @JsonProperty("payment_url")
    private String paymentUrl;
    
    @JsonProperty("notif_token")
    private String notifToken;
    
    public WebPaymentResponse() {}
    
    public Integer getStatus() {
        return status;
    }
    
    public void setStatus(Integer status) {
        this.status = status;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getPayToken() {
        return payToken;
    }
    
    public void setPayToken(String payToken) {
        this.payToken = payToken;
    }
    
    public String getPaymentUrl() {
        return paymentUrl;
    }
    
    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }
    
    public String getNotifToken() {
        return notifToken;
    }
    
    public void setNotifToken(String notifToken) {
        this.notifToken = notifToken;
    }
    
    /**
     * Vérifie si la réponse indique un succès
     * Selon le test Postman, status = 201 indique un succès
     */
    public boolean isSuccess() {
        return status != null && status == 201 && paymentUrl != null && !paymentUrl.trim().isEmpty();
    }
    
    @Override
    public String toString() {
        return "WebPaymentResponse{" +
                "status=" + status +
                ", message='" + message + '\'' +
                ", payToken='" + (payToken != null ? "***" + payToken.substring(Math.max(0, payToken.length() - 10)) : null) + '\'' +
                ", paymentUrl='" + paymentUrl + '\'' +
                ", notifToken='" + (notifToken != null ? "***" + notifToken.substring(Math.max(0, notifToken.length() - 10)) : null) + '\'' +
                '}';
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
