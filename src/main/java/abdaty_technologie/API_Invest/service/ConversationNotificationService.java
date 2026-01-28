package abdaty_technologie.API_Invest.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

/**
 * Service de notification pour les conversations en temps réel
 * Version simple sans WebSocket (peut être étendu plus tard)
 */
@Service
public class ConversationNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(ConversationNotificationService.class);

    // Stockage en mémoire des notifications en attente
    private final Map<String, List<ConversationNotification>> pendingNotifications = new ConcurrentHashMap<>();

    /**
     * Envoie une notification de nouveau message
     */
    public void notifyNewMessage(String conversationId, String senderId, String recipientId, String messageContent) {
        logger.debug("📢 Notification nouveau message - Conversation: {}, De: {}, Vers: {}", 
                    conversationId, senderId, recipientId);

        ConversationNotification notification = new ConversationNotification(
            "NEW_MESSAGE",
            conversationId,
            senderId,
            messageContent,
            System.currentTimeMillis()
        );

        // Ajouter à la liste des notifications en attente pour le destinataire
        pendingNotifications.computeIfAbsent(recipientId, k -> new CopyOnWriteArrayList<>())
                           .add(notification);

        logger.debug("✅ Notification ajoutée pour utilisateur: {}", recipientId);
    }

    /**
     * Envoie une notification de conversation fermée
     */
    public void notifyConversationClosed(String conversationId, String agentId, String userId) {
        logger.debug("📢 Notification conversation fermée - Conversation: {}, Agent: {}, User: {}", 
                    conversationId, agentId, userId);

        ConversationNotification notification = new ConversationNotification(
            "CONVERSATION_CLOSED",
            conversationId,
            agentId,
            "La conversation a été fermée",
            System.currentTimeMillis()
        );

        // Notifier l'utilisateur
        pendingNotifications.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>())
                           .add(notification);

        logger.debug("✅ Notification fermeture envoyée à utilisateur: {}", userId);
    }

    /**
     * Envoie une notification de nouvelle conversation
     */
    public void notifyNewConversation(String conversationId, String agentId, String userId, String subject) {
        logger.debug("📢 Notification nouvelle conversation - Conversation: {}, Agent: {}, User: {}", 
                    conversationId, agentId, userId);

        ConversationNotification notification = new ConversationNotification(
            "NEW_CONVERSATION",
            conversationId,
            agentId,
            "Nouvelle conversation: " + subject,
            System.currentTimeMillis()
        );

        // Notifier l'utilisateur
        pendingNotifications.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>())
                           .add(notification);

        logger.debug("✅ Notification nouvelle conversation envoyée à utilisateur: {}", userId);
    }

    /**
     * Récupère les notifications en attente pour un utilisateur
     */
    public List<ConversationNotification> getPendingNotifications(String userId) {
        logger.debug("🔍 Récupération notifications pour utilisateur: {}", userId);
        
        List<ConversationNotification> notifications = pendingNotifications.getOrDefault(userId, new CopyOnWriteArrayList<>());
        
        logger.debug("📋 {} notifications trouvées pour utilisateur: {}", notifications.size(), userId);
        return notifications;
    }

    /**
     * Marque les notifications comme lues (les supprime)
     */
    public void markNotificationsAsRead(String userId) {
        logger.debug("✅ Marquage notifications comme lues pour utilisateur: {}", userId);
        
        List<ConversationNotification> removed = pendingNotifications.remove(userId);
        int count = removed != null ? removed.size() : 0;
        
        logger.debug("🗑️ {} notifications supprimées pour utilisateur: {}", count, userId);
    }

    /**
     * Compte le nombre de notifications non lues
     */
    public int getUnreadNotificationCount(String userId) {
        List<ConversationNotification> notifications = pendingNotifications.get(userId);
        int count = notifications != null ? notifications.size() : 0;
        
        logger.debug("📊 {} notifications non lues pour utilisateur: {}", count, userId);
        return count;
    }

    /**
     * Classe interne pour représenter une notification
     */
    public static class ConversationNotification {
        private final String type;
        private final String conversationId;
        private final String senderId;
        private final String message;
        private final long timestamp;

        public ConversationNotification(String type, String conversationId, String senderId, String message, long timestamp) {
            this.type = type;
            this.conversationId = conversationId;
            this.senderId = senderId;
            this.message = message;
            this.timestamp = timestamp;
        }

        // Getters
        public String getType() { return type; }
        public String getConversationId() { return conversationId; }
        public String getSenderId() { return senderId; }
        public String getMessage() { return message; }
        public long getTimestamp() { return timestamp; }
    }
}
