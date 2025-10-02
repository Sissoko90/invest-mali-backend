package abdaty_technologie.API_Invest.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO pour démarrer une conversation depuis une entreprise
 */
public class StartConversationRequest {

    @NotNull(message = "L'ID de l'utilisateur est obligatoire")
    private String userId;

    @Size(max = 255, message = "Le sujet ne peut pas dépasser 255 caractères")
    private String subject;

    @NotBlank(message = "Le message est obligatoire")
    @Size(max = 2000, message = "Le message ne peut pas dépasser 2000 caractères")
    private String message;

    private String priority; // NORMAL, HIGH, URGENT

    // Constructeurs
    public StartConversationRequest() {}

    public StartConversationRequest(String userId, String message) {
        this.userId = userId;
        this.message = message;
    }

    // Getters et Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
