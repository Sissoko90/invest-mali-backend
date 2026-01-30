<<<<<<< HEAD
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
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.creation ASC")
    Page<Message> findByConversationIdOrderByCreationAsc(@Param("conversationId") String conversationId, Pageable pageable);

    /**
     * Trouve tous les messages d'une conversation (liste simple)
     */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = ?1 ORDER BY m.creation ASC")
    List<Message> findByConversation_IdOrderByCreationAsc(String conversationId);

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
    @Query("UPDATE Message m SET m.isRead = true " +
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
     * Trouve tous les messages d'une conversation avec requête native
     */
    @Query(value = "SELECT m.id, m.content, m.created_at, m.sender_id, m.conversation_id, m.message_type, m.is_read FROM messages m WHERE m.conversation_id = :conversationId ORDER BY m.created_at ASC", nativeQuery = true)
    List<Object[]> findMessagesByConversationIdNative(@Param("conversationId") String conversationId);

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

    /**
     * Compte les messages non lus dans une conversation
     */
    long countByConversationIdAndIsReadFalse(String conversationId);
}
=======
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
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.creation ASC")
    Page<Message> findByConversationIdOrderByCreationAsc(@Param("conversationId") String conversationId, Pageable pageable);

    /**
     * Trouve tous les messages d'une conversation (liste simple)
     */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = ?1 ORDER BY m.creation ASC")
    List<Message> findByConversation_IdOrderByCreationAsc(String conversationId);

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
    @Query("UPDATE Message m SET m.isRead = true " +
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
     * Trouve tous les messages d'une conversation avec requête native
     */
    @Query(value = "SELECT m.id, m.content, m.created_at, m.sender_id, m.conversation_id, m.message_type, m.is_read FROM messages m WHERE m.conversation_id = :conversationId ORDER BY m.created_at ASC", nativeQuery = true)
    List<Object[]> findMessagesByConversationIdNative(@Param("conversationId") String conversationId);

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

    /**
     * Compte les messages non lus dans une conversation
     */
    long countByConversationIdAndIsReadFalse(String conversationId);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
