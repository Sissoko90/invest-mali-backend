package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.repository.ConversationRepository;
import abdaty_technologie.API_Invest.repository.MessageRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

/**
 * Contrôleur pour les endpoints /chat/conversations/... attendus par le frontend
 */
@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "*")
public class ChatConversationController {

    private static final Logger logger = LoggerFactory.getLogger(ChatConversationController.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;

    /**
     * Récupère les conversations actives pour un agent spécifique
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/active")
    public ResponseEntity<Map<String, Object>> getActiveConversations(
            @RequestParam(required = false) String entrepriseId,
            @RequestParam(required = false) String agentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 [ChatConversationController] getActiveConversations - entrepriseId: {}, agentId: {}", entrepriseId, agentId);
            logger.info("🔍 DEBUG Paramètres reçus: entrepriseId={}, agentId={}", entrepriseId, agentId);
            
            List<Conversation> activeConversations;
            
            if (agentId != null && !agentId.isEmpty() && entrepriseId != null && !entrepriseId.isEmpty()) {
                logger.info("🔍 Recherche conversations actives pour agent {} dans entreprise {}", agentId, entrepriseId);
                // Récupérer SEULEMENT les conversations de cet agent dans cette entreprise spécifique
                activeConversations = conversationRepository.findActiveConversationsByAgentAndEntreprise(
                    agentId, entrepriseId, abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus.ACTIVE);
                logger.info("✅ {} conversations actives trouvées pour l'agent {} dans l'entreprise {}", 
                    activeConversations.size(), agentId, entrepriseId);
            } else if (agentId != null && !agentId.isEmpty()) {
                logger.info("🔍 Recherche conversations actives pour agent: {}", agentId);
                // Récupérer toutes les conversations de cet agent (toutes entreprises)
                activeConversations = conversationRepository.findActiveConversationsByAgent(
                    agentId, abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus.ACTIVE);
                logger.info("✅ {} conversations actives trouvées pour l'agent {}", activeConversations.size(), agentId);
            } else if (entrepriseId != null && !entrepriseId.isEmpty()) {
                logger.info("🔍 Mode compatibilité - Recherche conversations pour entreprise: {}", entrepriseId);
                // Mode compatibilité : récupérer toutes les conversations de l'entreprise
                activeConversations = conversationRepository.findByEntrepriseIdOrderByCreationDesc(entrepriseId);
                logger.info("✅ {} conversations trouvées pour l'entreprise {} (mode compatibilité)", activeConversations.size(), entrepriseId);
                
                // DEBUG : Afficher les détails de chaque conversation trouvée en mode compatibilité
                for (int i = 0; i < activeConversations.size(); i++) {
                    Conversation conv = activeConversations.get(i);
                    logger.info("🔍 DEBUG Mode compatibilité - Conversation {}: ID={}, Agent={}, User={}, Entreprise={}, Status={}", 
                        i+1, conv.getId(), 
                        conv.getAgent() != null ? conv.getAgent().getId() : "null",
                        conv.getUser() != null ? conv.getUser().getId() : "null",
                        conv.getEntreprise() != null ? conv.getEntreprise().getId() : "null",
                        conv.getStatus());
                }
            } else {
                logger.warn("⚠️ Aucun paramètre fourni - Mode debug: récupération de TOUTES les conversations");
                // Mode debug temporaire : récupérer toutes les conversations actives
                activeConversations = conversationRepository.findByStatusOrderByModificationDesc(
                    abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus.ACTIVE, 
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
                logger.info("✅ {} conversations actives trouvées (mode debug - toutes)", activeConversations.size());
                
                // DEBUG : Afficher les détails de chaque conversation trouvée en mode debug
                for (int i = 0; i < activeConversations.size(); i++) {
                    Conversation conv = activeConversations.get(i);
                    logger.info("🔍 DEBUG Mode debug - Conversation {}: ID={}, Agent={}, User={}, Entreprise={}, Status={}", 
                        i+1, conv.getId(), 
                        conv.getAgent() != null ? conv.getAgent().getId() : "null",
                        conv.getUser() != null ? conv.getUser().getId() : "null",
                        conv.getEntreprise() != null ? conv.getEntreprise().getId() : "null",
                        conv.getStatus());
                }
            }
            
            List<Map<String, Object>> conversationList = new ArrayList<>();
            
            logger.info("🔄 Traitement de {} conversations actives", activeConversations.size());
            
            for (Conversation conversation : activeConversations) {
                try {
                    logger.info("🔄 Traitement conversation active: {}", conversation.getId());
                    
                    Map<String, Object> conversationSummary = new HashMap<>();
                    conversationSummary.put("id", conversation.getId());
                    conversationSummary.put("subject", conversation.getSubject());
                    
                    // Agent avec gestion null sécurisée
                    if (conversation.getAgent() != null) {
                        conversationSummary.put("agentId", conversation.getAgent().getId());
                        conversationSummary.put("agentName", safeGetFullName(conversation.getAgent()));
                    } else {
                        logger.warn("⚠️ Agent null pour conversation: {}", conversation.getId());
                        conversationSummary.put("agentId", "unknown");
                        conversationSummary.put("agentName", "Agent inconnu");
                    }
                    
                    // User avec gestion null sécurisée
                    if (conversation.getUser() != null) {
                        conversationSummary.put("userId", conversation.getUser().getId());
                        conversationSummary.put("userName", safeGetFullName(conversation.getUser()));
                    } else {
                        logger.warn("⚠️ User null pour conversation: {}", conversation.getId());
                        conversationSummary.put("userId", "unknown");
                        conversationSummary.put("userName", "Utilisateur inconnu");
                    }
                    
                    conversationSummary.put("createdAt", conversation.getCreation().toEpochMilli());
                    conversationSummary.put("status", conversation.getStatus().toString());
                    
                    // Entreprise avec gestion null sécurisée
                    if (conversation.getEntreprise() != null) {
                        conversationSummary.put("entrepriseId", conversation.getEntreprise().getId());
                        conversationSummary.put("entrepriseNom", conversation.getEntreprise().getNom());
                    } else {
                        logger.warn("⚠️ Entreprise null pour conversation: {}", conversation.getId());
                        conversationSummary.put("entrepriseId", "unknown");
                        conversationSummary.put("entrepriseNom", "Entreprise inconnue");
                    }
                    
                    // Dernier message avec gestion d'erreur complète
                    try {
                        Message lastMessage = messageRepository.findLastMessageInConversation(conversation.getId());
                        if (lastMessage != null && lastMessage.getSender() != null) {
                            conversationSummary.put("lastMessage", lastMessage.getContent());
                            conversationSummary.put("lastMessageTime", lastMessage.getCreation().toEpochMilli());
                            conversationSummary.put("lastMessageSender", 
                                lastMessage.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                        } else {
                            conversationSummary.put("lastMessage", "");
                            conversationSummary.put("lastMessageTime", 0);
                            conversationSummary.put("lastMessageSender", "");
                        }
                    } catch (Exception msgEx) {
                        logger.warn("⚠️ Erreur récupération dernier message pour conversation {}: {}", 
                                   conversation.getId(), msgEx.getMessage());
                        conversationSummary.put("lastMessage", "");
                        conversationSummary.put("lastMessageTime", 0);
                        conversationSummary.put("lastMessageSender", "");
                    }
                    
                    conversationList.add(conversationSummary);
                    logger.info("✅ Conversation active {} traitée avec succès", conversation.getId());
                    
                } catch (Exception convEx) {
                    logger.error("❌ Erreur traitement conversation active {}: {}", 
                               conversation != null ? conversation.getId() : "null", convEx.getMessage(), convEx);
                    // Continuer avec les autres conversations
                }
            }
            
            logger.info("✅ Traitement terminé - {} conversations actives dans la réponse", conversationList.size());
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversationList);
            response.put("total", conversationList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations actives: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des conversations actives: " + e.getMessage());
            response.put("conversations", new ArrayList<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère une conversation spécifique avec ses messages
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(@PathVariable String conversationId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 [ChatConversationController] getConversation - conversationId: {}", conversationId);
            
            // Vérifier que la conversation existe
            var conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                logger.warn("⚠️ Conversation non trouvée: {}", conversationId);
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée: " + conversationId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Conversation conversation = conversationOpt.get();
            logger.info("✅ Conversation trouvée: {}", conversation.getSubject());
            logger.info("🔍 DEBUG Conversation détails: ID={}, Agent={}, User={}, Entreprise={}", 
                conversation.getId(),
                conversation.getAgent() != null ? conversation.getAgent().getId() : "null",
                conversation.getUser() != null ? conversation.getUser().getId() : "null",
                conversation.getEntreprise() != null ? conversation.getEntreprise().getId() : "null");
            
            // Récupérer les messages de la conversation
            List<Message> messages = messageRepository.findByConversationIdOrderByCreationAsc(conversationId);
            logger.info("📨 {} messages trouvés pour cette conversation", messages.size());
            
            // Convertir les messages au format attendu
            List<Map<String, Object>> messageList = new ArrayList<>();
            for (Message msg : messages) {
                try {
                    logger.info("🔍 DEBUG Message: ID={}, Sender={}, Content={}, Type={}", 
                        msg.getId(),
                        msg.getSender() != null ? msg.getSender().getId() : "null",
                        msg.getContent() != null ? msg.getContent().substring(0, Math.min(msg.getContent().length(), 20)) : "null",
                        msg.getMessageType());
                    
                    Map<String, Object> messageMap = new HashMap<>();
                    messageMap.put("id", msg.getId());
                    messageMap.put("conversationId", msg.getConversation().getId());
                    messageMap.put("content", msg.getContent());
                    messageMap.put("timestamp", msg.getCreation().toEpochMilli());
                    messageMap.put("messageType", msg.getMessageType().toString());
                    
                    // Sender avec gestion null
                    if (msg.getSender() != null) {
                        messageMap.put("senderId", msg.getSender().getId());
                        messageMap.put("senderName", safeGetFullName(msg.getSender()));
                        messageMap.put("senderType", msg.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                    } else {
                        messageMap.put("senderId", "unknown");
                        messageMap.put("senderName", "Expéditeur inconnu");
                        messageMap.put("senderType", "UNKNOWN");
                    }
                    
                    messageList.add(messageMap);
                } catch (Exception msgEx) {
                    logger.warn("⚠️ Erreur traitement message {}: {}", msg.getId(), msgEx.getMessage());
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("id", conversation.getId());
            response.put("subject", conversation.getSubject());
            response.put("messages", messageList);
            response.put("conversationStatus", conversation.getStatus().toString());
            
            // Informations agent
            if (conversation.getAgent() != null) {
                response.put("agentId", conversation.getAgent().getId());
                response.put("agentNom", safeGetFullName(conversation.getAgent()));
            } else {
                response.put("agentId", "unknown");
                response.put("agentNom", "Agent inconnu");
            }
            
            // Informations utilisateur
            if (conversation.getUser() != null) {
                response.put("userId", conversation.getUser().getId());
                response.put("userNom", safeGetFullName(conversation.getUser()));
            } else {
                response.put("userId", "unknown");
                response.put("userNom", "Utilisateur inconnu");
            }
            
            // Informations entreprise
            if (conversation.getEntreprise() != null) {
                response.put("entrepriseId", conversation.getEntreprise().getId());
                response.put("entrepriseNom", conversation.getEntreprise().getNom());
            } else {
                response.put("entrepriseId", "unknown");
                response.put("entrepriseNom", "Entreprise inconnue");
            }
            
            logger.info("✅ Conversation {} récupérée avec {} messages", conversationId, messageList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération de la conversation {}: {}", conversationId, e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération de la conversation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Envoie un nouveau message dans une conversation
     */
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String content = request.get("content");
            String senderId = request.get("senderId");
            
            logger.info("📤 [ChatConversationController] sendMessage - conversationId: {}, senderId: {}, content: {}", 
                conversationId, senderId, content != null ? content.substring(0, Math.min(content.length(), 50)) : "null");
            
            if (content == null || content.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "Le contenu du message est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (senderId == null || senderId.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "L'ID de l'expéditeur est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Vérifier que la conversation existe
            var conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                logger.warn("⚠️ Conversation non trouvée: {}", conversationId);
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée: " + conversationId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Conversation conversation = conversationOpt.get();
            
            // Vérifier que l'expéditeur existe
            var senderOpt = personsRepository.findById(senderId);
            if (!senderOpt.isPresent()) {
                logger.warn("⚠️ Expéditeur non trouvé: {}", senderId);
                response.put("status", "ERROR");
                response.put("message", "Expéditeur non trouvé: " + senderId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Persons sender = senderOpt.get();
            
            // Vérifier que l'expéditeur a accès à cette conversation
            if (!conversation.getAgent().getId().equals(senderId) && !conversation.getUser().getId().equals(senderId)) {
                logger.warn("⚠️ Accès non autorisé à la conversation {} pour l'utilisateur {}", conversationId, senderId);
                response.put("status", "ERROR");
                response.put("message", "Accès non autorisé à cette conversation");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Créer le nouveau message
            Message message = new Message();
            message.setConversation(conversation);
            message.setSender(sender);
            message.setContent(content.trim());
            message.setMessageType(abdaty_technologie.API_Invest.Entity.Enum.MessageType.TEXT);
            message.setIsRead(false);
            
            // Sauvegarder le message
            message = messageRepository.save(message);
            
            logger.info("✅ Message sauvegardé - messageId: {}", message.getId());
            
            // Mettre à jour le timestamp de modification de la conversation
            conversation.setModification(java.time.Instant.now());
            conversationRepository.save(conversation);
            
            // Préparer la réponse
            Map<String, Object> messageResponse = new HashMap<>();
            messageResponse.put("id", message.getId());
            messageResponse.put("conversationId", message.getConversation().getId());
            messageResponse.put("content", message.getContent());
            messageResponse.put("senderId", message.getSender().getId());
            messageResponse.put("senderName", safeGetFullName(message.getSender()));
            messageResponse.put("senderType", message.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
            messageResponse.put("timestamp", message.getCreation().toEpochMilli());
            messageResponse.put("messageType", message.getMessageType().toString());
            
            response.put("status", "SUCCESS");
            response.put("message", "Message envoyé avec succès");
            response.put("messageData", messageResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'envoi du message: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de l'envoi du message: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère les conversations d'un utilisateur - endpoint avec /chat/
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> getChatUserConversations(
            @PathVariable String userId,
            @RequestParam(required = false) String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 [ChatConversationController] getChatUserConversations - userId: {}, entrepriseId: {}", userId, entrepriseId);
            
            // Vérifier que l'utilisateur existe
            if (!personsRepository.existsById(userId)) {
                logger.warn("⚠️ Utilisateur non trouvé: {}", userId);
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                response.put("conversations", new ArrayList<>());
                return ResponseEntity.badRequest().body(response);
            }
            
            logger.info("✅ Utilisateur existe: {}", userId);
            
            List<Conversation> userConversations;
            
            if (entrepriseId != null && !entrepriseId.isEmpty()) {
                logger.info("🔍 Recherche avec filtre entreprise: {}", entrepriseId);
                userConversations = conversationRepository.findByUserIdOrAgentIdAndEntrepriseIdOrderByModificationDesc(userId, userId, entrepriseId);
                logger.info("✅ {} conversations trouvées pour l'utilisateur dans l'entreprise {}", userConversations.size(), entrepriseId);
            } else {
                logger.info("🔍 Recherche sans filtre entreprise");
                userConversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(userId, userId);
                logger.info("✅ {} conversations trouvées pour l'utilisateur", userConversations.size());
            }
            
            List<Map<String, Object>> conversationList = new ArrayList<>();
            
            logger.info("🔄 Traitement de {} conversations", userConversations.size());
            
            // DEBUG : Afficher les détails de chaque conversation trouvée
            for (int i = 0; i < userConversations.size(); i++) {
                Conversation conv = userConversations.get(i);
                logger.info("🔍 DEBUG Conversation {}: ID={}, Agent={}, User={}, Entreprise={}", 
                    i+1, conv.getId(), 
                    conv.getAgent() != null ? conv.getAgent().getId() : "null",
                    conv.getUser() != null ? conv.getUser().getId() : "null",
                    conv.getEntreprise() != null ? conv.getEntreprise().getId() : "null");
            }
            
            for (Conversation conversation : userConversations) {
                try {
                    logger.info("🔄 Traitement conversation: {}", conversation.getId());
                    
                    Map<String, Object> conversationSummary = new HashMap<>();
                    conversationSummary.put("id", conversation.getId());
                    conversationSummary.put("subject", conversation.getSubject());
                    
                    // Agent avec gestion null sécurisée
                    if (conversation.getAgent() != null) {
                        conversationSummary.put("agentId", conversation.getAgent().getId());
                        conversationSummary.put("agentName", safeGetFullName(conversation.getAgent()));
                    } else {
                        logger.warn("⚠️ Agent null pour conversation: {}", conversation.getId());
                        conversationSummary.put("agentId", "unknown");
                        conversationSummary.put("agentName", "Agent inconnu");
                    }
                    
                    // User avec gestion null sécurisée
                    if (conversation.getUser() != null) {
                        conversationSummary.put("userId", conversation.getUser().getId());
                        conversationSummary.put("userName", safeGetFullName(conversation.getUser()));
                    } else {
                        logger.warn("⚠️ User null pour conversation: {}", conversation.getId());
                        conversationSummary.put("userId", "unknown");
                        conversationSummary.put("userName", "Utilisateur inconnu");
                    }
                    
                    conversationSummary.put("createdAt", conversation.getCreation().toEpochMilli());
                    conversationSummary.put("status", conversation.getStatus().toString());
                    
                    // Entreprise avec gestion null sécurisée
                    if (conversation.getEntreprise() != null) {
                        conversationSummary.put("entrepriseId", conversation.getEntreprise().getId());
                        conversationSummary.put("entrepriseNom", conversation.getEntreprise().getNom());
                    } else {
                        logger.warn("⚠️ Entreprise null pour conversation: {}", conversation.getId());
                        conversationSummary.put("entrepriseId", "unknown");
                        conversationSummary.put("entrepriseNom", "Entreprise inconnue");
                    }
                    
                    // Dernier message avec gestion d'erreur complète
                    try {
                        Message lastMessage = messageRepository.findLastMessageInConversation(conversation.getId());
                        if (lastMessage != null && lastMessage.getSender() != null) {
                            conversationSummary.put("lastMessage", lastMessage.getContent());
                            conversationSummary.put("lastMessageTime", lastMessage.getCreation().toEpochMilli());
                            conversationSummary.put("lastMessageSender", 
                                lastMessage.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                        } else {
                            conversationSummary.put("lastMessage", "");
                            conversationSummary.put("lastMessageTime", 0);
                            conversationSummary.put("lastMessageSender", "");
                        }
                    } catch (Exception msgEx) {
                        logger.warn("⚠️ Erreur récupération dernier message pour conversation {}: {}", 
                                   conversation.getId(), msgEx.getMessage());
                        conversationSummary.put("lastMessage", "");
                        conversationSummary.put("lastMessageTime", 0);
                        conversationSummary.put("lastMessageSender", "");
                    }
                    
                    conversationList.add(conversationSummary);
                    logger.info("✅ Conversation {} traitée avec succès", conversation.getId());
                    
                } catch (Exception convEx) {
                    logger.error("❌ Erreur traitement conversation {}: {}", 
                               conversation != null ? conversation.getId() : "null", convEx.getMessage(), convEx);
                    // Continuer avec les autres conversations
                }
            }
            
            logger.info("✅ Traitement terminé - {} conversations dans la réponse", conversationList.size());
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversationList);
            response.put("total", conversationList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations utilisateur: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des conversations: " + e.getMessage());
            response.put("conversations", new ArrayList<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Démarre une nouvelle conversation depuis l'interface utilisateur
     */
    @PostMapping("/conversations/start-user")
    public ResponseEntity<Map<String, Object>> startUserConversation(
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = request.get("userId");
            String message = request.get("message");
            String subject = request.get("subject");
            
            logger.info("📤 [ChatConversationController] startUserConversation - userId: {}, message: {}", userId, message);
            
            if (userId == null || message == null) {
                response.put("status", "ERROR");
                response.put("message", "userId et message sont requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Vérifier que l'utilisateur existe
            var userOpt = personsRepository.findById(userId);
            if (!userOpt.isPresent()) {
                logger.warn("⚠️ Utilisateur non trouvé: {}", userId);
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Persons user = userOpt.get();
            
            // Récupérer l'entreprise de l'utilisateur
            List<abdaty_technologie.API_Invest.Entity.EntrepriseMembre> memberships = 
                entrepriseMembreRepository.findByPersonne_Id(userId);
            
            String entrepriseId;
            if (!memberships.isEmpty()) {
                entrepriseId = memberships.get(0).getEntreprise().getId();
                logger.info("✅ Entreprise trouvée pour utilisateur: {}", entrepriseId);
            } else {
                // Utiliser l'entreprise par défaut
                entrepriseId = "69f667f7-b9a2-43cd-bf7c-8fb5c723ce33";
                logger.warn("⚠️ Aucune entreprise trouvée pour utilisateur {}, utilisation de l'entreprise par défaut", userId);
            }
            
            // Vérifier que l'entreprise existe
            var entrepriseOpt = entrepriseRepository.findById(entrepriseId);
            if (!entrepriseOpt.isPresent()) {
                logger.error("❌ Entreprise non trouvée: {}", entrepriseId);
                response.put("status", "ERROR");
                response.put("message", "Entreprise non trouvée: " + entrepriseId);
                return ResponseEntity.badRequest().body(response);
            }
            
            var entreprise = entrepriseOpt.get();
            
            // Utiliser l'agent par défaut
            String defaultAgentId = "6d3e1dca-8241-4e42-ad64-90f54b3210f7"; // Moussa Macalou
            var agentOpt = personsRepository.findById(defaultAgentId);
            if (!agentOpt.isPresent()) {
                logger.error("❌ Agent par défaut non trouvé: {}", defaultAgentId);
                response.put("status", "ERROR");
                response.put("message", "Agent par défaut non trouvé");
                return ResponseEntity.badRequest().body(response);
            }
            
            var agent = agentOpt.get();
            
            // Créer la conversation
            Conversation conversation = new Conversation();
            conversation.setEntreprise(entreprise);
            conversation.setAgent(agent);
            conversation.setUser(user);
            conversation.setSubject(subject != null ? subject : "Demande d'assistance");
            conversation.setStatus(abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus.ACTIVE);
            
            conversation = conversationRepository.save(conversation);
            
            // Créer le message initial de l'utilisateur
            Message initialMessage = new Message();
            initialMessage.setConversation(conversation);
            initialMessage.setSender(user);
            initialMessage.setContent(message);
            initialMessage.setMessageType(abdaty_technologie.API_Invest.Entity.Enum.MessageType.TEXT);
            initialMessage.setIsRead(false);
            
            messageRepository.save(initialMessage);
            
            logger.info("✅ Conversation créée avec succès - conversationId: {}", conversation.getId());
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversation.getId());
            response.put("agentId", defaultAgentId);
            response.put("agentName", safeGetFullName(agent));
            response.put("subject", conversation.getSubject());
            response.put("initialMessage", message);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du démarrage de conversation utilisateur: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors du démarrage de conversation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Démarre une nouvelle conversation depuis l'interface agent
     */
    @PostMapping("/conversations/start-agent")
    public ResponseEntity<Map<String, Object>> startAgentConversation(
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = request.get("agentId");
            String userId = request.get("userId");
            String message = request.get("message");
            String subject = request.get("subject");
            String entrepriseId = request.get("entrepriseId");
            
            logger.info("📤 [ChatConversationController] startAgentConversation - agentId: {}, userId: {}, entrepriseId: {}", 
                agentId, userId, entrepriseId);
            logger.info("🔍 DEBUG Paramètres reçus: agentId={}, userId={}, entrepriseId={}, message={}", 
                agentId, userId, entrepriseId, message != null ? message.substring(0, Math.min(message.length(), 20)) : "null");
            
            if (agentId == null || userId == null || message == null) {
                response.put("status", "ERROR");
                response.put("message", "agentId, userId et message sont requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Vérifier que l'agent existe
            var agentOpt = personsRepository.findById(agentId);
            if (!agentOpt.isPresent()) {
                logger.warn("⚠️ Agent non trouvé: {}", agentId);
                response.put("status", "ERROR");
                response.put("message", "Agent non trouvé: " + agentId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Persons agent = agentOpt.get();
            
            // Vérifier que l'utilisateur existe
            var userOpt = personsRepository.findById(userId);
            if (!userOpt.isPresent()) {
                logger.warn("⚠️ Utilisateur non trouvé: {}", userId);
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Persons user = userOpt.get();
            
            // Vérifier que l'entreprise existe
            if (entrepriseId == null || entrepriseId.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "entrepriseId est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            var entrepriseOpt = entrepriseRepository.findById(entrepriseId);
            if (!entrepriseOpt.isPresent()) {
                logger.error("❌ Entreprise non trouvée: {}", entrepriseId);
                response.put("status", "ERROR");
                response.put("message", "Entreprise non trouvée: " + entrepriseId);
                return ResponseEntity.badRequest().body(response);
            }
            
            var entreprise = entrepriseOpt.get();
            
            // Vérifier s'il existe déjà une conversation active entre cet agent et cet utilisateur pour cette entreprise
            logger.info("🔍 DEBUG Recherche conversation existante entre participants: entrepriseId={}, agentId={}, userId={}", 
                entrepriseId, agentId, userId);
            
            var existingConversations = conversationRepository.findActiveConversationBetweenParticipants(
                entrepriseId, agentId, userId);
            
            logger.info("🔍 DEBUG {} conversations existantes trouvées", existingConversations.size());
            for (int i = 0; i < existingConversations.size(); i++) {
                Conversation conv = existingConversations.get(i);
                logger.info("🔍 DEBUG Conversation existante {}: ID={}, Agent={}, User={}, Entreprise={}", 
                    i+1, conv.getId(),
                    conv.getAgent() != null ? conv.getAgent().getId() : "null",
                    conv.getUser() != null ? conv.getUser().getId() : "null",
                    conv.getEntreprise() != null ? conv.getEntreprise().getId() : "null");
            }
            
            if (!existingConversations.isEmpty()) {
                // Prendre la conversation la plus récente
                Conversation existingConversation = existingConversations.get(0);
                logger.info("✅ Conversation existante trouvée, ajout d'un nouveau message");
                
                // Ajouter un nouveau message à la conversation existante
                Message newMessage = new Message();
                newMessage.setConversation(existingConversation);
                newMessage.setSender(agent);
                newMessage.setContent(message);
                newMessage.setMessageType(abdaty_technologie.API_Invest.Entity.Enum.MessageType.TEXT);
                newMessage.setIsRead(false);
                
                messageRepository.save(newMessage);
                
                // Mettre à jour le timestamp de modification
                existingConversation.setModification(java.time.Instant.now());
                conversationRepository.save(existingConversation);
                
                response.put("status", "SUCCESS");
                response.put("conversationId", existingConversation.getId());
                response.put("agentId", agentId);
                response.put("userId", userId);
                response.put("subject", existingConversation.getSubject());
                response.put("message", "Message ajouté à la conversation existante");
                response.put("initialMessage", message);
                response.put("initiatedBy", "AGENT");
                
                return ResponseEntity.ok(response);
            }
            
            // Créer une nouvelle conversation
            Conversation conversation = new Conversation();
            conversation.setEntreprise(entreprise);
            conversation.setAgent(agent);
            conversation.setUser(user);
            conversation.setSubject(subject != null ? subject : "Contact agent - " + entreprise.getNom());
            conversation.setStatus(abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus.ACTIVE);
            
            conversation = conversationRepository.save(conversation);
            
            logger.info("🔍 DEBUG Conversation créée: ID={}, Agent={}, User={}, Entreprise={}", 
                conversation.getId(),
                conversation.getAgent() != null ? conversation.getAgent().getId() : "null",
                conversation.getUser() != null ? conversation.getUser().getId() : "null", 
                conversation.getEntreprise() != null ? conversation.getEntreprise().getId() : "null");
            
            // Créer le message initial de l'agent
            Message initialMessage = new Message();
            initialMessage.setConversation(conversation);
            initialMessage.setSender(agent);
            initialMessage.setContent(message);
            initialMessage.setMessageType(abdaty_technologie.API_Invest.Entity.Enum.MessageType.TEXT);
            initialMessage.setIsRead(false);
            
            messageRepository.save(initialMessage);
            
            logger.info("✅ Conversation créée par agent - conversationId: {}", conversation.getId());
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversation.getId());
            response.put("agentId", agentId);
            response.put("userId", userId);
            response.put("subject", conversation.getSubject());
            response.put("message", "Conversation initiée par l'agent avec succès");
            response.put("initialMessage", message);
            response.put("initiatedBy", "AGENT");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du démarrage de conversation par agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors du démarrage de conversation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Test de santé pour ce contrôleur
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("controller", "ChatConversationController");
        response.put("message", "Contrôleur de conversations chat fonctionnel");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Méthode utilitaire pour récupérer le nom complet en gérant les valeurs null
     */
    private String safeGetFullName(Persons person) {
        if (person == null) {
            return "Personne inconnue";
        }
        
        String prenom = person.getPrenom() != null ? person.getPrenom() : "";
        String nom = person.getNom() != null ? person.getNom() : "";
        String fullName = (prenom + " " + nom).trim();
        
        if (fullName.isEmpty()) {
            return person.getEmail() != null ? person.getEmail() : "Nom inconnu";
        }
        
        return fullName;
    }
}
