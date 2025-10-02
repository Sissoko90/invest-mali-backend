package abdaty_technologie.API_Invest.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO pour créer une nouvelle conversation
 */
public class ConversationRequest {

    @NotNull(message = "L'ID de l'entreprise est obligatoire")
    private String entrepriseId;

    @NotNull(message = "L'ID de l'utilisateur est obligatoire")
    private String userId;

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(max = 255, message = "Le sujet ne peut pas dépasser 255 caractères")
    private String subject;

    @NotBlank(message = "Le message initial est obligatoire")
    @Size(max = 2000, message = "Le message initial ne peut pas dépasser 2000 caractères")
    private String initialMessage;

    private String priority; // NORMAL, HIGH, URGENT

    // Constructeurs
    public ConversationRequest() {}

    public ConversationRequest(String entrepriseId, String userId, String subject, String initialMessage) {
        this.entrepriseId = entrepriseId;
        this.userId = userId;
        this.subject = subject;
        this.initialMessage = initialMessage;
    }

    // Getters et Setters
    public String getEntrepriseId() {
        return entrepriseId;
    }

    public void setEntrepriseId(String entrepriseId) {
        this.entrepriseId = entrepriseId;
    }

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

    public String getInitialMessage() {
        return initialMessage;
    }

    public void setInitialMessage(String initialMessage) {
        this.initialMessage = initialMessage;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
