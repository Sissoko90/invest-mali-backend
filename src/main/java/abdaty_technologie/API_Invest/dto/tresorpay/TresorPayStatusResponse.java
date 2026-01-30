<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto.tresorpay;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse de statut d'avis TresorPay
 */
public class TresorPayStatusResponse {
    private String reference;
    private String provider;
    private LocalDateTime payDate;
    private String status;
    
    // Constructors
    public TresorPayStatusResponse() {}
    
    public TresorPayStatusResponse(String reference, String provider, LocalDateTime payDate, String status) {
        this.reference = reference;
        this.provider = provider;
        this.payDate = payDate;
        this.status = status;
    }
    
    // Getters and Setters
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    
    public LocalDateTime getPayDate() { return payDate; }
    public void setPayDate(LocalDateTime payDate) { this.payDate = payDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
=======
package abdaty_technologie.API_Invest.dto.tresorpay;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse de statut d'avis TresorPay
 */
public class TresorPayStatusResponse {
    private String reference;
    private String provider;
    private LocalDateTime payDate;
    private String status;
    
    // Constructors
    public TresorPayStatusResponse() {}
    
    public TresorPayStatusResponse(String reference, String provider, LocalDateTime payDate, String status) {
        this.reference = reference;
        this.provider = provider;
        this.payDate = payDate;
        this.status = status;
    }
    
    // Getters and Setters
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    
    public LocalDateTime getPayDate() { return payDate; }
    public void setPayDate(LocalDateTime payDate) { this.payDate = payDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
