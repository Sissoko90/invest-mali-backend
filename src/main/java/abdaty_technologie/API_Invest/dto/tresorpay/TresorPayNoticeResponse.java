package abdaty_technologie.API_Invest.dto.tresorpay;

/**
 * DTO pour la réponse de création d'avis de recette TresorPay
 */
public class TresorPayNoticeResponse {
    private String reference;
    private String status;
    
    // Constructors
    public TresorPayNoticeResponse() {}
    
    public TresorPayNoticeResponse(String reference, String status) {
        this.reference = reference;
        this.status = status;
    }
    
    // Getters and Setters
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
