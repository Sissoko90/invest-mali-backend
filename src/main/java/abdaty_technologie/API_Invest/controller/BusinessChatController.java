package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import abdaty_technologie.API_Invest.dto.chat.*;
import abdaty_technologie.API_Invest.service.impl.ChatServiceImpl;
import abdaty_technologie.API_Invest.repository.*;
import abdaty_technologie.API_Invest.Entity.*;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

/**
 * Contrôleur REST pour le système de messagerie interne selon la logique métier :
 * 1. Les agents initient les conversations (pas les utilisateurs)
 * 2. Une conversation = 1 entreprise + 1 agent + 1 utilisateur
 * 3. Messages envoyés par agent OU utilisateur
 * 4. Conversations liées aux entreprises assignées aux agents
 */
@RestController
@RequestMapping("/api/v1/business-chat")
@CrossOrigin(origins = "*")
public class BusinessChatController {

    private static final Logger logger = LoggerFactory.getLogger(BusinessChatController.class);

    @Autowired
    private ChatServiceImpl chatService;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    /**
     * L'agent démarre une conversation pour une entreprise qui lui est assignée
     * Endpoint principal : /api/v1/business-chat/conversations/start-from-entreprise/{id}
     */
    @PostMapping("/conversations/start-from-entreprise/{entrepriseId}")
    public ResponseEntity<Map<String, Object>> startConversationFromAssignedEntreprise(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = getCurrentUserId(authentication);
            String initialMessage = request.get("message");
            
            logger.info("🚀 [BusinessChat] Agent {} démarre conversation pour entreprise assignée {}", 
                       agentId, entrepriseId);
            
            if (initialMessage == null || initialMessage.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "Le message initial est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Utiliser la méthode spécialisée du service
            ConversationResponse conversationResponse = chatService.startConversationFromAssignedEntreprise(
                entrepriseId, agentId, initialMessage);
            
            response.put("status", "SUCCESS");
            response.put("message", "Conversation démarrée avec succès");
            response.put("conversation", conversationResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException e) {
            logger.warn("⚠️ Ressource non trouvée: {}", e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (BadRequestException e) {
            logger.warn("⚠️ Requête invalide: {}", e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du démarrage de la conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne du serveur");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère les conversations d'un agent pour ses entreprises assignées
     */
    @GetMapping("/conversations/agent")
    public ResponseEntity<Map<String, Object>> getAgentConversations(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = getCurrentUserId(authentication);
            logger.info("🔍 [BusinessChat] Récupération conversations pour agent {}", agentId);
            
            List<ConversationResponse> conversations = chatService.getAgentConversationsForAssignedEntreprises(agentId);
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversations);
            response.put("total", conversations.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des conversations");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère les conversations d'un utilisateur pour ses entreprises
     */
    @GetMapping("/conversations/user")
    public ResponseEntity<Map<String, Object>> getUserConversations(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.info("🔍 [BusinessChat] Récupération conversations pour utilisateur {}", userId);
            
            List<ConversationResponse> conversations = chatService.getUserConversationsForOwnedEntreprises(userId);
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversations);
            response.put("total", conversations.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations utilisateur: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des conversations");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère une conversation spécifique avec ses messages
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(
            @PathVariable String conversationId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.info("🔍 [BusinessChat] Récupération conversation {} pour utilisateur {}", conversationId, userId);
            
            ConversationResponse conversation = chatService.getConversation(conversationId, userId);
            
            response.put("status", "SUCCESS");
            response.put("conversation", conversation);
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException e) {
            logger.warn("⚠️ Conversation non trouvée: {}", e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (BadRequestException e) {
            logger.warn("⚠️ Accès non autorisé: {}", e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération de la conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération de la conversation");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Envoie un message dans une conversation
     */
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String senderId = getCurrentUserId(authentication);
            String content = request.get("content");
            String messageType = request.getOrDefault("messageType", "TEXT");
            
            logger.info("📤 [BusinessChat] Envoi message dans conversation {} par {}", conversationId, senderId);
            
            if (content == null || content.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "Le contenu du message est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Créer la requête de message
            MessageRequest messageRequest = new MessageRequest();
            messageRequest.setContent(content.trim());
            messageRequest.setMessageType(messageType);
            messageRequest.setDocumentName(request.get("documentName"));
            messageRequest.setDocumentUrl(request.get("documentUrl"));
            
            MessageResponse messageResponse = chatService.sendMessage(conversationId, messageRequest, senderId);
            
            response.put("status", "SUCCESS");
            response.put("message", "Message envoyé avec succès");
            response.put("messageData", messageResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException e) {
            logger.warn("⚠️ Ressource non trouvée: {}", e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (BadRequestException e) {
            logger.warn("⚠️ Accès non autorisé: {}", e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'envoi du message: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de l'envoi du message");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Marque une conversation comme lue
     */
    @PatchMapping("/conversations/{conversationId}/mark-as-read")
    public ResponseEntity<Map<String, Object>> markConversationAsRead(
            @PathVariable String conversationId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.info("✅ [BusinessChat] Marquage conversation {} comme lue par {}", conversationId, userId);
            
            chatService.markConversationAsRead(conversationId, userId);
            
            response.put("status", "SUCCESS");
            response.put("message", "Conversation marquée comme lue");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du marquage comme lu: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors du marquage comme lu");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère le nombre de messages non lus pour un agent
     */
    @GetMapping("/unread-count/agent")
    public ResponseEntity<Map<String, Object>> getUnreadCountForAgent(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = getCurrentUserId(authentication);
            long unreadCount = chatService.getUnreadCountForAgent(agentId);
            
            response.put("status", "SUCCESS");
            response.put("unreadCount", unreadCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération du nombre de messages non lus: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération du nombre de messages non lus");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère le nombre de messages non lus pour un utilisateur
     */
    @GetMapping("/unread-count/user")
    public ResponseEntity<Map<String, Object>> getUnreadCountForUser(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            long unreadCount = chatService.getUnreadCountForUser(userId);
            
            response.put("status", "SUCCESS");
            response.put("unreadCount", unreadCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération du nombre de messages non lus: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération du nombre de messages non lus");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Utilitaire pour récupérer l'ID de l'utilisateur connecté
     */
    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadRequestException("Utilisateur non authentifié");
        }
        return authentication.getName();
    }
}
