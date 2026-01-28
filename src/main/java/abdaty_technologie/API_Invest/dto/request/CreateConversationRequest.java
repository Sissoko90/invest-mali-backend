package abdaty_technologie.API_Invest.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import abdaty_technologie.API_Invest.Entity.Enum.ConversationPriority;

/**
 * Requête pour créer une nouvelle conversation
 */
public class CreateConversationRequest {
    
    @NotBlank(message = "L'ID de l'entreprise est requis")
    public String entrepriseId;
    
    @NotBlank(message = "L'ID de l'utilisateur est requis")
    public String userId;
    
    @NotBlank(message = "Le sujet est requis")
    @Size(max = 255, message = "Le sujet ne peut pas dépasser 255 caractères")
    public String subject;
    
    public ConversationPriority priority = ConversationPriority.NORMAL;
    
    @NotBlank(message = "Le message initial est requis")
    @Size(max = 2000, message = "Le message ne peut pas dépasser 2000 caractères")
    public String initialMessage;
    
    // Constructeur par défaut
    public CreateConversationRequest() {}
}
