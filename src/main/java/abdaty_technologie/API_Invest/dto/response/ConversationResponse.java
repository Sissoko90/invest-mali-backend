package abdaty_technologie.API_Invest.dto.response;

import java.time.Instant;
import java.util.List;

import abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus;
import abdaty_technologie.API_Invest.Entity.Enum.ConversationPriority;

/**
 * Réponse API pour une conversation
 */
public class ConversationResponse {
    
    public String id;
    
    // Références
    public String entrepriseId;
    public String entrepriseNom;
    public String agentId;
    public String agentNom;
    public String userId;
    public String userNom;
    
    // Métadonnées
    public String subject;
    public ConversationStatus status;
    public ConversationPriority priority;
    
    // Statistiques
    public long totalMessages;
    public long unreadMessages;
    public MessageResponse lastMessage;
    
    // Timestamps
    public Instant createdAt;
    public Instant updatedAt;
    public Instant closedAt;
    
    // Messages (optionnel, pour les détails)
    public List<MessageResponse> messages;
    
    // Constructeur par défaut
    public ConversationResponse() {}
}
