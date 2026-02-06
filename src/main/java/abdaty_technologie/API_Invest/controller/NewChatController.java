package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.MessageType;
import abdaty_technologie.API_Invest.repository.ConversationRepository;
import abdaty_technologie.API_Invest.repository.MessageRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.EmailNotificationService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/conversations")
public class NewChatController {

    private static final Logger logger = LoggerFactory.getLogger(NewChatController.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private EmailNotificationService emailNotificationService;

    /**
     * Agent initialise la conversation
     * POST /api/v1/conversations/agent-initiate
     */
    @PostMapping("/agent-initiate")
    public ResponseEntity<Map<String, Object>> agentInitiateConversation(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = (String) request.get("agent_id");
            String userId = (String) request.get("user_id");
            String entrepriseId = (String) request.get("entreprise_id");
            String initialMessage = (String) request.get("initial_message");

            logger.info("Agent {} initie conversation avec utilisateur {}", agentId, userId);

            // Verifications
            Optional<Persons> agentOpt = personsRepository.findById(agentId);
            Optional<Persons> userOpt = personsRepository.findById(userId);
            Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(entrepriseId);

            if (!agentOpt.isPresent() || !userOpt.isPresent() || !entrepriseOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Agent, utilisateur ou entreprise non trouve");
                return ResponseEntity.badRequest().body(response);
            }

            Persons agent = agentOpt.get();
            Persons user = userOpt.get();
            Entreprise entreprise = entrepriseOpt.get();

            // Verifier que c'est bien un agent (tous les roles agent) ou SUPER_ADMIN
            String roleName = agent.getRole().name();
            if (!roleName.startsWith("AGENT_") && !roleName.equals("SUPER_ADMIN")) {
                response.put("status", "ERROR");
                response.put("message", "Seuls les agents peuvent initier des conversations");
                return ResponseEntity.status(403).body(response);
            }

            // Creer nouvelle conversation
            Conversation conversation = new Conversation(entreprise, agent, user, "Assistance Agent - " + entreprise.getNom());
            conversation = conversationRepository.save(conversation);
            logger.info("Nouvelle conversation creee: {}", conversation.getId());

            // 🔔 Notifier la nouvelle conversation (désactivé temporairement)
            // if (notificationService != null && conversation != null && agent != null) {
            //     notificationService.notifyNewConversation(conversation, agent);
            // }

            // Envoyer le message initial si fourni
            if (initialMessage != null && !initialMessage.trim().isEmpty()) {
                Message firstMessage = new Message();
                firstMessage.setConversation(conversation);
                firstMessage.setSender(agent);
                firstMessage.setContent(initialMessage);
                firstMessage.setMessageType(MessageType.TEXT);
                firstMessage.setIsRead(false);
                firstMessage.setCreation(Instant.now());
                firstMessage.setModification(Instant.now());
                firstMessage = messageRepository.save(firstMessage);

                // 🔔 Notifier le nouveau message
                // notificationService.notifyNewMessage(firstMessage, conversation);

                conversation.setModification(Instant.now());
                conversationRepository.save(conversation);
            }

            response.put("status", "SUCCESS");
            response.put("conversation_id", conversation.getId());
            response.put("agent_name", agent.getNom() + " " + agent.getPrenom());
            response.put("user_name", user.getNom() + " " + user.getPrenom());
            response.put("entreprise_name", conversation.getEntreprise().getNom());
            response.put("message", "Conversation initiee avec succes");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de l'initiation par l'agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Utilisateur veut contacter son agent
     * POST /api/v1/conversations/user-contact-agent
     */
    @PostMapping("/user-contact-agent")
    public ResponseEntity<Map<String, Object>> userContactAgent(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = (String) request.get("user_id");
            String entrepriseId = (String) request.get("entreprise_id");
            String initialMessage = (String) request.get("initial_message");

            logger.info("Utilisateur {} veut contacter son agent", userId);

            // Verifications
            Optional<Persons> userOpt = personsRepository.findById(userId);
            Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(entrepriseId);
            
            if (!userOpt.isPresent() || !entrepriseOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Utilisateur ou entreprise non trouve");
                return ResponseEntity.badRequest().body(response);
            }

            Persons user = userOpt.get();
            Entreprise entreprise = entrepriseOpt.get();

            // Trouver un agent disponible
            List<Persons> agents = personsRepository.findAll().stream()
                .filter(p -> p.getRole().name().startsWith("AGENT_"))
                .toList();
                
            if (agents.isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "Aucun agent disponible");
                return ResponseEntity.status(503).body(response);
            }

            Persons assignedAgent = agents.get(0);

            // Creer nouvelle conversation
            Conversation conversation = new Conversation(entreprise, assignedAgent, user, "Demande d'assistance - " + entreprise.getNom());
            conversation = conversationRepository.save(conversation);
            logger.info("Nouvelle conversation creee: {}", conversation.getId());

            // 🔔 Notifier la nouvelle conversation
            // notificationService.notifyNewConversation(conversation, user);

            // Envoyer le message initial
            if (initialMessage != null && !initialMessage.trim().isEmpty()) {
                Message firstMessage = new Message();
                firstMessage.setConversation(conversation);
                firstMessage.setSender(user);
                firstMessage.setContent(initialMessage);
                firstMessage.setMessageType(MessageType.TEXT);
                firstMessage.setIsRead(false);
                firstMessage.setCreation(Instant.now());
                firstMessage.setModification(Instant.now());
                firstMessage = messageRepository.save(firstMessage);

                // 🔔 Notifier le nouveau message
                // notificationService.notifyNewMessage(firstMessage, conversation);

                conversation.setModification(Instant.now());
                conversationRepository.save(conversation);
            }

            response.put("status", "SUCCESS");
            response.put("conversation_id", conversation.getId());
            response.put("assigned_agent_id", assignedAgent.getId());
            response.put("assigned_agent_name", assignedAgent.getNom() + " " + assignedAgent.getPrenom());
            response.put("user_name", user.getNom() + " " + user.getPrenom());
            response.put("entreprise_name", entreprise.getNom());
            response.put("message", "Message envoye a votre agent assigne");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors du contact utilisateur: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Envoyer un message dans une conversation
     * POST /api/v1/conversations/{id}/messages
     */
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(@PathVariable String conversationId, @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String senderType = (String) request.get("sender_type");
            String senderId = (String) request.get("sender_id");
            String content = (String) request.get("content");
            String attachment = (String) request.get("attachment");

            logger.info("Nouveau message de {} dans conversation {}", senderType, conversationId);

            // Verifier que la conversation existe
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvee");
                return ResponseEntity.badRequest().body(response);
            }

            Conversation conversation = conversationOpt.get();

            // Verifier que l'expediteur existe
            Optional<Persons> senderOpt = personsRepository.findById(senderId);
            if (!senderOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Expediteur non trouve");
                return ResponseEntity.badRequest().body(response);
            }

            Persons sender = senderOpt.get();

            // Verifications de securite
            boolean canSend = false;
            
            if ("agent".equals(senderType) && conversation.getAgent() != null && sender.getId().equals(conversation.getAgent().getId())) {
                canSend = true;
                logger.info("🔑 Envoi autorisé - utilisateur est l'agent de la conversation");
            } else if ("user".equals(senderType)) {
                // Vérification pour les utilisateurs
                // Accès direct : l'utilisateur est le user_id de la conversation
                if (conversation.getUser() != null && sender.getId().equals(conversation.getUser().getId())) {
                    canSend = true;
                    logger.info("🔑 Envoi autorisé - utilisateur est le user_id de la conversation");
                }
                
                // Accès via entreprise : l'utilisateur a un rôle dans l'entreprise de la conversation
                if (!canSend && conversation.getEntreprise() != null) {
                    try {
                        // Vérifier si l'utilisateur a un rôle actif dans cette entreprise
                        List<Object[]> userRoles = conversationRepository.findUserConversationsWithManagedCompanies(sender.getId());
                        for (Object[] row : userRoles) {
                            String entrepriseId = row[7] != null ? row[7].toString() : "";
                            if (conversation.getEntreprise().getId().equals(entrepriseId)) {
                                canSend = true;
                                logger.info("🏢 Envoi autorisé - utilisateur a des droits sur l'entreprise {}", entrepriseId);
                                break;
                            }
                        }
                    } catch (Exception e) {
                        logger.warn("Erreur lors de la vérification des droits entreprise pour envoi: {}", e.getMessage());
                    }
                }
            }

            if (!canSend) {
                response.put("status", "ERROR");
                response.put("message", "Vous n'etes pas autorise a envoyer des messages dans cette conversation");
                return ResponseEntity.status(403).body(response);
            }

            // Creer le message
            Message message = new Message();
            message.setConversation(conversation);
            message.setSender(sender);
            message.setContent(content);
            message.setMessageType(MessageType.TEXT);
            message.setIsRead(false);
            // Les timestamps seront définis automatiquement par @PrePersist

            if (attachment != null && !attachment.trim().isEmpty()) {
                message.setDocumentUrl(attachment);
                message.setMessageType(MessageType.DOCUMENT_UPLOAD);
            }

            logger.info("Sauvegarde du message pour conversation: {}", conversationId);
            message = messageRepository.save(message);
            logger.info("Message sauvegardé avec ID: {}", message.getId());

            // 🔔 Envoyer notification email si l'agent envoie un message à l'utilisateur
            try {
                if ("agent".equals(senderType) && conversation.getUser() != null) {
                    emailNotificationService.notifyUserNewMessage(message, conversation);
                    logger.info("Notification email envoyée pour le message {}", message.getId());
                }
            } catch (Exception emailError) {
                logger.warn("Erreur lors de l'envoi de la notification email: {}", emailError.getMessage());
                // Ne pas faire échouer l'envoi du message si l'email échoue
            }

            // Mettre a jour la conversation
            conversation.setModification(Instant.now());
            conversationRepository.save(conversation);

            // Preparer la reponse selon le format JSON API specifie
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", message.getId());
            messageData.put("sender_type", senderType);
            messageData.put("content", message.getContent());
            messageData.put("created_at", message.getCreation().toString());
            messageData.put("is_read", message.getIsRead());
            
            if (attachment != null) {
                messageData.put("attachment", attachment);
            }

            response.put("status", "success");
            response.put("message", messageData);

            logger.info("Message {} envoye avec succes", message.getId());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi du message: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Test simple pour agent
     * GET /api/v1/conversations/agent/{agentId}/test
     */
    @GetMapping("/agent/{agentId}/test")
    public ResponseEntity<Map<String, Object>> testAgentEndpoint(@PathVariable String agentId) {
        Map<String, Object> response = new HashMap<>();
        try {
            logger.info("🧪 Test endpoint pour agent: {}", agentId);
            
            // Vérifier que l'agent existe
            Optional<Persons> agentOpt = personsRepository.findById(agentId);
            if (!agentOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Agent non trouvé");
                return ResponseEntity.badRequest().body(response);
            }
            
            response.put("status", "SUCCESS");
            response.put("message", "Agent trouvé");
            response.put("agent_id", agentId);
            response.put("agent_name", agentOpt.get().getNom() + " " + agentOpt.get().getPrenom());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("🧪 Erreur test agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Recuperer les conversations d'un agent avec compteurs (version native)
     * GET /api/v1/conversations/agent/{agentId}/native
     */
    @GetMapping("/agent/{agentId}/native")
    public ResponseEntity<Map<String, Object>> getAgentConversationsNative(@PathVariable String agentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔔 Récupération native conversations pour agent: {}", agentId);

            // Vérifier que l'agent existe
            Optional<Persons> agentOpt = personsRepository.findById(agentId);
            if (!agentOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Agent non trouvé");
                return ResponseEntity.badRequest().body(response);
            }

            // Utiliser la requête native
            List<Object[]> rawResults = conversationRepository.findAgentConversationsWithUnreadCount(agentId);
            logger.info("🔔 Résultats bruts récupérés: {}", rawResults.size());

            List<Map<String, Object>> conversationList = new ArrayList<>();
            for (Object[] row : rawResults) {
                Map<String, Object> convData = new HashMap<>();
                convData.put("id", row[0] != null ? row[0].toString() : "");
                convData.put("subject", row[1] != null ? row[1].toString() : "");
                convData.put("status", row[2] != null ? row[2].toString() : "");
                convData.put("created_at", row[3] != null ? row[3].toString() : "");
                convData.put("updated_at", row[4] != null ? row[4].toString() : "");
                convData.put("agent_id", row[5] != null ? row[5].toString() : "");
                convData.put("user_id", row[6] != null ? row[6].toString() : "");
                convData.put("entreprise_id", row[7] != null ? row[7].toString() : "");
                convData.put("entreprise_name", row[8] != null ? row[8].toString() : "");
                convData.put("user_name", (row[9] != null ? row[9].toString() : "") + " " + (row[10] != null ? row[10].toString() : ""));
                convData.put("user_email", row[11] != null ? row[11].toString() : "");
                convData.put("unread_count", row[12] != null ? ((Number) row[12]).intValue() : 0);

                conversationList.add(convData);
            }

            response.put("status", "SUCCESS");
            response.put("agent_id", agentId);
            response.put("conversations", conversationList);
            response.put("count", conversationList.size());

            logger.info("🔔 Conversations retournées: {}", conversationList.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("🔔 Erreur lors de la récupération des conversations: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Marquer les messages comme lus pour un agent
     * POST /api/v1/conversations/{conversationId}/mark-read-agent
     */
    @PostMapping("/{conversationId}/mark-read-agent")
    public ResponseEntity<Map<String, Object>> markMessagesAsReadForAgent(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = request.get("agent_id");
            logger.info("🔖 Marquage des messages comme lus pour agent - Conversation: {}, Agent: {}", conversationId, agentId);
            
            // Vérifier que la conversation existe
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée");
                return ResponseEntity.status(404).body(response);
            }
            
            Conversation conversation = conversationOpt.get();
            
            // Vérifier que l'agent a accès à cette conversation
            logger.info("🔖 Vérification accès - Agent conversation: {}, Agent demandé: {}", 
                       conversation.getAgent() != null ? conversation.getAgent().getId() : "NULL", agentId);
            
            if (conversation.getAgent() == null || !agentId.equals(conversation.getAgent().getId())) {
                logger.warn("🔖 ACCÈS REFUSÉ - Agent conversation: {}, Agent demandé: {}", 
                           conversation.getAgent() != null ? conversation.getAgent().getId() : "NULL", agentId);
                response.put("status", "ERROR");
                response.put("message", "Accès non autorisé à cette conversation");
                response.put("conversation_agent_id", conversation.getAgent() != null ? conversation.getAgent().getId() : "NULL");
                response.put("requested_agent_id", agentId);
                return ResponseEntity.status(403).body(response);
            }
            
            // Marquer tous les messages de l'utilisateur comme lus pour cet agent
            List<Message> messages = messageRepository.findByConversation_IdOrderByCreationAsc(conversationId);
            int updatedCount = 0;
            
            logger.info("🔖 Analyse de {} messages dans la conversation", messages.size());
            
            for (Message message : messages) {
                // Marquer comme lu seulement les messages de l'utilisateur qui ne sont pas encore lus
                boolean isUserMessage = false;
                if (conversation.getUser() != null && message.getSender() != null) {
                    isUserMessage = conversation.getUser().getId().equals(message.getSender().getId());
                }
                
                logger.info("🔖 Message {} - Utilisateur: {}, Lu: {}, Sender: {}, User: {}, Content: '{}'", 
                           message.getId(), isUserMessage, message.getIsRead(),
                           message.getSender() != null ? message.getSender().getId() : "NULL",
                           conversation.getUser() != null ? conversation.getUser().getId() : "NULL",
                           message.getContent().length() > 50 ? message.getContent().substring(0, 50) + "..." : message.getContent());
                
                if (isUserMessage && !message.getIsRead()) {
                    logger.info("🔖 Marquage du message {} comme lu", message.getId());
                    message.setIsRead(true);
                    messageRepository.save(message);
                    updatedCount++;
                } else if (isUserMessage && message.getIsRead()) {
                    logger.info("🔖 Message {} déjà lu", message.getId());
                } else if (!isUserMessage) {
                    logger.info("🔖 Message {} ignoré (pas de l'utilisateur)", message.getId());
                }
                
                // DIAGNOSTIC: Marquer TOUS les messages non lus comme lus temporairement
                if (!message.getIsRead()) {
                    logger.info("🔖 DIAGNOSTIC: Marquage forcé du message {} comme lu", message.getId());
                    message.setIsRead(true);
                    messageRepository.save(message);
                    updatedCount++;
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("conversation_id", conversationId);
            response.put("agent_id", agentId);
            response.put("messages_marked_read", updatedCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Erreur lors du marquage des messages comme lus pour agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors du marquage des messages comme lus: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Debug: Analyser une conversation spécifique
     * GET /api/v1/conversations/{conversationId}/debug
     */
    @GetMapping("/{conversationId}/debug")
    public ResponseEntity<Map<String, Object>> debugConversation(@PathVariable String conversationId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Debug conversation: {}", conversationId);
            
            // Récupérer la conversation
            Optional<Conversation> convOpt = conversationRepository.findById(conversationId);
            if (!convOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée");
                return ResponseEntity.status(404).body(response);
            }
            
            Conversation conv = convOpt.get();
            
            // Récupérer tous les messages
            List<Message> messages = messageRepository.findByConversation_IdOrderByCreationAsc(conversationId);
            
            List<Map<String, Object>> messageDetails = new ArrayList<>();
            int unreadUserMessages = 0;
            
            for (Message msg : messages) {
                Map<String, Object> msgData = new HashMap<>();
                msgData.put("id", msg.getId());
                msgData.put("content", msg.getContent().substring(0, Math.min(50, msg.getContent().length())) + "...");
                msgData.put("sender_id", msg.getSender() != null ? msg.getSender().getId() : "NULL");
                msgData.put("sender_name", msg.getSender() != null ? msg.getSender().getNom() + " " + msg.getSender().getPrenom() : "NULL");
                msgData.put("is_read", msg.getIsRead());
                msgData.put("created_at", msg.getCreation().toString());
                
                // Vérifier si c'est un message utilisateur non lu
                boolean isUserMessage = conv.getUser() != null && msg.getSender() != null && 
                                      conv.getUser().getId().equals(msg.getSender().getId());
                boolean isAgentMessage = conv.getAgent() != null && msg.getSender() != null && 
                                       conv.getAgent().getId().equals(msg.getSender().getId());
                
                msgData.put("is_user_message", isUserMessage);
                msgData.put("is_agent_message", isAgentMessage);
                
                if (isUserMessage && !msg.getIsRead()) {
                    unreadUserMessages++;
                }
                
                messageDetails.add(msgData);
            }
            
            response.put("status", "SUCCESS");
            response.put("conversation_id", conversationId);
            response.put("entreprise_name", conv.getEntreprise() != null ? conv.getEntreprise().getNom() : "NULL");
            response.put("agent_id", conv.getAgent() != null ? conv.getAgent().getId() : "NULL");
            response.put("user_id", conv.getUser() != null ? conv.getUser().getId() : "NULL");
            response.put("total_messages", messages.size());
            response.put("unread_user_messages", unreadUserMessages);
            response.put("messages", messageDetails);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("🔍 Erreur debug conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Recuperer les conversations d'un agent
     * GET /api/v1/conversations/agent/{agentId}
     */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<Map<String, Object>> getAgentConversations(@PathVariable String agentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔔 Recuperation conversations pour agent: {}", agentId);

            // Verifier que l'agent existe
            Optional<Persons> agentOpt = personsRepository.findById(agentId);
            if (!agentOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Agent non trouve");
                return ResponseEntity.badRequest().body(response);
            }

            logger.info("🔔 Agent trouvé: {}", agentOpt.get().getNom());

            // Recuperer toutes les conversations de l'agent avec pagination
            Pageable pageable = PageRequest.of(0, 100);
            logger.info("🔔 Tentative de récupération des conversations...");
            
            List<Conversation> conversations;
            try {
                conversations = conversationRepository.findByAgent_IdOrderByModificationDesc(agentId, pageable).getContent();
                logger.info("🔔 Conversations récupérées: {}", conversations.size());
            } catch (Exception e) {
                logger.error("🔔 Erreur lors de la récupération des conversations: {}", e.getMessage(), e);
                response.put("status", "ERROR");
                response.put("message", "Erreur lors de la récupération des conversations: " + e.getMessage());
                return ResponseEntity.status(500).body(response);
            }

            List<Map<String, Object>> conversationList = new ArrayList<>();
            for (Conversation conv : conversations) {
                Map<String, Object> convData = new HashMap<>();
                convData.put("id", conv.getId());
                convData.put("status", conv.getStatus().name());
                convData.put("subject", conv.getSubject());
                convData.put("created_at", conv.getCreation().toString());
                convData.put("updated_at", conv.getModification().toString());

                // Informations utilisateur
                convData.put("user_id", conv.getUser().getId());
                convData.put("user_name", conv.getUser().getNom() + " " + conv.getUser().getPrenom());
                convData.put("user_email", conv.getUser().getEmail());

                // Informations entreprise
                convData.put("entreprise_id", conv.getEntreprise().getId());
                convData.put("entreprise_name", conv.getEntreprise().getNom());

                // Utiliser la requête native pour récupérer les messages
                try {
                    List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conv.getId());
                    
                    // Compter les messages non lus
                    long unreadCount = 0;
                    Object[] lastMessageRow = null;
                    
                    for (Object[] row : rawMessages) {
                        // row[6] = is_read, row[3] = sender_id
                        Boolean isRead = row[6] != null ? (Boolean) row[6] : false;
                        String senderId = row[3] != null ? row[3].toString() : "";
                        
                        if (!isRead && !senderId.equals(agentId)) {
                            unreadCount++;
                        }
                        
                        lastMessageRow = row; // Le dernier message (ordre par created_at ASC)
                    }
                    
                    convData.put("unread_count", unreadCount);

                    // Dernier message
                    if (lastMessageRow != null) {
                        convData.put("last_message_content", lastMessageRow[1] != null ? lastMessageRow[1].toString() : "");
                        convData.put("last_message_time", lastMessageRow[2] != null ? lastMessageRow[2].toString() : "");
                        String lastSenderId = lastMessageRow[3] != null ? lastMessageRow[3].toString() : "";
                        convData.put("last_message_sender", lastSenderId.equals(agentId) ? "agent" : "user");
                    }
                } catch (Exception msgException) {
                    logger.warn("Erreur lors de la récupération des messages pour conversation {}: {}", conv.getId(), msgException.getMessage());
                    convData.put("unread_count", 0);
                }

                conversationList.add(convData);
            }

            response.put("status", "SUCCESS");
            response.put("agent_id", agentId);
            response.put("conversations", conversationList);
            response.put("count", conversationList.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de la recuperation des conversations agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Recuperer les conversations d'un utilisateur
     * GET /api/v1/conversations/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversations(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Recuperation conversations pour utilisateur: {}", userId);

            // Recuperer toutes les conversations de l'utilisateur
            List<Conversation> conversations = conversationRepository.findByUserId(userId);

            List<Map<String, Object>> conversationList = new ArrayList<>();
            for (Conversation conv : conversations) {
                Map<String, Object> convData = new HashMap<>();
                convData.put("id", conv.getId());
                convData.put("status", conv.getStatus().name());
                convData.put("subject", conv.getSubject());
                convData.put("created_at", conv.getCreation().toString());
                convData.put("updated_at", conv.getModification().toString());

                // Informations agent
                convData.put("agent_id", conv.getAgent().getId());
                convData.put("agent_name", conv.getAgent().getNom() + " " + conv.getAgent().getPrenom());

                // Informations entreprise
                convData.put("entreprise_id", conv.getEntreprise().getId());
                convData.put("entreprise_name", conv.getEntreprise().getNom());

                // Utiliser la requête native pour récupérer les messages
                try {
                    List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conv.getId());
                    
                    // Compter les messages non lus
                    long unreadCount = 0;
                    Object[] lastMessageRow = null;
                    
                    for (Object[] row : rawMessages) {
                        // row[6] = is_read, row[3] = sender_id
                        Boolean isRead = row[6] != null ? (Boolean) row[6] : false;
                        String senderId = row[3] != null ? row[3].toString() : "";
                        
                        if (!isRead && !senderId.equals(userId)) {
                            unreadCount++;
                        }
                        
                        lastMessageRow = row; // Le dernier message (ordre par created_at ASC)
                    }
                    
                    convData.put("unread_count", unreadCount);

                    // Dernier message
                    if (lastMessageRow != null) {
                        convData.put("last_message_content", lastMessageRow[1] != null ? lastMessageRow[1].toString() : "");
                        convData.put("last_message_time", lastMessageRow[2] != null ? lastMessageRow[2].toString() : "");
                        String lastSenderId = lastMessageRow[3] != null ? lastMessageRow[3].toString() : "";
                        convData.put("last_message_sender", lastSenderId.equals(userId) ? "user" : "agent");
                    }
                } catch (Exception msgException) {
                    logger.warn("Erreur lors de la récupération des messages pour conversation {}: {}", conv.getId(), msgException.getMessage());
                    convData.put("unread_count", 0);
                }

                conversationList.add(convData);
            }

            response.put("status", "SUCCESS");
            response.put("user_id", userId);
            response.put("conversations", conversationList);
            response.put("count", conversationList.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de la recuperation des conversations utilisateur: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Recuperer une conversation avec ses messages
     * GET /api/v1/conversations/{id}
     */
    @GetMapping("/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(@PathVariable String conversationId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Recuperation conversation: {}", conversationId);

            // Verifier que la conversation existe
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvee");
                return ResponseEntity.badRequest().body(response);
            }

            Conversation conversation = conversationOpt.get();

            // Recuperer les messages avec la requête native
            List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conversationId);

            // Preparer la reponse
            Map<String, Object> conversationData = new HashMap<>();
            conversationData.put("id", conversation.getId());
            conversationData.put("subject", conversation.getSubject());
            conversationData.put("status", conversation.getStatus().name());
            conversationData.put("created_at", conversation.getCreation().toString());
            conversationData.put("agent_name", conversation.getAgent().getNom() + " " + conversation.getAgent().getPrenom());
            conversationData.put("user_name", conversation.getUser().getNom() + " " + conversation.getUser().getPrenom());
            conversationData.put("entreprise_name", conversation.getEntreprise().getNom());

            // Adapter les messages depuis les données brutes
            List<Map<String, Object>> messagesData = new ArrayList<>();
            for (Object[] row : rawMessages) {
                Map<String, Object> messageData = new HashMap<>();
                messageData.put("id", row[0]);
                messageData.put("content", row[1] != null ? row[1].toString() : "");
                messageData.put("created_at", row[2] != null ? row[2].toString() : "");
                messageData.put("sender_id", row[3]);
                messageData.put("conversation_id", row[4]);
                messageData.put("message_type", row[5] != null ? row[5].toString() : "TEXT");
                messageData.put("is_read", row[6] != null ? (Boolean) row[6] : false);
                
                // Déterminer le type de sender
                String senderId = row[3] != null ? row[3].toString() : "";
                String senderType = "user"; // Par défaut
                if (conversation.getAgent() != null && senderId.equals(conversation.getAgent().getId())) {
                    senderType = "agent";
                }
                messageData.put("sender_type", senderType);
                
                // Récupérer le nom de l'expéditeur
                try {
                    Optional<Persons> senderOpt = personsRepository.findById(senderId);
                    if (senderOpt.isPresent()) {
                        Persons sender = senderOpt.get();
                        String senderName = "";
                        if (sender.getNom() != null) senderName += sender.getNom();
                        if (sender.getPrenom() != null) {
                            if (!senderName.isEmpty()) senderName += " ";
                            senderName += sender.getPrenom();
                        }
                        messageData.put("sender_name", senderName.isEmpty() ? "Utilisateur" : senderName);
                    } else {
                        messageData.put("sender_name", "Utilisateur inconnu");
                    }
                } catch (Exception e) {
                    messageData.put("sender_name", "Utilisateur");
                }
                
                messagesData.add(messageData);
            }

            conversationData.put("messages", messagesData);
            conversationData.put("total_messages", messagesData.size());

            response.put("status", "SUCCESS");
            response.put("conversation", conversationData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de la recuperation de la conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Recuperer les messages d'une conversation
     * GET /api/v1/conversations/{id}/messages
     */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> getConversationMessages(@PathVariable String conversationId, @RequestParam(required = false) String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Recuperation messages pour conversation: {}", conversationId);

            // Verifier que la conversation existe
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvee");
                return ResponseEntity.badRequest().body(response);
            }

            Conversation conversation = conversationOpt.get();

            // Utiliser la requête native pour récupérer les messages
            logger.info("Recherche des messages pour conversation: {}", conversationId);
            
            List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conversationId);
            logger.info("Messages bruts trouvés: {}", rawMessages.size());

            List<Map<String, Object>> messageList = new ArrayList<>();
            for (Object[] row : rawMessages) {
                try {
                    Map<String, Object> msgData = new HashMap<>();
                    msgData.put("id", row[0]);
                    msgData.put("content", row[1] != null ? row[1].toString() : "");
                    msgData.put("created_at", row[2] != null ? row[2].toString() : "");
                    msgData.put("sender_id", row[3]);
                    msgData.put("conversation_id", row[4]);
                    msgData.put("message_type", row[5] != null ? row[5].toString() : "TEXT");
                    msgData.put("is_read", row[6] != null ? (Boolean) row[6] : false);
                    
                    // Déterminer le type de sender
                    String senderId = row[3] != null ? row[3].toString() : "";
                    String senderType = "user"; // Par défaut
                    if (conversation.getAgent() != null && senderId.equals(conversation.getAgent().getId())) {
                        senderType = "agent";
                    }
                    msgData.put("sender_type", senderType);
                    
                    // Récupérer le nom de l'expéditeur
                    try {
                        Optional<Persons> senderOpt = personsRepository.findById(senderId);
                        if (senderOpt.isPresent()) {
                            Persons sender = senderOpt.get();
                            String senderName = "";
                            if (sender.getNom() != null) senderName += sender.getNom();
                            if (sender.getPrenom() != null) {
                                if (!senderName.isEmpty()) senderName += " ";
                                senderName += sender.getPrenom();
                            }
                            msgData.put("sender_name", senderName.isEmpty() ? "Utilisateur" : senderName);
                        } else {
                            msgData.put("sender_name", "Utilisateur inconnu");
                        }
                    } catch (Exception e) {
                        msgData.put("sender_name", "Utilisateur");
                    }

                    messageList.add(msgData);
                } catch (Exception msgException) {
                    logger.warn("Erreur lors du traitement du message brut: {}", msgException.getMessage());
                }
            }

            // TODO: Implémenter le marquage des messages comme lus si nécessaire

            response.put("status", "SUCCESS");
            response.put("conversation_id", conversationId);
            response.put("messages", messageList);
            response.put("count", messageList.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de la recuperation des messages: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Rechercher une conversation existante entre un agent, un utilisateur et une entreprise
     * GET /api/v1/conversations/find?agent_id={agentId}&user_id={userId}&entreprise_id={entrepriseId}
     */
    @GetMapping("/find")
    public ResponseEntity<Map<String, Object>> findConversation(
            @RequestParam String agent_id,
            @RequestParam String user_id,
            @RequestParam String entreprise_id) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Recherche conversation: agent={}, user={}, entreprise={}", agent_id, user_id, entreprise_id);
            
            // Rechercher une conversation existante
            List<Conversation> conversations = conversationRepository.findByEntrepriseIdAndAgentIdAndUserId(entreprise_id, agent_id, user_id);
            
            if (!conversations.isEmpty()) {
                // Conversation trouvée
                Conversation conversation = conversations.get(0); // Prendre la première (plus récente)
                
                response.put("status", "FOUND");
                response.put("conversation_id", conversation.getId());
                response.put("message", "Conversation existante trouvée");
                
                logger.info("✅ Conversation existante trouvée: {}", conversation.getId());
                return ResponseEntity.ok(response);
            } else {
                // Aucune conversation trouvée
                response.put("status", "NOT_FOUND");
                response.put("message", "Aucune conversation trouvée");
                
                logger.info("❌ Aucune conversation trouvée");
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            logger.error("Erreur lors de la recherche de conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/health-check")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("NewChatController fonctionne parfaitement !");
    }

    @GetMapping("/test-user/{userId}")
    public ResponseEntity<Map<String, Object>> testUserEndpoint(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("user_id", userId);
        response.put("message", "Endpoint utilisateur accessible");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "Email requis");
                return ResponseEntity.badRequest().body(response);
            }

            emailNotificationService.sendTestEmail(email);
            
            response.put("status", "SUCCESS");
            response.put("message", "Email de test envoyé à " + email);
            response.put("email", email);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de test: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de l'envoi: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/user-native/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversationsNative(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Recuperation conversations pour utilisateur (native): {}", userId);

            // Utiliser la requête native
            List<Object[]> rawConversations = conversationRepository.findUserConversationsNative(userId);
            logger.info("Conversations brutes trouvées: {}", rawConversations.size());

            List<Map<String, Object>> conversationList = new ArrayList<>();
            for (Object[] row : rawConversations) {
                try {
                    Map<String, Object> convData = new HashMap<>();
                    convData.put("id", row[0]);
                    convData.put("subject", row[1] != null ? row[1].toString() : "");
                    convData.put("status", row[2] != null ? row[2].toString() : "");
                    convData.put("created_at", row[3] != null ? row[3].toString() : "");
                    convData.put("updated_at", row[4] != null ? row[4].toString() : "");
                    convData.put("agent_id", row[5]);
                    convData.put("user_id", row[6]);
                    convData.put("entreprise_id", row[7]);

                    // Récupérer les informations de l'agent
                    try {
                        String agentId = row[5] != null ? row[5].toString() : "";
                        Optional<Persons> agentOpt = personsRepository.findById(agentId);
                        if (agentOpt.isPresent()) {
                            Persons agent = agentOpt.get();
                            convData.put("agent_name", agent.getNom() + " " + agent.getPrenom());
                        } else {
                            convData.put("agent_name", "Agent inconnu");
                        }
                    } catch (Exception e) {
                        convData.put("agent_name", "Agent");
                    }

                    // Récupérer les informations de l'entreprise
                    try {
                        String entrepriseId = row[7] != null ? row[7].toString() : "";
                        Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(entrepriseId);
                        if (entrepriseOpt.isPresent()) {
                            Entreprise entreprise = entrepriseOpt.get();
                            convData.put("entreprise_name", entreprise.getNom());
                        } else {
                            convData.put("entreprise_name", "Entreprise inconnue");
                        }
                    } catch (Exception e) {
                        convData.put("entreprise_name", "Entreprise");
                    }

                    // Récupérer les messages de cette conversation
                    try {
                        String conversationId = row[0] != null ? row[0].toString() : "";
                        List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conversationId);
                        
                        // Compter les messages non lus
                        long unreadCount = 0;
                        Object[] lastMessageRow = null;
                        
                        for (Object[] msgRow : rawMessages) {
                            Boolean isRead = msgRow[6] != null ? (Boolean) msgRow[6] : false;
                            String senderId = msgRow[3] != null ? msgRow[3].toString() : "";
                            
                            if (!isRead && !senderId.equals(userId)) {
                                unreadCount++;
                            }
                            
                            lastMessageRow = msgRow;
                        }
                        
                        convData.put("unread_count", unreadCount);
                        convData.put("total_messages", rawMessages.size());

                        // Dernier message
                        if (lastMessageRow != null) {
                            convData.put("last_message_content", lastMessageRow[1] != null ? lastMessageRow[1].toString() : "");
                            convData.put("last_message_time", lastMessageRow[2] != null ? lastMessageRow[2].toString() : "");
                            String lastSenderId = lastMessageRow[3] != null ? lastMessageRow[3].toString() : "";
                            convData.put("last_message_sender", lastSenderId.equals(userId) ? "user" : "agent");
                        }
                    } catch (Exception msgException) {
                        logger.warn("Erreur lors de la récupération des messages pour conversation {}: {}", row[0], msgException.getMessage());
                        convData.put("unread_count", 0);
                        convData.put("total_messages", 0);
                    }

                    conversationList.add(convData);
                } catch (Exception convException) {
                    logger.warn("Erreur lors du traitement de la conversation: {}", convException.getMessage());
                }
            }

            response.put("status", "SUCCESS");
            response.put("user_id", userId);
            response.put("conversations", conversationList);
            response.put("count", conversationList.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur lors de la recuperation des conversations utilisateur (native): {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/user-with-companies/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversationsWithManagedCompanies(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🏢 Récupération conversations pour utilisateur avec entreprises gérées: {}", userId);

            // Utiliser la nouvelle requête qui inclut les entreprises gérées
            List<Object[]> rawConversations = conversationRepository.findUserConversationsWithManagedCompanies(userId);
            logger.info("🏢 Conversations trouvées (incluant entreprises gérées): {}", rawConversations.size());

            List<Map<String, Object>> conversationList = new ArrayList<>();
            for (Object[] row : rawConversations) {
                try {
                    Map<String, Object> convData = new HashMap<>();
                    convData.put("id", row[0]);
                    convData.put("subject", row[1] != null ? row[1].toString() : "");
                    convData.put("status", row[2] != null ? row[2].toString() : "");
                    convData.put("created_at", row[3] != null ? row[3].toString() : "");
                    convData.put("updated_at", row[4] != null ? row[4].toString() : "");
                    convData.put("agent_id", row[5]);
                    convData.put("user_id", row[6]);
                    convData.put("entreprise_id", row[7]);

                    // Récupérer les informations de l'agent
                    try {
                        String agentId = row[5] != null ? row[5].toString() : "";
                        Optional<Persons> agentOpt = personsRepository.findById(agentId);
                        if (agentOpt.isPresent()) {
                            Persons agent = agentOpt.get();
                            convData.put("agent_name", agent.getNom() + " " + agent.getPrenom());
                        } else {
                            convData.put("agent_name", "Agent inconnu");
                        }
                    } catch (Exception e) {
                        convData.put("agent_name", "Agent");
                    }

                    // Récupérer les informations de l'entreprise
                    try {
                        String entrepriseId = row[7] != null ? row[7].toString() : "";
                        Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(entrepriseId);
                        if (entrepriseOpt.isPresent()) {
                            Entreprise entreprise = entrepriseOpt.get();
                            convData.put("entreprise_name", entreprise.getNom());
                        } else {
                            convData.put("entreprise_name", "Entreprise inconnue");
                        }
                    } catch (Exception e) {
                        convData.put("entreprise_name", "Entreprise");
                    }

                    // Récupérer les messages de cette conversation
                    try {
                        String conversationId = row[0] != null ? row[0].toString() : "";
                        List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conversationId);
                        
                        // Compter les messages non lus
                        long unreadCount = 0;
                        Object[] lastMessageRow = null;
                        
                        for (Object[] msgRow : rawMessages) {
                            Boolean isRead = msgRow[6] != null ? (Boolean) msgRow[6] : false;
                            String senderId = msgRow[3] != null ? msgRow[3].toString() : "";
                            
                            if (!isRead && !senderId.equals(userId)) {
                                unreadCount++;
                            }
                            
                            lastMessageRow = msgRow;
                        }
                        
                        convData.put("unread_count", unreadCount);
                        convData.put("total_messages", rawMessages.size());

                        // Dernier message
                        if (lastMessageRow != null) {
                            convData.put("last_message_content", lastMessageRow[1] != null ? lastMessageRow[1].toString() : "");
                            convData.put("last_message_time", lastMessageRow[2] != null ? lastMessageRow[2].toString() : "");
                            String lastSenderId = lastMessageRow[3] != null ? lastMessageRow[3].toString() : "";
                            convData.put("last_message_sender", lastSenderId.equals(userId) ? "user" : "agent");
                        }
                    } catch (Exception msgException) {
                        logger.warn("Erreur lors de la récupération des messages pour conversation {}: {}", row[0], msgException.getMessage());
                        convData.put("unread_count", 0);
                        convData.put("total_messages", 0);
                    }

                    conversationList.add(convData);
                } catch (Exception convException) {
                    logger.warn("Erreur lors du traitement de la conversation: {}", convException.getMessage());
                }
            }

            response.put("status", "SUCCESS");
            response.put("user_id", userId);
            response.put("conversations", conversationList);
            response.put("count", conversationList.size());
            response.put("includes_managed_companies", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("🏢 Erreur lors de la récupération des conversations avec entreprises gérées: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/debug/messages")
    public ResponseEntity<Map<String, Object>> debugMessages() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Message> allMessages = messageRepository.findAll();
            logger.info("Total messages dans la base: {}", allMessages.size());
            
            List<Map<String, Object>> messageDetails = new ArrayList<>();
            for (Message msg : allMessages) {
                Map<String, Object> msgInfo = new HashMap<>();
                msgInfo.put("id", msg.getId());
                msgInfo.put("content", msg.getContent());
                msgInfo.put("conversation_id", msg.getConversation() != null ? msg.getConversation().getId() : "NULL");
                messageDetails.add(msgInfo);
            }
            
            response.put("status", "SUCCESS");
            response.put("total_messages", allMessages.size());
            response.put("messages", messageDetails);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erreur debug: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/debug/native/{conversationId}")
    public ResponseEntity<Map<String, Object>> debugNativeMessages(@PathVariable String conversationId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Object[]> rawMessages = messageRepository.findMessagesByConversationIdNative(conversationId);
            logger.info("Messages bruts trouvés pour {}: {}", conversationId, rawMessages.size());
            
            List<Map<String, Object>> messageDetails = new ArrayList<>();
            for (Object[] row : rawMessages) {
                Map<String, Object> msgInfo = new HashMap<>();
                msgInfo.put("id", row[0]);
                msgInfo.put("content", row[1]);
                msgInfo.put("created_at", row[2]);
                msgInfo.put("sender_id", row[3]);
                msgInfo.put("conversation_id", row[4]);
                msgInfo.put("message_type", row[5]);
                msgInfo.put("is_read", row[6]);
                messageDetails.add(msgInfo);
            }
            
            response.put("status", "SUCCESS");
            response.put("conversation_id", conversationId);
            response.put("raw_messages_count", rawMessages.size());
            response.put("messages", messageDetails);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erreur debug native: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/debug/user/{userId}")
    public ResponseEntity<Map<String, Object>> debugUserConversations(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Test simple : récupérer toutes les conversations
            List<Conversation> allConversations = conversationRepository.findAll();
            logger.info("Total conversations: {}", allConversations.size());
            
            List<Map<String, Object>> userConversations = new ArrayList<>();
            for (Conversation conv : allConversations) {
                if (conv.getUser() != null && userId.equals(conv.getUser().getId())) {
                    Map<String, Object> convInfo = new HashMap<>();
                    convInfo.put("id", conv.getId());
                    convInfo.put("subject", conv.getSubject());
                    convInfo.put("user_id", conv.getUser().getId());
                    convInfo.put("entreprise_name", conv.getEntreprise() != null ? conv.getEntreprise().getNom() : "NULL");
                    userConversations.add(convInfo);
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("user_id", userId);
            response.put("total_conversations", allConversations.size());
            response.put("user_conversations", userConversations);
            response.put("user_conversations_count", userConversations.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erreur debug user: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/{conversationId}/mark-read")
    public ResponseEntity<Map<String, Object>> markMessagesAsRead(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = request.get("user_id");
            logger.info("🔖 Marquage des messages comme lus - Conversation: {}, User: {}", conversationId, userId);
            
            // Vérifier que la conversation existe
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (!conversationOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée");
                return ResponseEntity.status(404).body(response);
            }
            
            Conversation conversation = conversationOpt.get();
            
            // Vérifier que l'utilisateur a accès à cette conversation
            boolean hasAccess = false;
            
            // Accès direct : l'utilisateur est le user_id de la conversation
            if (conversation.getUser() != null && userId.equals(conversation.getUser().getId())) {
                hasAccess = true;
                logger.info("🔑 Accès direct accordé - utilisateur est le user_id de la conversation");
            }
            
            // Accès via entreprise : l'utilisateur a un rôle dans l'entreprise de la conversation
            if (!hasAccess && conversation.getEntreprise() != null) {
                try {
                    // Vérifier si l'utilisateur a un rôle actif dans cette entreprise
                    List<Object[]> userRoles = conversationRepository.findUserConversationsWithManagedCompanies(userId);
                    for (Object[] row : userRoles) {
                        String entrepriseId = row[7] != null ? row[7].toString() : "";
                        if (conversation.getEntreprise().getId().equals(entrepriseId)) {
                            hasAccess = true;
                            logger.info("🏢 Accès via entreprise accordé - utilisateur a des droits sur l'entreprise {}", entrepriseId);
                            break;
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Erreur lors de la vérification des droits entreprise: {}", e.getMessage());
                }
            }
            
            if (!hasAccess) {
                response.put("status", "ERROR");
                response.put("message", "Accès non autorisé à cette conversation");
                return ResponseEntity.status(403).body(response);
            }
            
            // Marquer tous les messages de l'agent comme lus pour cet utilisateur
            List<Message> messages = messageRepository.findByConversation_IdOrderByCreationAsc(conversationId);
            int updatedCount = 0;
            
            for (Message message : messages) {
                // Déterminer si c'est un message de l'agent
                boolean isAgentMessage = false;
                if (conversation.getAgent() != null && message.getSender() != null) {
                    isAgentMessage = conversation.getAgent().getId().equals(message.getSender().getId());
                }
                
                // Marquer comme lu seulement les messages de l'agent qui ne sont pas encore lus
                if (isAgentMessage && !message.getIsRead()) {
                    message.setIsRead(true);
                    messageRepository.save(message);
                    updatedCount++;
                }
            }
            
            logger.info("✅ {} messages marqués comme lus", updatedCount);
            
            response.put("status", "SUCCESS");
            response.put("conversation_id", conversationId);
            response.put("user_id", userId);
            response.put("messages_marked_read", updatedCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du marquage des messages comme lus: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors du marquage des messages comme lus: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
