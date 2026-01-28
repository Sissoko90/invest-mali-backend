package abdaty_technologie.API_Invest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus;

import java.util.List;
import java.util.Optional;

/**
 * Repository sécurisé pour les conversations avec vérifications d'accès
 */
@Repository
public interface ConversationSecureRepository extends JpaRepository<Conversation, String> {

    /**
     * Trouve une conversation active pour une entreprise donnée
     * Respecte la règle : une seule conversation ACTIVE par entreprise
     */
    @Query("SELECT c FROM Conversation c WHERE c.entreprise.id = :entrepriseId AND c.status = 'ACTIVE'")
    Optional<Conversation> findActiveConversationByEntreprise(@Param("entrepriseId") String entrepriseId);

    /**
     * Vérifie s'il existe déjà une conversation active pour une entreprise
     */
    @Query("SELECT COUNT(c) > 0 FROM Conversation c WHERE c.entreprise.id = :entrepriseId AND c.status = 'ACTIVE'")
    boolean existsActiveConversationForEntreprise(@Param("entrepriseId") String entrepriseId);

    /**
     * Trouve toutes les conversations d'un agent (pour l'interface agent)
     */
    @Query("SELECT c FROM Conversation c WHERE c.agent.id = :agentId ORDER BY c.modification DESC")
    List<Conversation> findConversationsByAgent(@Param("agentId") String agentId);

    /**
     * Trouve toutes les conversations d'un utilisateur (pour l'interface utilisateur)
     * L'utilisateur ne peut voir que les conversations de ses entreprises
     */
    @Query("SELECT c FROM Conversation c WHERE c.user.id = :userId ORDER BY c.modification DESC")
    List<Conversation> findConversationsByUser(@Param("userId") String userId);

    /**
     * Trouve une conversation spécifique avec vérification d'accès agent
     */
    @Query("SELECT c FROM Conversation c WHERE c.id = :conversationId AND c.agent.id = :agentId")
    Optional<Conversation> findByIdAndAgent(@Param("conversationId") String conversationId, @Param("agentId") String agentId);

    /**
     * Trouve une conversation spécifique avec vérification d'accès utilisateur
     */
    @Query("SELECT c FROM Conversation c WHERE c.id = :conversationId AND c.user.id = :userId")
    Optional<Conversation> findByIdAndUser(@Param("conversationId") String conversationId, @Param("userId") String userId);

    /**
     * Trouve toutes les conversations d'une entreprise (pour l'historique)
     */
    @Query("SELECT c FROM Conversation c WHERE c.entreprise.id = :entrepriseId ORDER BY c.creation DESC")
    List<Conversation> findConversationsByEntreprise(@Param("entrepriseId") String entrepriseId);

    /**
     * Trouve les conversations actives d'un agent avec filtrage par entreprise
     */
    @Query("SELECT c FROM Conversation c WHERE c.agent.id = :agentId AND c.status = 'ACTIVE' " +
           "AND (:entrepriseId IS NULL OR c.entreprise.id = :entrepriseId) ORDER BY c.modification DESC")
    List<Conversation> findActiveConversationsByAgentAndEntreprise(@Param("agentId") String agentId, 
                                                                   @Param("entrepriseId") String entrepriseId);

    /**
     * Compte les conversations non lues pour un agent
     */
    @Query("SELECT COUNT(c) FROM Conversation c JOIN c.messages m WHERE c.agent.id = :agentId " +
           "AND m.isRead = false AND m.sender.id != :agentId")
    long countUnreadConversationsForAgent(@Param("agentId") String agentId);

    /**
     * Compte les conversations non lues pour un utilisateur
     */
    @Query("SELECT COUNT(c) FROM Conversation c JOIN c.messages m WHERE c.user.id = :userId " +
           "AND m.isRead = false AND m.sender.id != :userId")
    long countUnreadConversationsForUser(@Param("userId") String userId);

    /**
     * Trouve les conversations par statut
     */
    @Query("SELECT c FROM Conversation c WHERE c.status = :status ORDER BY c.modification DESC")
    List<Conversation> findConversationsByStatus(@Param("status") ConversationStatus status);

    /**
     * Vérifie si un utilisateur a accès à une conversation
     * (soit comme agent, soit comme utilisateur de l'entreprise)
     */
    @Query("SELECT COUNT(c) > 0 FROM Conversation c WHERE c.id = :conversationId " +
           "AND (c.agent.id = :personId OR c.user.id = :personId)")
    boolean hasAccessToConversation(@Param("conversationId") String conversationId, @Param("personId") String personId);

    /**
     * Trouve la dernière conversation d'une entreprise (pour continuer une discussion)
     */
    @Query("SELECT c FROM Conversation c WHERE c.entreprise.id = :entrepriseId " +
           "ORDER BY c.modification DESC LIMIT 1")
    Optional<Conversation> findLatestConversationByEntreprise(@Param("entrepriseId") String entrepriseId);
}
