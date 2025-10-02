package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;
import java.time.Instant;

import abdaty_technologie.API_Invest.Entity.Enum.MessageType;

/**
 * Entité représentant un message dans une conversation
 */
@Entity
@Table(name = "messages")
public class Message extends BaseEntity {

    // Référence à la conversation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    // Expéditeur du message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private Persons sender;

    // Contenu du message
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 50)
    private MessageType messageType = MessageType.TEXT;

    // Métadonnées de lecture
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    // Données spécifiques aux documents
    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    // Les timestamps sont hérités de BaseEntity (creation, modification)

    // Constructeurs
    public Message() {
        // Les timestamps sont gérés automatiquement par BaseEntity
    }

    public Message(Conversation conversation, Persons sender, String content) {
        this();
        this.conversation = conversation;
        this.sender = sender;
        this.content = content;
    }

    public Message(Conversation conversation, Persons sender, String content, MessageType messageType) {
        this(conversation, sender, content);
        this.messageType = messageType;
    }

    /**
     * Marque le message comme lu
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = Instant.now();
    }

    /**
     * Marque le message comme non lu
     */
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }

    /**
     * Vérifie si le message est un message système
     */
    public boolean isSystemMessage() {
        return this.messageType == MessageType.SYSTEM;
    }

    /**
     * Vérifie si le message concerne un document
     */
    public boolean isDocumentRelated() {
        return this.messageType == MessageType.DOCUMENT_REQUEST || 
               this.messageType == MessageType.DOCUMENT_UPLOAD;
    }

    /**
     * Crée un message de demande de document
     */
    public static Message createDocumentRequest(Conversation conversation, Persons sender, 
                                              String content, String documentName) {
        Message message = new Message(conversation, sender, content, MessageType.DOCUMENT_REQUEST);
        message.setDocumentName(documentName);
        return message;
    }

    /**
     * Crée un message d'upload de document
     */
    public static Message createDocumentUpload(Conversation conversation, Persons sender, 
                                             String content, String documentName, String documentUrl) {
        Message message = new Message(conversation, sender, content, MessageType.DOCUMENT_UPLOAD);
        message.setDocumentName(documentName);
        message.setDocumentUrl(documentUrl);
        return message;
    }

    /**
     * Crée un message système
     */
    public static Message createSystemMessage(Conversation conversation, String content) {
        return new Message(conversation, null, content, MessageType.SYSTEM);
    }

    // Getters et Setters
    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public Persons getSender() {
        return sender;
    }

    public void setSender(Persons sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
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

    // Les getters/setters pour creation et modification sont hérités de BaseEntity
}
