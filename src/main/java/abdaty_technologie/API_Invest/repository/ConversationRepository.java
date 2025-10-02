package abdaty_technologie.API_Invest.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    /**
     * Trouve toutes les conversations d'un agent
     */
    Page<Conversation> findByAgentIdOrderByModificationDesc(String agentId, Pageable pageable);

    /**
     * Trouve toutes les conversations d'un utilisateur
     */
    Page<Conversation> findByUserIdOrderByModificationDesc(String userId, Pageable pageable);

    /**
     * Trouve toutes les conversations liées à une entreprise
     */
    List<Conversation> findByEntrepriseIdOrderByCreationDesc(String entrepriseId);

    /**
     * Trouve une conversation spécifique entre un agent et un utilisateur pour une entreprise
     */
    Optional<Conversation> findByEntrepriseIdAndAgentIdAndUserId(String entrepriseId, String agentId, String userId);

    /**
     * Trouve les conversations actives d'un agent
     */
    @Query("SELECT c FROM Conversation c WHERE c.agent.id = :agentId AND c.status = :status ORDER BY c.modification DESC")
    List<Conversation> findActiveConversationsByAgent(@Param("agentId") String agentId, @Param("status") ConversationStatus status);

    /**
     * Trouve les conversations avec des messages non lus pour un agent
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN c.messages m " +
           "WHERE c.agent.id = :agentId " +
           "AND m.isRead = false " +
           "AND m.sender.id != :agentId " +
           "ORDER BY c.modification DESC")
    List<Conversation> findConversationsWithUnreadMessagesForAgent(@Param("agentId") String agentId);

    /**
     * Trouve les conversations avec des messages non lus pour un utilisateur
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN c.messages m " +
           "WHERE c.user.id = :userId " +
           "AND m.isRead = false " +
           "AND m.sender.id != :userId " +
           "ORDER BY c.modification DESC")
    List<Conversation> findConversationsWithUnreadMessagesForUser(@Param("userId") String userId);

    /**
     * Compte le nombre de conversations actives d'un agent
     */
    long countByAgentIdAndStatus(String agentId, ConversationStatus status);

    /**
     * Compte le nombre de messages non lus pour un agent
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "JOIN m.conversation c " +
           "WHERE c.agent.id = :agentId " +
           "AND m.isRead = false " +
           "AND m.sender.id != :agentId")
    long countUnreadMessagesForAgent(@Param("agentId") String agentId);

    /**
     * Compte le nombre de messages non lus pour un utilisateur
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "JOIN m.conversation c " +
           "WHERE c.user.id = :userId " +
           "AND m.isRead = false " +
           "AND m.sender.id != :userId")
    long countUnreadMessagesForUser(@Param("userId") String userId);

    /**
     * Trouve les conversations par statut avec pagination
     */
    Page<Conversation> findByStatusOrderByModificationDesc(ConversationStatus status, Pageable pageable);

    /**
     * Recherche dans les conversations par sujet
     */
    @Query("SELECT c FROM Conversation c " +
           "WHERE LOWER(c.subject) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY c.modification DESC")
    List<Conversation> searchBySubject(@Param("keyword") String keyword);
}
