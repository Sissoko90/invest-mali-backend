package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.dto.chat.*;
import abdaty_technologie.API_Invest.service.ChatService;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.repository.MessageRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.ConversationRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.Conversation;

import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus;

import abdaty_technologie.API_Invest.exception.NotFoundException;


import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.io.File;
import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Contrôleur REST pour la gestion du système de chat selon la logique métier :
 * 1. Les agents initient les conversations (pas les utilisateurs)
 * 2. Une conversation = 1 entreprise + 1 agent + 1 utilisateur
 * 3. Messages envoyés par agent OU utilisateur
 */
@RestController
@RequestMapping("/api/v1/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    
    // Stockage en mémoire pour les conversations réelles
    private static final Map<String, Map<String, Object>> conversations = new ConcurrentHashMap<>();
    private static final Map<String, List<Map<String, Object>>> conversationMessages = new ConcurrentHashMap<>();
    
    // Configuration des fichiers de sauvegarde
    @Value("${chat.data.directory:./data}")
    private String dataDirectory;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatService chatService;

    @Autowired
    private UtilisateursRepository utilisateursRepository;

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
     * Crée une nouvelle conversation
     */
    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> createConversation(
            @Valid @RequestBody ConversationRequest request,
            Authentication authentication) {
        
        String agentId = getCurrentUserId(authentication);
        ConversationResponse response = chatService.createConversation(request, agentId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Démarre une conversation depuis une entreprise (utilise la vraie base de données)
     */
    @PostMapping("/conversations/start-from-entreprise/{entrepriseId}")
    public ResponseEntity<Map<String, Object>> startConversationFromEntreprise(
            @PathVariable String entrepriseId,
            @Valid @RequestBody StartConversationRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📤 Démarrage conversation depuis entreprise - entrepriseId: {}, userId: {}", 
                       entrepriseId, request.getUserId());
            
            // Vérifier que l'entreprise existe
            boolean entrepriseExists = entrepriseRepository.existsById(entrepriseId);
            if (!entrepriseExists) {
                response.put("status", "ERROR");
                response.put("message", "Entreprise non trouvée: " + entrepriseId);
                return ResponseEntity.badRequest().body(response);
            }
            
            // Utiliser l'agent par défaut
            String defaultAgentId = "6d3e1dca-8241-4e42-ad64-90f54b3210f7"; // Moussa Macalou
            
            // Utiliser le ChatService pour créer une vraie conversation
            ConversationResponse conversationResponse = chatService.startConversationFromEntreprise(
                entrepriseId, request, defaultAgentId);
            
            logger.info("✅ Conversation créée depuis entreprise - conversationId: {}", conversationResponse.getId());
            
            response.put("status", "SUCCESS");
            response.put("message", "Conversation créée avec succès");
            response.put("conversationId", conversationResponse.getId());
            response.put("entrepriseId", entrepriseId);
            response.put("userId", request.getUserId());
            response.put("agentId", defaultAgentId);
            response.put("agentName", "Moussa Macalou");
            response.put("subject", conversationResponse.getSubject());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du démarrage de conversation depuis entreprise: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Démarre une conversation depuis l'interface utilisateur avec persistance en base
     */
    @PostMapping("/conversations/start-user")
    public ResponseEntity<Map<String, Object>> startConversationFromUser(
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = request.get("userId");
            String message = request.get("message");
            String subject = request.get("subject");
            
            if (userId == null || message == null) {
                response.put("status", "ERROR");
                response.put("message", "userId et message sont requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Utiliser le ChatService pour créer la conversation en base de données
            logger.info("📤 Création conversation utilisateur - userId: {}, message: {}", userId, message);
            
            // Récupérer l'entreprise réelle de l'utilisateur
            String realEntrepriseId = getRealEntrepriseIdForUser(userId);
            logger.info("🏢 Entreprise trouvée pour utilisateur {}: {}", userId, realEntrepriseId);
            
            ConversationRequest conversationRequest = new ConversationRequest();
            conversationRequest.setUserId(userId);
            conversationRequest.setSubject(subject != null ? subject : "Demande d'assistance");
            conversationRequest.setInitialMessage(message);
            conversationRequest.setEntrepriseId(realEntrepriseId);
            
            // Utiliser l'agent par défaut
            String defaultAgentId = "6d3e1dca-8241-4e42-ad64-90f54b3210f7"; // Moussa Macalou
            
            ConversationResponse conversationResponse = chatService.createConversation(conversationRequest, defaultAgentId);
            
            logger.info("✅ Conversation utilisateur créée en base - conversationId: {}", conversationResponse.getId());
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversationResponse.getId());
            response.put("agentId", defaultAgentId);
            response.put("agentName", "Moussa Macalou");
            response.put("subject", conversationResponse.getSubject());
            response.put("initialMessage", message);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
            /* Code de persistance en base (temporairement désactivé)
            // Essayer de récupérer les entités utilisateur et agent
            Optional<Persons> userOpt = personsRepository.findById(userId);
            String agentId = "0e310523-c3a2-4e5b-8674-1c0d1614ea83"; // Agent d'accueil par défaut
            Optional<Persons> agentOpt = personsRepository.findById(agentId);
            
            // Si les entités ne sont pas trouvées, utiliser le stockage en mémoire comme fallback
            if (!userOpt.isPresent() || !agentOpt.isPresent()) {
                return createInMemoryConversation(userId, message, subject, response);
            }
            
            Persons user = userOpt.get();
            Persons agent = agentOpt.get();
            
            // Créer la conversation en base de données
            Conversation conversation = new Conversation();
            conversation.setUser(user);
            conversation.setAgent(agent);
            conversation.setSubject(subject != null ? subject : "Demande d'assistance");
            conversation.setStatus(ConversationStatus.ACTIVE);
            
            // Essayer de trouver une entreprise par défaut ou créer une entreprise générique
            try {
                // Chercher une entreprise existante (première trouvée)
                List<Entreprise> entreprises = entrepriseRepository.findAll();
                if (!entreprises.isEmpty()) {
                    conversation.setEntreprise(entreprises.get(0));
                } else {
                    // Créer une entreprise par défaut si aucune n'existe
                    Entreprise defaultEntreprise = new Entreprise();
                    defaultEntreprise.setNom("Chat Support");
                    defaultEntreprise.setReference("CHAT-" + System.currentTimeMillis());
                    defaultEntreprise.setCapitale(new java.math.BigDecimal("1000000"));
                    defaultEntreprise.setActiviteSecondaire("Support client via chat");
                    defaultEntreprise.setAdresseDifferentIdentite(false);
                    defaultEntreprise.setExtraitJudiciaire(false);
                    defaultEntreprise = entrepriseRepository.save(defaultEntreprise);
                    conversation.setEntreprise(defaultEntreprise);
                }
            } catch (Exception e) {
                // Si problème avec l'entreprise, utiliser le fallback mémoire
                return createInMemoryConversation(userId, message, subject, response);
            }
            
            // Sauvegarder la conversation
            conversation = conversationRepository.save(conversation);
            
            // Créer le message initial de l'utilisateur
            Message userMessage = new Message(conversation, user, message);
            userMessage.setMessageType(MessageType.TEXT);
            messageRepository.save(userMessage);
            
            // Créer le message de bienvenue de l'agent
            String welcomeMessage = "Bonjour ! Je suis " + agent.getPrenom() + " " + agent.getNom() + 
                                  ", votre agent d'assistance. J'ai bien reçu votre message et je vais vous aider dans les meilleurs délais. Comment puis-je vous assister aujourd'hui ?";
            Message agentMessage = new Message(conversation, agent, welcomeMessage);
            agentMessage.setMessageType(MessageType.TEXT);
            messageRepository.save(agentMessage);
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversation.getId());
            response.put("agentId", agent.getId());
            response.put("agentName", agent.getPrenom() + " " + agent.getNom());
            response.put("userId", user.getId());
            response.put("subject", conversation.getSubject());
            response.put("message", "Conversation créée avec succès");
            response.put("initialMessage", message);
            
            return ResponseEntity.ok(response);
            */
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Crée une conversation en mémoire comme fallback
     */
    private ResponseEntity<Map<String, Object>> createInMemoryConversation(
            String userId, String message, String subject, Map<String, Object> response) {
        
        try {
            // Créer une vraie conversation persistante en mémoire
            String conversationId = "conv-" + System.currentTimeMillis();
            String agentId = "0e310523-c3a2-4e5b-8674-1c0d1614ea83"; // Agent d'accueil par défaut
            
            // Créer la conversation
            Map<String, Object> conversation = new HashMap<>();
            conversation.put("id", conversationId);
            conversation.put("userId", userId);
            conversation.put("agentId", agentId);
            conversation.put("subject", subject != null ? subject : "Assistance InvestMali");
            conversation.put("status", "ACTIVE");
            conversation.put("createdAt", System.currentTimeMillis());
            conversation.put("agentName", "Moussa Macalou");
            conversation.put("userName", "Utilisateur");
            
            // Ajouter les informations d'entreprise
            Map<String, Object> entrepriseInfo = getEntrepriseInfoForUser(userId);
            conversation.put("entrepriseId", entrepriseInfo.get("entrepriseId"));
            conversation.put("entrepriseNom", entrepriseInfo.get("entrepriseNom"));
            conversation.put("creatorUserId", entrepriseInfo.get("creatorUserId"));
            conversation.put("creatorUserName", entrepriseInfo.get("creatorUserName"));
            
            // Stocker la conversation
            conversations.put(conversationId, conversation);
            
            // Créer la liste des messages pour cette conversation
            List<Map<String, Object>> messages = new ArrayList<>();
            
            // Message initial de l'utilisateur
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("id", "msg-" + System.currentTimeMillis());
            userMessage.put("conversationId", conversationId);
            userMessage.put("senderId", userId);
            userMessage.put("senderType", "USER");
            userMessage.put("content", message);
            userMessage.put("timestamp", System.currentTimeMillis());
            userMessage.put("senderName", "Utilisateur");
            messages.add(userMessage);
            
            // Message de bienvenue automatique de l'agent
            Map<String, Object> agentMessage = new HashMap<>();
            agentMessage.put("id", "msg-" + (System.currentTimeMillis() + 1));
            agentMessage.put("conversationId", conversationId);
            agentMessage.put("senderId", agentId);
            agentMessage.put("senderType", "AGENT");
            agentMessage.put("content", "Bonjour ! Je suis Moussa Macalou. Comment puis-je vous aider ?");
            agentMessage.put("timestamp", System.currentTimeMillis() + 1);
            agentMessage.put("senderName", "Moussa Macalou");
            messages.add(agentMessage);
            
            // Stocker les messages
            conversationMessages.put(conversationId, messages);
            
            // Sauvegarder immédiatement
            saveImmediately();
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversationId);
            response.put("agentId", agentId);
            response.put("agentName", "Moussa Macalou");
            response.put("userId", userId);
            response.put("subject", subject != null ? subject : "Demande d'assistance");
            response.put("message", "Conversation créée avec succès (mémoire)");
            response.put("initialMessage", message);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la création en mémoire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Démarre une conversation depuis l'interface agent
     */
    @PostMapping("/conversations/start-agent")
    public ResponseEntity<Map<String, Object>> startConversationFromAgent(
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = request.get("agentId");
            String userId = request.get("userId");
            String message = request.get("message");
            String subject = request.get("subject");
            String entrepriseId = request.get("entrepriseId");
            
            if (agentId == null || userId == null || message == null) {
                response.put("status", "ERROR");
                response.put("message", "agentId, userId et message sont requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            logger.info("📤 Création conversation agent - agentId: {}, userId: {}, entrepriseId: {}", 
                agentId, userId, entrepriseId);
            
            // Utiliser le ChatService pour créer la conversation en base de données
            ConversationRequest conversationRequest = new ConversationRequest();
            conversationRequest.setUserId(userId);
            conversationRequest.setSubject(subject != null ? subject : "Contact agent");
            conversationRequest.setEntrepriseId(entrepriseId);
            conversationRequest.setInitialMessage(message);
            
            ConversationResponse conversationResponse = chatService.createConversation(conversationRequest, agentId);
            
            logger.info("✅ Conversation créée en base - conversationId: {}", conversationResponse.getId());
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversationResponse.getId());
            response.put("agentId", agentId);
            response.put("userId", userId);
            response.put("subject", conversationResponse.getSubject());
            response.put("message", "Conversation initiée par l'agent avec succès");
            response.put("initialMessage", message);
            response.put("initiatedBy", "AGENT");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la création de conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Crée une conversation initiée par un agent
     */
    private ResponseEntity<Map<String, Object>> createAgentInitiatedConversation(
            String agentId, String userId, String message, String subject, String entrepriseId, String entrepriseNom, Map<String, Object> response) {
        
        try {
            // Créer une conversation initiée par l'agent
            String conversationId = "conv-" + System.currentTimeMillis();
            
            // Créer la conversation
            Map<String, Object> conversation = new HashMap<>();
            conversation.put("id", conversationId);
            conversation.put("userId", userId);
            conversation.put("agentId", agentId);
            conversation.put("subject", subject != null ? subject : "Contact agent");
            conversation.put("status", "ACTIVE");
            conversation.put("createdAt", System.currentTimeMillis());
            conversation.put("agentName", "Agent"); // À améliorer avec le vrai nom
            conversation.put("userName", "Utilisateur"); // À améliorer avec le vrai nom
            conversation.put("initiatedBy", "AGENT"); // Marquer comme initiée par agent
            
            // Ajouter les informations d'entreprise (utiliser les IDs réels)
            String finalEntrepriseId = entrepriseId != null ? entrepriseId : "default-entreprise-" + userId;
            String finalEntrepriseNom = entrepriseNom != null ? entrepriseNom : "Entreprise de " + userId;
            
            conversation.put("entrepriseId", finalEntrepriseId);
            conversation.put("entrepriseNom", finalEntrepriseNom);
            conversation.put("creatorUserId", userId);
            conversation.put("creatorUserName", "Utilisateur");
            
            logger.info("🏢 Conversation créée avec entrepriseId: {} pour entreprise: {}", finalEntrepriseId, finalEntrepriseNom);
            
            // Stocker la conversation
            conversations.put(conversationId, conversation);
            
            // Créer la liste des messages pour cette conversation
            List<Map<String, Object>> messages = new ArrayList<>();
            
            // Message initial de l'agent
            Map<String, Object> agentMessage = new HashMap<>();
            agentMessage.put("id", "msg-" + System.currentTimeMillis());
            agentMessage.put("conversationId", conversationId);
            agentMessage.put("senderId", agentId);
            agentMessage.put("senderType", "AGENT");
            agentMessage.put("content", message);
            agentMessage.put("timestamp", System.currentTimeMillis());
            agentMessage.put("senderName", "Agent");
            messages.add(agentMessage);
            
            // Stocker les messages
            conversationMessages.put(conversationId, messages);
            
            // Sauvegarder immédiatement
            saveImmediately();
            
            response.put("status", "SUCCESS");
            response.put("conversationId", conversationId);
            response.put("agentId", agentId);
            response.put("userId", userId);
            response.put("subject", subject != null ? subject : "Contact agent");
            response.put("message", "Conversation initiée par l'agent avec succès");
            response.put("initialMessage", message);
            response.put("initiatedBy", "AGENT");
            
            logger.info("📞 Agent {} a initié une conversation avec utilisateur {}: {}", 
                       agentId, userId, conversationId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la création par agent: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère une conversation par son ID avec ses messages
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(
            @PathVariable String conversationId) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Vérifier si c'est une vraie conversation en base de données
        try {
            logger.info("🔍 Recherche conversation en DB - conversationId: {}", conversationId);
            
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (conversationOpt.isPresent()) {
                Conversation conversation = conversationOpt.get();
                
                logger.info("✅ Conversation trouvée en DB - subject: {}", conversation.getSubject());
                
                // Récupérer les messages de la conversation
                List<Message> messages = messageRepository.findByConversationIdOrderByCreationAsc(conversationId);
                
                logger.info("📨 {} messages trouvés pour cette conversation", messages.size());
                
                // Convertir les messages au format attendu
                List<Map<String, Object>> messageList = new ArrayList<>();
                for (Message msg : messages) {
                    Map<String, Object> messageMap = new HashMap<>();
                    messageMap.put("id", msg.getId());
                    messageMap.put("conversationId", msg.getConversation().getId());
                    messageMap.put("senderId", msg.getSender().getId());
                    messageMap.put("senderType", msg.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                    messageMap.put("content", msg.getContent());
                    messageMap.put("timestamp", msg.getCreation().toEpochMilli());
                    messageMap.put("senderName", msg.getSender().getPrenom() + " " + msg.getSender().getNom());
                    messageMap.put("messageType", msg.getMessageType().toString());
                    messageList.add(messageMap);
                }
                
                response.put("status", "SUCCESS");
                response.put("id", conversation.getId());
                response.put("subject", conversation.getSubject());
                response.put("messages", messageList);
                response.put("agentNom", conversation.getAgent().getPrenom() + " " + conversation.getAgent().getNom());
                response.put("userNom", conversation.getUser().getPrenom() + " " + conversation.getUser().getNom());
                response.put("agentId", conversation.getAgent().getId());
                response.put("userId", conversation.getUser().getId());
                response.put("conversationStatus", conversation.getStatus().toString());
                
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ Conversation non trouvée en DB - conversationId: {}", conversationId);
            }
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération de la conversation: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Conversation non trouvée: " + conversationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        // Vérifier si c'est une conversation en mémoire
        if (conversationId.startsWith("conv-")) {
            Map<String, Object> conversation = conversations.get(conversationId);
            if (conversation != null) {
                List<Map<String, Object>> messages = conversationMessages.get(conversationId);
                if (messages == null) {
                    messages = new ArrayList<>();
                }
                
                response.put("status", "SUCCESS");
                response.put("id", conversationId);
                response.put("subject", conversation.get("subject"));
                response.put("messages", messages);
                response.put("agentNom", conversation.get("agentName"));
                response.put("userNom", conversation.get("userName"));
                response.put("agentId", conversation.get("agentId"));
                response.put("userId", conversation.get("userId"));
                response.put("conversationStatus", conversation.get("status"));
                
                return ResponseEntity.ok(response);
            }
        }
        
        // Si l'ID est undefined ou commence par "simulated-" ou "user-chat-", retourner une simulation
        if ("undefined".equals(conversationId) || conversationId.startsWith("simulated-") || conversationId.startsWith("user-chat-")) {
            response.put("status", "SIMULATED");
            response.put("id", conversationId);
            response.put("subject", conversationId.startsWith("user-chat-") ? "Assistance utilisateur" : "Conversation simulée");
            response.put("messages", java.util.Collections.emptyList());
            response.put("agentNom", "Agent d'assistance");
            response.put("userNom", "Utilisateur");
            
            return ResponseEntity.ok(response);
        }
        
        // Conversation non trouvée
        response.put("status", "ERROR");
        response.put("message", "Conversation non trouvée: " + conversationId);
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Marque une conversation comme lue
     */
    @PatchMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Map<String, Object>> markConversationAsRead(
            @PathVariable String conversationId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📖 Marquage conversation comme lue - conversationId: {}", conversationId);
            
            // Pour l'instant, utiliser l'ID de l'agent par défaut
            // TODO: Récupérer l'ID depuis l'authentification quand elle sera configurée
            String userId = "6d3e1dca-8241-4e42-ad64-90f54b3210f7"; // Agent Moussa Macalou
            
            // Utiliser le ChatService pour marquer comme lue
            chatService.markConversationAsRead(conversationId, userId);
            
            response.put("status", "SUCCESS");
            response.put("message", "Conversation marquée comme lue");
            response.put("conversationId", conversationId);
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException e) {
            logger.warn("⚠️ Conversation non trouvée pour marquage lecture: {}", conversationId);
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("❌ Erreur lors du marquage lecture: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère toutes les conversations d'un agent
     */
    @GetMapping("/conversations/agent")
    public ResponseEntity<Map<String, Object>> getAgentConversations(
            @RequestParam String agentId,
            @RequestParam(required = false) String entrepriseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Récupération conversations pour agent: {}, entrepriseId: {}", agentId, entrepriseId);
            
            List<Conversation> agentConversations;
            
            if (entrepriseId != null && !entrepriseId.isEmpty()) {
                // Filtrer par entreprise spécifique
                agentConversations = conversationRepository.findByUserIdOrAgentIdAndEntrepriseIdOrderByModificationDesc(agentId, agentId, entrepriseId);
                logger.info("✅ {} conversations trouvées pour l'agent dans l'entreprise {}", agentConversations.size(), entrepriseId);
            } else {
                // Récupérer toutes les conversations où l'agent est participant
                agentConversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(agentId, agentId);
                logger.info("✅ {} conversations trouvées pour l'agent", agentConversations.size());
            }
            
            List<Map<String, Object>> conversationList = new ArrayList<>();
            
            for (Conversation conversation : agentConversations) {
                Map<String, Object> conversationSummary = new HashMap<>();
                conversationSummary.put("id", conversation.getId());
                conversationSummary.put("subject", conversation.getSubject());
                conversationSummary.put("agentId", conversation.getAgent().getId());
                conversationSummary.put("agentName", conversation.getAgent().getPrenom() + " " + conversation.getAgent().getNom());
                conversationSummary.put("userId", conversation.getUser().getId());
                conversationSummary.put("userName", conversation.getUser().getPrenom() + " " + conversation.getUser().getNom());
                conversationSummary.put("createdAt", conversation.getCreation().toEpochMilli());
                conversationSummary.put("status", conversation.getStatus().toString());
                
                // Ajouter les informations d'entreprise
                if (conversation.getEntreprise() != null) {
                    conversationSummary.put("entrepriseId", conversation.getEntreprise().getId());
                    conversationSummary.put("entrepriseNom", conversation.getEntreprise().getNom());
                }
                
                // Récupérer le dernier message
                Message lastMessage = messageRepository.findLastMessageInConversation(conversation.getId());
                if (lastMessage != null) {
                    conversationSummary.put("lastMessage", lastMessage.getContent());
                    conversationSummary.put("lastMessageTime", lastMessage.getCreation().toEpochMilli());
                    conversationSummary.put("lastMessageSender", 
                        lastMessage.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                }
                
                conversationList.add(conversationSummary);
            }
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversationList);
            response.put("totalConversations", conversationList.size());
            response.put("page", page);
            response.put("size", size);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations agent: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            response.put("conversations", java.util.Collections.emptyList());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère toutes les conversations d'un utilisateur (avec userId en paramètre)
     */
    @GetMapping("/conversations/user")
    public ResponseEntity<Map<String, Object>> getUserConversations(
            @RequestParam String userId,
            @RequestParam(required = false) String entrepriseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Récupération conversations pour utilisateur: {}, entrepriseId: {}", userId, entrepriseId);
            
            List<Conversation> userConversations;
            
            if (entrepriseId != null && !entrepriseId.isEmpty()) {
                // Filtrer par entreprise spécifique
                userConversations = conversationRepository.findByUserIdOrAgentIdAndEntrepriseIdOrderByModificationDesc(userId, userId, entrepriseId);
                logger.info("✅ {} conversations trouvées pour l'utilisateur dans l'entreprise {}", userConversations.size(), entrepriseId);
            } else {
                // Récupérer toutes les conversations où l'utilisateur est participant
                userConversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(userId, userId);
                logger.info("✅ {} conversations trouvées pour l'utilisateur", userConversations.size());
            }
            
            List<Map<String, Object>> conversationList = new ArrayList<>();
            
            for (Conversation conversation : userConversations) {
                Map<String, Object> conversationSummary = new HashMap<>();
                conversationSummary.put("id", conversation.getId());
                conversationSummary.put("subject", conversation.getSubject());
                conversationSummary.put("agentId", conversation.getAgent().getId());
                conversationSummary.put("agentName", conversation.getAgent().getPrenom() + " " + conversation.getAgent().getNom());
                conversationSummary.put("userId", conversation.getUser().getId());
                conversationSummary.put("userName", conversation.getUser().getPrenom() + " " + conversation.getUser().getNom());
                conversationSummary.put("createdAt", conversation.getCreation().toEpochMilli());
                conversationSummary.put("status", conversation.getStatus().toString());
                
                // Ajouter les informations d'entreprise
                if (conversation.getEntreprise() != null) {
                    conversationSummary.put("entrepriseId", conversation.getEntreprise().getId());
                    conversationSummary.put("entrepriseNom", conversation.getEntreprise().getNom());
                }
                
                // Récupérer le dernier message
                Message lastMessage = messageRepository.findLastMessageInConversation(conversation.getId());
                if (lastMessage != null) {
                    conversationSummary.put("lastMessage", lastMessage.getContent());
                    conversationSummary.put("lastMessageTime", lastMessage.getCreation().toEpochMilli());
                    conversationSummary.put("lastMessageSender", 
                        lastMessage.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                }
                
                conversationList.add(conversationSummary);
            }
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversationList);
            response.put("totalConversations", conversationList.size());
            response.put("page", page);
            response.put("size", size);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            response.put("conversations", java.util.Collections.emptyList());
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
            
            logger.info("📤 Envoi message - conversationId: {}, senderId: {}, content: {}", 
                conversationId, senderId, content.substring(0, Math.min(content.length(), 50)));
            
            // Utiliser le ChatService pour sauvegarder en base de données
            MessageRequest messageRequest = new MessageRequest();
            messageRequest.setContent(content.trim());
            messageRequest.setMessageType("TEXT");
            
            MessageResponse messageResponse = chatService.sendMessage(conversationId, messageRequest, senderId);
            
            logger.info("✅ Message sauvegardé en base - messageId: {}", messageResponse.getId());
            
            response.put("status", "SUCCESS");
            response.put("message", "Message envoyé avec succès");
            response.put("messageId", messageResponse.getId());
            response.put("conversationId", conversationId);
            response.put("content", content);
            response.put("timestamp", messageResponse.getCreation()); // Utiliser getCreation() au lieu de getCreatedAt()
            response.put("senderType", messageResponse.getSenderRole()); // Utiliser getSenderRole() au lieu de getSenderType()
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'envoi du message: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de l'envoi: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // L'endpoint markConversationAsRead est déjà défini plus haut

    /**
     * Liste les conversations d'un utilisateur spécifique
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversations(
            @PathVariable String userId,
            @RequestParam(required = false) String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 [getUserConversations] Début - userId: {}, entrepriseId: {}", userId, entrepriseId);
            
            // Vérifier que l'utilisateur existe
            if (!personsRepository.existsById(userId)) {
                logger.warn("⚠️ Utilisateur non trouvé: {}", userId);
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                response.put("conversations", java.util.Collections.emptyList());
                return ResponseEntity.badRequest().body(response);
            }
            
            logger.info("✅ Utilisateur existe: {}", userId);
            
            List<Conversation> userConversations;
            
            if (entrepriseId != null && !entrepriseId.isEmpty()) {
                logger.info("🔍 Recherche avec filtre entreprise: {}", entrepriseId);
                // Filtrer par entreprise spécifique
                userConversations = conversationRepository.findByUserIdOrAgentIdAndEntrepriseIdOrderByModificationDesc(userId, userId, entrepriseId);
                logger.info("✅ {} conversations trouvées pour l'utilisateur dans l'entreprise {}", userConversations.size(), entrepriseId);
            } else {
                logger.info("🔍 Recherche sans filtre entreprise");
                // Récupérer toutes les conversations où l'utilisateur est participant
                userConversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(userId, userId);
                logger.info("✅ {} conversations trouvées pour l'utilisateur", userConversations.size());
            }
            
            List<Map<String, Object>> conversationList = new ArrayList<>();
            
            for (Conversation conversation : userConversations) {
                Map<String, Object> conversationSummary = new HashMap<>();
                conversationSummary.put("id", conversation.getId());
                conversationSummary.put("subject", conversation.getSubject());
                conversationSummary.put("agentId", conversation.getAgent().getId());
                conversationSummary.put("agentName", conversation.getAgent().getPrenom() + " " + conversation.getAgent().getNom());
                conversationSummary.put("userId", conversation.getUser().getId());
                conversationSummary.put("userName", conversation.getUser().getPrenom() + " " + conversation.getUser().getNom());
                conversationSummary.put("createdAt", conversation.getCreation().toEpochMilli());
                conversationSummary.put("status", conversation.getStatus().toString());
                
                // Ajouter les informations d'entreprise
                if (conversation.getEntreprise() != null) {
                    conversationSummary.put("entrepriseId", conversation.getEntreprise().getId());
                    conversationSummary.put("entrepriseNom", conversation.getEntreprise().getNom());
                }
                
                // Récupérer le dernier message
                Message lastMessage = messageRepository.findLastMessageInConversation(conversation.getId());
                if (lastMessage != null) {
                    conversationSummary.put("lastMessage", lastMessage.getContent());
                    conversationSummary.put("lastMessageTime", lastMessage.getCreation().toEpochMilli());
                    conversationSummary.put("lastMessageSender", 
                        lastMessage.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                }
                
                conversationList.add(conversationSummary);
            }
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversationList);
            response.put("total", conversationList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations utilisateur: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des conversations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Liste toutes les conversations actives (pour les agents)
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/active")
    public ResponseEntity<Map<String, Object>> getActiveConversations(
            @RequestParam(required = false) String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Récupération conversations actives - entrepriseId: {}", entrepriseId);
            
            List<Conversation> activeConversations;
            
            if (entrepriseId != null && !entrepriseId.isEmpty()) {
                // Filtrer par entreprise spécifique
                activeConversations = conversationRepository.findByEntrepriseIdOrderByCreationDesc(entrepriseId);
                logger.info("✅ {} conversations actives trouvées pour l'entreprise {}", activeConversations.size(), entrepriseId);
            } else {
                // Récupérer toutes les conversations actives
                activeConversations = conversationRepository.findAll().stream()
                    .filter(c -> c.getStatus() == ConversationStatus.ACTIVE)
                    .sorted((a, b) -> b.getModification().compareTo(a.getModification()))
                    .collect(java.util.stream.Collectors.toList());
                logger.info("✅ {} conversations actives trouvées", activeConversations.size());
            }
            
            List<Map<String, Object>> conversationList = new ArrayList<>();
            
            for (Conversation conversation : activeConversations) {
                Map<String, Object> conversationSummary = new HashMap<>();
                conversationSummary.put("id", conversation.getId());
                conversationSummary.put("subject", conversation.getSubject());
                conversationSummary.put("agentId", conversation.getAgent().getId());
                conversationSummary.put("agentName", conversation.getAgent().getPrenom() + " " + conversation.getAgent().getNom());
                conversationSummary.put("userId", conversation.getUser().getId());
                conversationSummary.put("userName", conversation.getUser().getPrenom() + " " + conversation.getUser().getNom());
                conversationSummary.put("createdAt", conversation.getCreation().toEpochMilli());
                conversationSummary.put("status", conversation.getStatus().toString());
                
                // Ajouter les informations d'entreprise
                if (conversation.getEntreprise() != null) {
                    conversationSummary.put("entrepriseId", conversation.getEntreprise().getId());
                    conversationSummary.put("entrepriseNom", conversation.getEntreprise().getNom());
                }
                
                // Récupérer le dernier message
                Message lastMessage = messageRepository.findLastMessageInConversation(conversation.getId());
                if (lastMessage != null) {
                    conversationSummary.put("lastMessage", lastMessage.getContent());
                    conversationSummary.put("lastMessageTime", lastMessage.getCreation().toEpochMilli());
                    conversationSummary.put("lastMessageSender", 
                        lastMessage.getSender().getId().equals(conversation.getAgent().getId()) ? "AGENT" : "USER");
                }
                
                conversationList.add(conversationSummary);
            }
            
            response.put("status", "SUCCESS");
            response.put("conversations", conversationList);
            response.put("total", conversationList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des conversations actives: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Endpoint de santé pour vérifier que le système de chat fonctionne
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Système de chat opérationnel");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        response.put("activeConversations", String.valueOf(conversations.size()));
        
        return ResponseEntity.ok(response);
    }


    /**
     * Endpoint de test simple sans dépendances
     */
    @GetMapping("/simple-test")
    public ResponseEntity<Map<String, String>> simpleTest() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Test simple réussi");
        response.put("timestamp", java.time.Instant.now().toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint pour lister quelques utilisateurs disponibles (debug)
     */
    @GetMapping("/list-users")
    public ResponseEntity<Map<String, Object>> listUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var users = utilisateursRepository.findAll();
            response.put("status", "OK");
            response.put("totalUsers", users.size());
            
            if (!users.isEmpty()) {
                response.put("sampleUsers", users.stream()
                    .limit(5)
                    .map(u -> Map.of(
                        "id", u.getId(),
                        "email", u.getUtilisateur() != null ? u.getUtilisateur() : "N/A",
                        "hasPersonne", u.getPersonne() != null
                    ))
                    .toList());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Endpoint de test pour vérifier la base de données (sans authentification)
     */
    @GetMapping("/test-db")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Test simple : compter les conversations
            long conversationCount = conversationRepository.count();
            long messageCount = messageRepository.count();
            
            response.put("status", "OK");
            response.put("conversationCount", conversationCount);
            response.put("messageCount", messageCount);
            response.put("message", "Base de données accessible");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            response.put("message", "Erreur d'accès à la base de données");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Endpoint de test pour créer une conversation (sans authentification)
     */
    @PostMapping("/test-create")
    public ResponseEntity<Map<String, Object>> testCreateConversation(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String entrepriseId = request.get("entrepriseId");
            String userId = request.get("userId");
            
            // Vérifier que l'entreprise existe
            boolean entrepriseExists = entrepriseRepository.existsById(entrepriseId);
            boolean personExists = personsRepository.existsById(userId); // userId est maintenant un personId
            
            response.put("entrepriseExists", entrepriseExists);
            response.put("personExists", personExists);
            response.put("entrepriseId", entrepriseId);
            response.put("personId", userId);
            
            if (!entrepriseExists) {
                response.put("status", "ERROR");
                response.put("message", "Entreprise non trouvée: " + entrepriseId);
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!personExists) {
                response.put("status", "ERROR");
                response.put("message", "Personne non trouvée: " + userId);
                
                // Lister quelques personnes existantes pour debug
                var persons = personsRepository.findAll();
                if (!persons.isEmpty()) {
                    response.put("availablePersons", persons.stream()
                        .limit(3)
                        .map(p -> Map.of("id", p.getId(), "nom", p.getNom(), "prenom", p.getPrenom(), "email", p.getEmail()))
                        .toList());
                }
                
                return ResponseEntity.badRequest().body(response);
            }
            
            response.put("status", "OK");
            response.put("message", "Données valides pour créer une conversation");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère l'ID de la personne connectée depuis l'authentification
     */
    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        
        String email = authentication.getName();
        Utilisateurs user = utilisateursRepository.findByUtilisateur(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + email));
        
        // Retourner l'ID de la personne associée (les entités Conversation référencent Persons)
        if (user.getPersonne() != null) {
            return user.getPersonne().getId();
        } else {
            throw new RuntimeException("Aucune personne associée à l'utilisateur: " + email);
        }
    }

    // ==================== DEBUG ENDPOINTS ====================
    
    /**
     * Debug: Vérifie les conversations en base pour un utilisateur spécifique
     */
    @GetMapping("/debug/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> debugUserConversations(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 DEBUG - Vérification conversations pour userId: {}", userId);
            
            // Vérifier si l'utilisateur existe
            Optional<abdaty_technologie.API_Invest.Entity.Persons> userOpt = personsRepository.findById(userId);
            if (!userOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                return ResponseEntity.badRequest().body(response);
            }
            
            abdaty_technologie.API_Invest.Entity.Persons user = userOpt.get();
            logger.info("✅ Utilisateur trouvé: {} {}", user.getPrenom(), user.getNom());
            
            // Récupérer toutes les conversations où l'utilisateur est participant
            List<Conversation> conversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(userId, userId);
            logger.info("📊 {} conversations trouvées pour l'utilisateur", conversations.size());
            
            List<Map<String, Object>> conversationDetails = new ArrayList<>();
            
            for (Conversation conv : conversations) {
                Map<String, Object> details = new HashMap<>();
                details.put("id", conv.getId());
                details.put("subject", conv.getSubject());
                details.put("status", conv.getStatus().toString());
                details.put("agentId", conv.getAgent().getId());
                details.put("agentName", conv.getAgent().getPrenom() + " " + conv.getAgent().getNom());
                details.put("userId", conv.getUser().getId());
                details.put("userName", conv.getUser().getPrenom() + " " + conv.getUser().getNom());
                details.put("entrepriseId", conv.getEntreprise().getId());
                details.put("entrepriseNom", conv.getEntreprise().getNom());
                details.put("createdAt", conv.getCreation().toString());
                details.put("modifiedAt", conv.getModification().toString());
                
                // Compter les messages
                long messageCount = messageRepository.countByConversationId(conv.getId());
                details.put("messageCount", messageCount);
                
                conversationDetails.add(details);
            }
            
            response.put("status", "SUCCESS");
            response.put("userId", userId);
            response.put("userName", user.getPrenom() + " " + user.getNom());
            response.put("totalConversations", conversations.size());
            response.put("conversations", conversationDetails);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du debug: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== GESTION ENTREPRISE ====================

    /**
     * Récupère l'ID de l'entreprise réelle pour un utilisateur
     */
    private String getRealEntrepriseIdForUser(String userId) {
        try {
            logger.info("🔍 Recherche entreprise pour utilisateur: {}", userId);
            
            // Récupérer les entreprises où l'utilisateur est membre (fondateur, associé, gérant)
            List<abdaty_technologie.API_Invest.Entity.EntrepriseMembre> memberships = 
                entrepriseMembreRepository.findByPersonne_Id(userId);
            
            logger.info("📊 {} memberships trouvés pour utilisateur {}", memberships.size(), userId);
            
            if (!memberships.isEmpty()) {
                // Prendre la première entreprise trouvée (ou la plus récente)
                String entrepriseId = memberships.get(0).getEntreprise().getId();
                String entrepriseNom = memberships.get(0).getEntreprise().getNom();
                
                logger.info("✅ Entreprise trouvée: {} ({})", entrepriseNom, entrepriseId);
                return entrepriseId;
            } else {
                logger.warn("⚠️ Aucune entreprise trouvée pour utilisateur {}, utilisation de l'entreprise par défaut", userId);
                // Fallback vers l'entreprise par défaut
                return "69f667f7-b9a2-43cd-bf7c-8fb5c723ce33"; // Entreprise TMT par défaut
            }
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération de l'entreprise pour {}: {}", userId, e.getMessage());
            // En cas d'erreur, utiliser l'entreprise par défaut
            return "69f667f7-b9a2-43cd-bf7c-8fb5c723ce33";
        }
    }

    /**
     * Récupère les informations d'entreprise pour un utilisateur
     */
    private Map<String, Object> getEntrepriseInfoForUser(String userId) {
        Map<String, Object> entrepriseInfo = new HashMap<>();
        
        try {
            // Utiliser la nouvelle méthode pour récupérer l'entreprise réelle
            String realEntrepriseId = getRealEntrepriseIdForUser(userId);
            
            // Récupérer les détails de l'entreprise
            Optional<abdaty_technologie.API_Invest.Entity.Entreprise> entrepriseOpt = 
                entrepriseRepository.findById(realEntrepriseId);
            
            if (entrepriseOpt.isPresent()) {
                abdaty_technologie.API_Invest.Entity.Entreprise entreprise = entrepriseOpt.get();
                entrepriseInfo.put("entrepriseId", entreprise.getId());
                entrepriseInfo.put("entrepriseNom", entreprise.getNom());
                entrepriseInfo.put("creatorUserId", userId);
                entrepriseInfo.put("creatorUserName", "Propriétaire");
                
                logger.info("📊 Informations entreprise récupérées pour utilisateur {}: {}", 
                           userId, entreprise.getNom());
            } else {
                // Valeurs par défaut si entreprise non trouvée
                entrepriseInfo.put("entrepriseId", "default-entreprise-" + userId);
                entrepriseInfo.put("entrepriseNom", "Entreprise de " + userId);
                entrepriseInfo.put("creatorUserId", userId);
                entrepriseInfo.put("creatorUserName", "Propriétaire");
            }
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des infos entreprise pour {}: {}", 
                        userId, e.getMessage());
            
            // Valeurs par défaut en cas d'erreur
            entrepriseInfo.put("entrepriseId", "unknown-entreprise");
            entrepriseInfo.put("entrepriseNom", "Entreprise inconnue");
            entrepriseInfo.put("creatorUserId", userId);
            entrepriseInfo.put("creatorUserName", "Utilisateur");
        }
        
        return entrepriseInfo;
    }

    // ==================== LOGIQUE MÉTIER TEMPS RÉEL ====================

    /**
     * Notifie les agents d'un nouveau message utilisateur
     */
    private void notifyAgentsOfNewMessage(String conversationId, Map<String, Object> message) {
        try {
            Map<String, Object> conversation = conversations.get(conversationId);
            if (conversation != null) {
                // Marquer la conversation comme ayant une activité récente
                conversation.put("lastActivity", System.currentTimeMillis());
                conversation.put("hasUnreadMessages", true);
                conversation.put("status", "WAITING_AGENT_RESPONSE");
                
                logger.info("🔔 Notification: Nouveau message utilisateur dans conversation {}", conversationId);
                
                // Ici on pourrait ajouter :
                // - Notification push aux agents connectés
                // - Email si agent hors ligne
                // - Webhook vers système externe
            }
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la notification: {}", e.getMessage());
        }
    }

    /**
     * Marque une conversation comme lue par un agent
     */
    @PatchMapping("/conversations/{conversationId}/mark-read")
    public ResponseEntity<Map<String, Object>> markConversationAsReadByAgent(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String agentId = request.get("agentId");
            Map<String, Object> conversation = conversations.get(conversationId);
            
            if (conversation != null) {
                conversation.put("hasUnreadMessages", false);
                conversation.put("lastReadByAgent", System.currentTimeMillis());
                conversation.put("status", "ACTIVE");
                
                // Sauvegarder immédiatement
                saveImmediately();
                
                response.put("status", "SUCCESS");
                response.put("message", "Conversation marquée comme lue");
                
                logger.info("✅ Conversation {} marquée comme lue par agent {}", conversationId, agentId);
                
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Ferme une conversation
     */
    @PatchMapping("/conversations/{conversationId}/close")
    public ResponseEntity<Map<String, Object>> closeConversation(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String reason = request.get("reason");
            Map<String, Object> conversation = conversations.get(conversationId);
            
            if (conversation != null) {
                conversation.put("status", "CLOSED");
                conversation.put("closedAt", System.currentTimeMillis());
                conversation.put("closeReason", reason != null ? reason : "Fermée par l'agent");
                
                // Ajouter un message système
                List<Map<String, Object>> messages = conversationMessages.get(conversationId);
                if (messages != null) {
                    Map<String, Object> systemMessage = new HashMap<>();
                    systemMessage.put("id", "msg-" + System.currentTimeMillis());
                    systemMessage.put("conversationId", conversationId);
                    systemMessage.put("senderId", "SYSTEM");
                    systemMessage.put("senderType", "SYSTEM");
                    systemMessage.put("content", "Conversation fermée. " + (reason != null ? reason : ""));
                    systemMessage.put("timestamp", System.currentTimeMillis());
                    systemMessage.put("senderName", "Système");
                    messages.add(systemMessage);
                }
                
                // Sauvegarder immédiatement
                saveImmediately();
                
                response.put("status", "SUCCESS");
                response.put("message", "Conversation fermée");
                
                logger.info("🔒 Conversation {} fermée: {}", conversationId, reason);
                
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "ERROR");
                response.put("message", "Conversation non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Liste les utilisateurs disponibles pour contact par agent
     */
    @GetMapping("/users/available")
    public ResponseEntity<Map<String, Object>> getAvailableUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Pour l'instant, retourner une liste d'utilisateurs de test
            // En production, cela viendrait de la base de données
            List<Map<String, Object>> users = new ArrayList<>();
            
            // Utilisateurs de test
            Map<String, Object> user1 = new HashMap<>();
            user1.put("id", "test-user");
            user1.put("name", "Utilisateur Test");
            user1.put("email", "test@example.com");
            user1.put("status", "ONLINE");
            users.add(user1);
            
            Map<String, Object> user2 = new HashMap<>();
            user2.put("id", "52960519-6e6d-4e92-b9b0-1a275719db1b");
            user2.put("name", "Utilisateur Demo");
            user2.put("email", "demo@investmali.com");
            user2.put("status", "ONLINE");
            users.add(user2);
            
            // Ajouter les utilisateurs qui ont déjà des conversations
            for (Map<String, Object> conv : conversations.values()) {
                String userId = (String) conv.get("userId");
                String userName = (String) conv.get("userName");
                
                // Vérifier si l'utilisateur n'est pas déjà dans la liste
                boolean exists = users.stream()
                    .anyMatch(u -> userId.equals(u.get("id")));
                
                if (!exists && userId != null) {
                    Map<String, Object> existingUser = new HashMap<>();
                    existingUser.put("id", userId);
                    existingUser.put("name", userName != null ? userName : "Utilisateur");
                    existingUser.put("email", userId + "@investmali.com");
                    existingUser.put("status", "HAS_CONVERSATIONS");
                    users.add(existingUser);
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("users", users);
            response.put("total", users.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des utilisateurs: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== ADMINISTRATION ====================

    /**
     * Vide toutes les conversations (ADMIN SEULEMENT)
     */
    @DeleteMapping("/conversations/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllConversations(
            @RequestParam(required = false) String adminKey) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Vérification basique de sécurité (à améliorer en production)
            if (!"ADMIN_CLEAR_2024".equals(adminKey)) {
                response.put("status", "ERROR");
                response.put("message", "Accès non autorisé");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            int conversationCount = conversations.size();
            int messageGroupCount = conversationMessages.size();
            
            // Vider les maps en mémoire
            conversations.clear();
            conversationMessages.clear();
            
            // Supprimer les fichiers de persistance
            try {
                File dataDir = new File(dataDirectory);
                File conversationsFile = new File(dataDir, "conversations.json");
                File messagesFile = new File(dataDir, "messages.json");
                
                if (conversationsFile.exists()) {
                    conversationsFile.delete();
                }
                if (messagesFile.exists()) {
                    messagesFile.delete();
                }
            } catch (Exception e) {
                logger.warn("⚠️ Erreur lors de la suppression des fichiers: {}", e.getMessage());
            }
            
            response.put("status", "SUCCESS");
            response.put("message", "Toutes les conversations ont été supprimées");
            response.put("deletedConversations", conversationCount);
            response.put("deletedMessageGroups", messageGroupCount);
            
            logger.info("🧹 ADMIN: Toutes les conversations supprimées ({} conversations, {} groupes de messages)", 
                       conversationCount, messageGroupCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Statistiques du système de chat
     */
    @GetMapping("/conversations/stats")
    public ResponseEntity<Map<String, Object>> getChatStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            int totalConversations = conversations.size();
            int activeConversations = 0;
            int waitingConversations = 0;
            int closedConversations = 0;
            int totalMessages = 0;
            
            for (Map<String, Object> conv : conversations.values()) {
                String status = (String) conv.get("status");
                if ("ACTIVE".equals(status)) activeConversations++;
                else if ("WAITING_AGENT_RESPONSE".equals(status)) waitingConversations++;
                else if ("CLOSED".equals(status)) closedConversations++;
                
                List<Map<String, Object>> messages = conversationMessages.get(conv.get("id"));
                if (messages != null) {
                    totalMessages += messages.size();
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("totalConversations", totalConversations);
            response.put("activeConversations", activeConversations);
            response.put("waitingConversations", waitingConversations);
            response.put("closedConversations", closedConversations);
            response.put("totalMessages", totalMessages);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des statistiques: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== MÉTHODES DE PERSISTANCE JSON ====================

    /**
     * Initialise le système de persistance au démarrage
     */
    @PostConstruct
    public void initializePersistence() {
        try {
            // Créer le répertoire de données s'il n'existe pas
            File dataDir = new File(dataDirectory);
            if (!dataDir.exists()) {
                dataDir.mkdirs();
                logger.info("📁 Répertoire de données créé: {}", dataDirectory);
            }
            
            // Charger les conversations existantes
            loadConversationsFromFile();
            logger.info("🚀 Système de persistance initialisé");
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'initialisation de la persistance: {}", e.getMessage());
        }
    }

    /**
     * Charge les conversations depuis les fichiers JSON
     */
    private void loadConversationsFromFile() {
        try {
            File conversationsFile = new File(dataDirectory, "conversations.json");
            File messagesFile = new File(dataDirectory, "messages.json");
            
            // Charger les conversations
            if (conversationsFile.exists()) {
                TypeReference<Map<String, Map<String, Object>>> conversationsType = 
                    new TypeReference<Map<String, Map<String, Object>>>() {};
                Map<String, Map<String, Object>> loadedConversations = 
                    objectMapper.readValue(conversationsFile, conversationsType);
                conversations.putAll(loadedConversations);
                logger.info("📥 {} conversations chargées depuis le fichier", loadedConversations.size());
            }
            
            // Charger les messages
            if (messagesFile.exists()) {
                TypeReference<Map<String, List<Map<String, Object>>>> messagesType = 
                    new TypeReference<Map<String, List<Map<String, Object>>>>() {};
                Map<String, List<Map<String, Object>>> loadedMessages = 
                    objectMapper.readValue(messagesFile, messagesType);
                conversationMessages.putAll(loadedMessages);
                logger.info("📥 Messages chargés pour {} conversations", loadedMessages.size());
            }
            
        } catch (Exception e) {
            logger.warn("⚠️ Impossible de charger les données sauvegardées: {}", e.getMessage());
        }
    }

    /**
     * Sauvegarde automatique toutes les 30 secondes
     */
    @Scheduled(fixedRate = 30000) // 30 secondes = 30000 ms
    public void saveConversationsToFile() {
        if (!conversations.isEmpty() || !conversationMessages.isEmpty()) {
            try {
                File dataDir = new File(dataDirectory);
                if (!dataDir.exists()) {
                    dataDir.mkdirs();
                }
                
                // Sauvegarder les conversations
                File conversationsFile = new File(dataDirectory, "conversations.json");
                objectMapper.writeValue(conversationsFile, conversations);
                
                // Sauvegarder les messages
                File messagesFile = new File(dataDirectory, "messages.json");
                objectMapper.writeValue(messagesFile, conversationMessages);
                
                logger.info("💾 Sauvegarde automatique (30s): {} conversations, {} groupes de messages", 
                           conversations.size(), conversationMessages.size());
                
            } catch (IOException e) {
                logger.error("❌ Erreur lors de la sauvegarde automatique: {}", e.getMessage());
            }
        }
    }

    /**
     * Sauvegarde finale à l'arrêt du serveur
     */
    @PreDestroy
    public void saveOnShutdown() {
        try {
            saveConversationsToFile();
            logger.info("🔄 Sauvegarde finale effectuée avant arrêt du serveur");
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la sauvegarde finale: {}", e.getMessage());
        }
    }

    /**
     * Sauvegarde manuelle (peut être appelée après chaque création/modification)
     */
    private void saveImmediately() {
        try {
            File dataDir = new File(dataDirectory);
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }
            
            File conversationsFile = new File(dataDirectory, "conversations.json");
            File messagesFile = new File(dataDirectory, "messages.json");
            
            objectMapper.writeValue(conversationsFile, conversations);
            objectMapper.writeValue(messagesFile, conversationMessages);
            
        } catch (IOException e) {
            logger.error("❌ Erreur lors de la sauvegarde immédiate: {}", e.getMessage());
        }
    }
}
