package abdaty_technologie.API_Invest.Entity.Enum;

/**
 * Statut d'une conversation entre agent et utilisateur
 */
public enum ConversationStatus {
    /**
     * Conversation active - en cours de discussion
     */
    ACTIVE,
    
    /**
     * Conversation résolue - problème résolu mais conversation ouverte
     */
    RESOLVED,
    
    /**
     * Conversation fermée - terminée définitivement
     */
    CLOSED
}
