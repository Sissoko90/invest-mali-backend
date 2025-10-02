package abdaty_technologie.API_Invest.Entity.Enum;

/**
 * Priorité d'une conversation
 */
public enum ConversationPriority {
    /**
     * Priorité basse - questions générales
     */
    LOW,
    
    /**
     * Priorité normale - cas standard
     */
    NORMAL,
    
    /**
     * Priorité haute - documents importants manquants
     */
    HIGH,
    
    /**
     * Priorité urgente - blocage critique
     */
    URGENT
}
