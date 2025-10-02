package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

import abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus;
import abdaty_technologie.API_Invest.Entity.Enum.ConversationPriority;

/**
 * Entité représentant une conversation entre un agent et un utilisateur
 * concernant une demande d'entreprise
 */
@Entity
@Table(name = "conversations")
public class Conversation extends BaseEntity {

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private Persons agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Persons user;

    // Métadonnées de la conversation
    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 50)
    private ConversationPriority priority = ConversationPriority.NORMAL;

    // Timestamp spécifique (les autres sont hérités de BaseEntity)
    @Column(name = "closed_at")
    private Instant closedAt;

    // Messages de la conversation
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("creation ASC")
    private List<Message> messages;

    // Constructeurs
    public Conversation() {
        // Les timestamps sont gérés automatiquement par BaseEntity
    }

    public Conversation(Entreprise entreprise, Persons agent, Persons user, String subject) {
        this();
        this.entreprise = entreprise;
        this.agent = agent;
        this.user = user;
        this.subject = subject;
    }

    // Les méthodes de mise à jour des timestamps sont héritées de BaseEntity

    /**
     * Ferme la conversation
     */
    public void close() {
        this.status = ConversationStatus.CLOSED;
        this.closedAt = Instant.now();
    }

    /**
     * Marque la conversation comme résolue
     */
    public void resolve() {
        this.status = ConversationStatus.RESOLVED;
    }

    /**
     * Réactive une conversation fermée ou résolue
     */
    public void reactivate() {
        this.status = ConversationStatus.ACTIVE;
        this.closedAt = null;
    }

    /**
     * Vérifie si la conversation est active
     */
    public boolean isActive() {
        return this.status == ConversationStatus.ACTIVE;
    }

    // Getters et Setters
    public Entreprise getEntreprise() {
        return entreprise;
    }

    public void setEntreprise(Entreprise entreprise) {
        this.entreprise = entreprise;
    }

    public Persons getAgent() {
        return agent;
    }

    public void setAgent(Persons agent) {
        this.agent = agent;
    }

    public Persons getUser() {
        return user;
    }

    public void setUser(Persons user) {
        this.user = user;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public ConversationStatus getStatus() {
        return status;
    }

    public void setStatus(ConversationStatus status) {
        this.status = status;
    }

    public ConversationPriority getPriority() {
        return priority;
    }

    public void setPriority(ConversationPriority priority) {
        this.priority = priority;
    }

    // Les getters/setters pour creation et modification sont hérités de BaseEntity

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }
}
