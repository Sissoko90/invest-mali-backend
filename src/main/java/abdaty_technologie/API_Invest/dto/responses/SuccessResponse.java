package abdaty_technologie.API_Invest.dto.responses;

/**
 * Classe de réponse pour les succès standardisée
 */
public class SuccessResponse {
    private String message;
    
    public SuccessResponse() {}
    
    public SuccessResponse(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}
