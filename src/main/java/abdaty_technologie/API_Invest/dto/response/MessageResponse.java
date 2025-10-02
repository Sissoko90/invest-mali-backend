package abdaty_technologie.API_Invest.dto.response;

import java.time.Instant;

import abdaty_technologie.API_Invest.Entity.Enum.MessageType;

/**
 * Réponse API pour un message
 */
public class MessageResponse {
    
    public String id;
    
    // Références
    public String conversationId;
    public String senderId;
    public String senderName;
    public String senderUsername;
    
    // Contenu
    public String content;
    public MessageType messageType;
    
    // Métadonnées de lecture
    public Boolean isRead;
    public Instant readAt;
    
    // Documents (si applicable)
    public String documentName;
    public String documentUrl;
    
    // Timestamps
    public Instant createdAt;
    public Instant updatedAt;
    
    // Constructeur par défaut
    public MessageResponse() {}
}
