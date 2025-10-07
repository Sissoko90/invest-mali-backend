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
     * Trouve toutes les conversations où l'utilisateur est participant (agent ou user)
     */
    List<Conversation> findByUserIdOrAgentIdOrderByModificationDesc(String userId, String agentId);

    /**
     * Trouve toutes les conversations où l'utilisateur est participant dans une entreprise spécifique
     */
    @Query("SELECT c FROM Conversation c WHERE (c.user.id = :userId OR c.agent.id = :agentId) AND c.entreprise.id = :entrepriseId ORDER BY c.modification DESC")
    List<Conversation> findByUserIdOrAgentIdAndEntrepriseIdOrderByModificationDesc(@Param("userId") String userId, @Param("agentId") String agentId, @Param("entrepriseId") String entrepriseId);

    /**
     * Trouve toutes les conversations liées à une entreprise
     */
    List<Conversation> findByEntrepriseIdOrderByCreationDesc(String entrepriseId);

    /**
     * Trouve une conversation spécifique entre un agent et un utilisateur pour une entreprise
     */
    @Query("SELECT c FROM Conversation c WHERE c.entreprise.id = :entrepriseId AND c.agent.id = :agentId AND c.user.id = :userId AND c.status = 'ACTIVE' ORDER BY c.creation DESC")
    List<Conversation> findByEntrepriseIdAndAgentIdAndUserId(@Param("entrepriseId") String entrepriseId, @Param("agentId") String agentId, @Param("userId") String userId);

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

    /**
     * Trouve les conversations actives d'un agent dans une entreprise spécifique
     */
    @Query("SELECT c FROM Conversation c WHERE c.agent.id = :agentId AND c.entreprise.id = :entrepriseId AND c.status = :status ORDER BY c.modification DESC")
    List<Conversation> findActiveConversationsByAgentAndEntreprise(@Param("agentId") String agentId, @Param("entrepriseId") String entrepriseId, @Param("status") ConversationStatus status);

    /**
     * Trouve une conversation active entre deux participants (peu importe qui est agent/user) dans une entreprise
     */
    @Query("SELECT c FROM Conversation c WHERE c.entreprise.id = :entrepriseId AND c.status = 'ACTIVE' AND " +
           "((c.agent.id = :participant1 AND c.user.id = :participant2) OR " +
           "(c.agent.id = :participant2 AND c.user.id = :participant1)) " +
           "ORDER BY c.creation DESC")
    List<Conversation> findActiveConversationBetweenParticipants(@Param("entrepriseId") String entrepriseId, @Param("participant1") String participant1, @Param("participant2") String participant2);
}
