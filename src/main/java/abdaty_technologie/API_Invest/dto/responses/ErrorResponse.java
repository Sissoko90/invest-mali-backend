package abdaty_technologie.API_Invest.dto.responses;

/**
 * Classe de réponse pour les erreurs standardisée
 */
public class ErrorResponse {
    private String message;
    
    public ErrorResponse() {}
    
    public ErrorResponse(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}
