package abdaty_technologie.API_Invest.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import abdaty_technologie.API_Invest.Entity.Enum.MessageType;

/**
 * Requête pour envoyer un message
 */
public class SendMessageRequest {
    
    @NotBlank(message = "Le contenu du message est requis")
    @Size(max = 2000, message = "Le message ne peut pas dépasser 2000 caractères")
    public String content;
    
    public MessageType messageType = MessageType.TEXT;
    
    // Pour les messages de type DOCUMENT_REQUEST ou DOCUMENT_UPLOAD
    @Size(max = 255, message = "Le nom du document ne peut pas dépasser 255 caractères")
    public String documentName;
    
    @Size(max = 500, message = "L'URL du document ne peut pas dépasser 500 caractères")
    public String documentUrl;
    
    // Constructeur par défaut
    public SendMessageRequest() {}
}
