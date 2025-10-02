package abdaty_technologie.API_Invest.Entity.Enum;

/**
 * Type de message dans une conversation
 */
public enum MessageType {
    /**
     * Message texte simple
     */
    TEXT,
    
    /**
     * Demande de document spécifique
     */
    DOCUMENT_REQUEST,
    
    /**
     * Upload d'un document
     */
    DOCUMENT_UPLOAD,
    
    /**
     * Message système automatique
     */
    SYSTEM
}
