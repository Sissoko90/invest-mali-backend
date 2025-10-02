package abdaty_technologie.API_Invest.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Enum.MessageType;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    /**
     * Trouve tous les messages d'une conversation
     */
    Page<Message> findByConversationIdOrderByCreationAsc(String conversationId, Pageable pageable);

    /**
     * Trouve tous les messages d'une conversation (liste simple)
     */
    List<Message> findByConversationIdOrderByCreationAsc(String conversationId);

    /**
     * Trouve les messages non lus d'une conversation pour un utilisateur spécifique
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.isRead = false " +
           "AND m.sender.id != :userId " +
           "ORDER BY m.creation ASC")
    List<Message> findUnreadMessagesInConversationForUser(@Param("conversationId") String conversationId, 
                                                         @Param("userId") String userId);

    /**
     * Trouve les derniers messages d'une conversation
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.creation DESC")
    Page<Message> findLatestMessagesInConversation(@Param("conversationId") String conversationId, Pageable pageable);

    /**
     * Marque tous les messages d'une conversation comme lus pour un utilisateur
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id != :userId " +
           "AND m.isRead = false")
    int markAllMessagesAsReadInConversation(@Param("conversationId") String conversationId, 
                                           @Param("userId") String userId);

    /**
     * Compte les messages non lus dans une conversation pour un utilisateur
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.isRead = false " +
           "AND m.sender.id != :userId")
    long countUnreadMessagesInConversationForUser(@Param("conversationId") String conversationId, 
                                                 @Param("userId") String userId);

    /**
     * Trouve les messages par type
     */
    List<Message> findByConversationIdAndMessageTypeOrderByCreationAsc(String conversationId, MessageType messageType);

    /**
     * Trouve le dernier message d'une conversation
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.creation DESC " +
           "LIMIT 1")
    Message findLastMessageInConversation(@Param("conversationId") String conversationId);

    /**
     * Trouve les messages contenant un mot-clé
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY m.creation ASC")
    List<Message> searchMessagesInConversation(@Param("conversationId") String conversationId, 
                                              @Param("keyword") String keyword);

    /**
     * Supprime tous les messages d'une conversation
     */
    void deleteByConversationId(String conversationId);

    /**
     * Compte le nombre total de messages dans une conversation
     */
    long countByConversationId(String conversationId);

    /**
     * Trouve les messages d'un expéditeur spécifique dans une conversation
     */
    List<Message> findByConversationIdAndSenderIdOrderByCreationAsc(String conversationId, String senderId);
}
