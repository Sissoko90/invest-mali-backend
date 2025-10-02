package abdaty_technologie.API_Invest.dto.chat;

import java.time.Instant;

/**
 * DTO pour retourner les informations d'un message
 */
public class MessageResponse {

    private String id;
    private String content;
    private String messageType;
    private Boolean isRead;
    private Instant creation;
    private Instant readAt;

    // Informations sur l'expéditeur
    private String senderId;
    private String senderNom;
    private String senderEmail;
    private String senderRole; // AGENT, USER

    // Données spécifiques aux documents
    private String documentName;
    private String documentUrl;

    // Constructeurs
    public MessageResponse() {}

    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public Instant getCreation() {
        return creation;
    }

    public void setCreation(Instant creation) {
        this.creation = creation;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderNom() {
        return senderNom;
    }

    public void setSenderNom(String senderNom) {
        this.senderNom = senderNom;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
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
}
