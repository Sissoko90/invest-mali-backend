package abdaty_technologie.API_Invest.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import abdaty_technologie.API_Invest.dto.chat.*;

import java.util.List;

/**
 * Interface du service de chat
 */
public interface ChatService {

    /**
     * Crée une nouvelle conversation
     */
    ConversationResponse createConversation(ConversationRequest request, String agentId);

    /**
     * Démarre une conversation depuis une entreprise
     */
    ConversationResponse startConversationFromEntreprise(String entrepriseId, StartConversationRequest request, String agentId);

    /**
     * Récupère une conversation par son ID
     */
    ConversationResponse getConversation(String conversationId, String userId);

    /**
     * Récupère toutes les conversations d'un agent
     */
    Page<ConversationResponse> getAgentConversations(String agentId, Pageable pageable);

    /**
     * Récupère toutes les conversations d'un utilisateur
     */
    Page<ConversationResponse> getUserConversations(String userId, Pageable pageable);

    /**
     * Envoie un nouveau message dans une conversation
     */
    MessageResponse sendMessage(String conversationId, MessageRequest request, String senderId);

    /**
     * Marque une conversation comme lue pour un utilisateur
     */
    void markConversationAsRead(String conversationId, String userId);

    /**
     * Ferme une conversation
     */
    ConversationResponse closeConversation(String conversationId, String userId);

    /**
     * Compte les messages non lus pour un agent
     */
    long getUnreadCountForAgent(String agentId);

    /**
     * Compte les messages non lus pour un utilisateur
     */
    long getUnreadCountForUser(String userId);

    /**
     * Recherche des conversations par mot-clé
     */
    List<ConversationResponse> searchConversations(String keyword, String userId);

    /**
     * Récupère les conversations avec des messages non lus pour un agent
     */
    List<ConversationResponse> getConversationsWithUnreadMessagesForAgent(String agentId);
}
