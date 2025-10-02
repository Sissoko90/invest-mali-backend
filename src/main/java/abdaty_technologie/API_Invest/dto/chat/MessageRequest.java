package abdaty_technologie.API_Invest.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO pour envoyer un nouveau message
 */
public class MessageRequest {

    @NotBlank(message = "Le contenu du message est obligatoire")
    @Size(max = 2000, message = "Le message ne peut pas dépasser 2000 caractères")
    private String content;

    private String messageType = "TEXT"; // TEXT, DOCUMENT_REQUEST, DOCUMENT_UPLOAD, SYSTEM

    // Champs spécifiques aux documents
    private String documentName;
    private String documentUrl;

    // Constructeurs
    public MessageRequest() {}

    public MessageRequest(String content) {
        this.content = content;
    }

    public MessageRequest(String content, String messageType) {
        this.content = content;
        this.messageType = messageType;
    }

    // Getters et Setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }
}
