package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.dto.chat.*;
import abdaty_technologie.API_Invest.service.ChatService;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.repository.ConversationRepository;
import abdaty_technologie.API_Invest.repository.MessageRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus;
import abdaty_technologie.API_Invest.Entity.Enum.MessageType;

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
 * Contrôleur REST pour la gestion du système de chat
 */
@RestController
@RequestMapping("/chat")
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
     * Démarre une conversation depuis une entreprise (version simplifiée)
     */
    @PostMapping("/conversations/start-from-entreprise/{entrepriseId}")
    public ResponseEntity<Map<String, Object>> startConversationFromEntreprise(
            @PathVariable String entrepriseId,
            @Valid @RequestBody StartConversationRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Vérifier que l'entreprise existe
            boolean entrepriseExists = entrepriseRepository.existsById(entrepriseId);
            if (!entrepriseExists) {
                response.put("status", "ERROR");
                response.put("message", "Entreprise non trouvée: " + entrepriseId);
                return ResponseEntity.badRequest().body(response);
            }
            
            // Créer une réponse simulée pour l'instant
            response.put("status", "SUCCESS");
            response.put("message", "Conversation créée avec succès (simulée)");
            response.put("entrepriseId", entrepriseId);
            response.put("userId", request.getUserId());
            response.put("subject", request.getSubject());
            response.put("conversationId", "simulated-" + System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
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
            
            // Pour l'instant, utiliser directement le système en mémoire pour éviter les contraintes de base
            // TODO: Implémenter la persistance en base quand les contraintes seront résolues
            return createInMemoryConversation(userId, message, subject, response);
            
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
            String entrepriseNom = request.get("entrepriseNom");
            
            if (agentId == null || userId == null || message == null) {
                response.put("status", "ERROR");
                response.put("message", "agentId, userId et message sont requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Pour l'instant, utiliser directement le système en mémoire
            return createAgentInitiatedConversation(agentId, userId, message, subject, entrepriseId, entrepriseNom, response);
            
        } catch (Exception e) {
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
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(
            @PathVariable String conversationId) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Vérifier si c'est une vraie conversation en base de données
        try {
            Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
            if (conversationOpt.isPresent()) {
                Conversation conversation = conversationOpt.get();
                
                // Récupérer les messages de la conversation
                List<Message> messages = messageRepository.findByConversationIdOrderByCreationAsc(conversationId);
                
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
            }
        } catch (Exception e) {
            // Si erreur de base de données, continuer avec les fallbacks
            System.err.println("Erreur lors de la récupération de la conversation: " + e.getMessage());
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
     * Marque une conversation comme lue (version simplifiée)
     */
    @PatchMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Map<String, Object>> markConversationAsRead(
            @PathVariable String conversationId) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Vérifier si c'est une vraie conversation persistante
        if (conversationId.startsWith("conv-")) {
            Map<String, Object> conversation = conversations.get(conversationId);
            if (conversation != null) {
                response.put("status", "SUCCESS");
                response.put("message", "Conversation marquée comme lue");
                response.put("conversationId", conversationId);
                
                return ResponseEntity.ok(response);
            }
        }
        
        // Si l'ID est undefined ou commence par "simulated-" ou "user-chat-", retourner une simulation
        if ("undefined".equals(conversationId) || conversationId.startsWith("simulated-") || conversationId.startsWith("user-chat-")) {
            response.put("status", "SIMULATED");
            response.put("message", "Conversation marquée comme lue (simulée)");
            response.put("conversationId", conversationId);
            
            return ResponseEntity.ok(response);
        }
        
        // Conversation non trouvée
        response.put("status", "ERROR");
        response.put("message", "Conversation non trouvée: " + conversationId);
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Récupère toutes les conversations d'un agent (version simplifiée)
     */
    @GetMapping("/conversations/agent")
    public ResponseEntity<Map<String, Object>> getAgentConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SIMULATED");
        response.put("message", "Liste des conversations agent (simulée)");
        response.put("conversations", java.util.Collections.emptyList());
        response.put("page", page);
        response.put("size", size);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Récupère toutes les conversations d'un utilisateur (version simplifiée)
     */
    @GetMapping("/conversations/user")
    public ResponseEntity<Map<String, Object>> getUserConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SIMULATED");
        response.put("message", "Liste des conversations utilisateur (simulée)");
        response.put("conversations", java.util.Collections.emptyList());
        response.put("page", page);
        response.put("size", size);
        
        return ResponseEntity.ok(response);
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
            if (content == null || content.trim().isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "Le contenu du message est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Vérifier si c'est une vraie conversation
            if (conversationId.startsWith("conv-")) {
                Map<String, Object> conversation = conversations.get(conversationId);
                if (conversation != null) {
                    List<Map<String, Object>> messages = conversationMessages.get(conversationId);
                    if (messages == null) {
                        messages = new ArrayList<>();
                        conversationMessages.put(conversationId, messages);
                    }
                    
                    // Déterminer qui envoie le message (utilisateur ou agent)
                    String senderId = request.get("senderId");
                    String senderType = "USER"; // Par défaut utilisateur
                    String senderName = "Utilisateur";
                    
                    // Si pas de senderId spécifié, utiliser l'utilisateur de la conversation
                    if (senderId == null) {
                        senderId = (String) conversation.get("userId");
                    } else if (senderId.equals(conversation.get("agentId"))) {
                        senderType = "AGENT";
                        senderName = (String) conversation.get("agentName");
                    }
                    
                    // Créer le nouveau message
                    Map<String, Object> newMessage = new HashMap<>();
                    newMessage.put("id", "msg-" + System.currentTimeMillis());
                    newMessage.put("conversationId", conversationId);
                    newMessage.put("senderId", senderId);
                    newMessage.put("senderType", senderType);
                    newMessage.put("content", content.trim());
                    newMessage.put("timestamp", System.currentTimeMillis());
                    newMessage.put("senderName", senderName);
                    
                    // Ajouter le message à la conversation
                    messages.add(newMessage);
                    
                    // Sauvegarder immédiatement
                    saveImmediately();
                    
                    // Notifier les agents si c'est un message utilisateur
                    if ("USER".equals(senderType)) {
                        notifyAgentsOfNewMessage(conversationId, newMessage);
                    }
                    
                    response.put("status", "SUCCESS");
                    response.put("message", "Message envoyé avec succès");
                    response.put("messageId", newMessage.get("id"));
                    response.put("conversationId", conversationId);
                    response.put("content", content);
                    response.put("timestamp", newMessage.get("timestamp"));
                    response.put("senderType", senderType);
                    
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                }
            }
            
            // Fallback pour les conversations simulées
            response.put("status", "SIMULATED");
            response.put("message", "Message envoyé (simulé)");
            response.put("conversationId", conversationId);
            response.put("content", content);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de l'envoi: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // L'endpoint markConversationAsRead est déjà défini plus haut

    /**
     * Liste les conversations d'un utilisateur spécifique
     */
    @GetMapping("/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversations(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> userConversations = new ArrayList<>();
            
            for (Map<String, Object> conversation : conversations.values()) {
                if (userId.equals(conversation.get("userId")) && "ACTIVE".equals(conversation.get("status"))) {
                    Map<String, Object> conversationSummary = new HashMap<>();
                    conversationSummary.put("id", conversation.get("id"));
                    conversationSummary.put("subject", conversation.get("subject"));
                    conversationSummary.put("agentName", conversation.get("agentName"));
                    conversationSummary.put("createdAt", conversation.get("createdAt"));
                    conversationSummary.put("status", conversation.get("status"));
                    
                    // Ajouter le dernier message si disponible
                    List<Map<String, Object>> messages = conversationMessages.get(conversation.get("id"));
                    if (messages != null && !messages.isEmpty()) {
                        Map<String, Object> lastMessage = messages.get(messages.size() - 1);
                        conversationSummary.put("lastMessage", lastMessage.get("content"));
                        conversationSummary.put("lastMessageTime", lastMessage.get("timestamp"));
                        conversationSummary.put("lastMessageSender", lastMessage.get("senderType"));
                    }
                    
                    userConversations.add(conversationSummary);
                }
            }
            
            // Trier par date de création (plus récent en premier)
            userConversations.sort((a, b) -> {
                Long timeA = (Long) a.get("createdAt");
                Long timeB = (Long) b.get("createdAt");
                return timeB.compareTo(timeA);
            });
            
            response.put("status", "SUCCESS");
            response.put("conversations", userConversations);
            response.put("total", userConversations.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Erreur lors de la récupération des conversations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Liste toutes les conversations actives (pour les agents)
     */
    @GetMapping("/conversations/active")
    public ResponseEntity<Map<String, Object>> getActiveConversations(
            @RequestParam(required = false) String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> activeConversations = new ArrayList<>();
            
            logger.info("🔍 Filtrage conversations avec entrepriseId: {}", entrepriseId);
            
            for (Map<String, Object> conversation : conversations.values()) {
                String status = (String) conversation.get("status");
                String conversationEntrepriseId = (String) conversation.get("entrepriseId");
                
                // Filtrer par entreprise si spécifié
                boolean matchesEntreprise = (entrepriseId == null || entrepriseId.equals(conversationEntrepriseId));
                
                logger.info("🔍 Conversation {} - entrepriseId: {} - match: {}", conversation.get("id"), conversationEntrepriseId, matchesEntreprise);
                
                if (("ACTIVE".equals(status) || "WAITING_AGENT_RESPONSE".equals(status)) && matchesEntreprise) {
                    Map<String, Object> conversationSummary = new HashMap<>();
                    conversationSummary.put("id", conversation.get("id"));
                    conversationSummary.put("subject", conversation.get("subject"));
                    conversationSummary.put("agentName", conversation.get("agentName"));
                    conversationSummary.put("userName", conversation.get("userName"));
                    conversationSummary.put("createdAt", conversation.get("createdAt"));
                    conversationSummary.put("status", status);
                    conversationSummary.put("hasUnreadMessages", conversation.get("hasUnreadMessages"));
                    conversationSummary.put("lastActivity", conversation.get("lastActivity"));
                    conversationSummary.put("agentId", conversation.get("agentId"));
                    
                    // Ajouter les informations d'entreprise
                    conversationSummary.put("entrepriseId", conversation.get("entrepriseId"));
                    conversationSummary.put("entrepriseNom", conversation.get("entrepriseNom"));
                    conversationSummary.put("creatorUserId", conversation.get("creatorUserId"));
                    conversationSummary.put("creatorUserName", conversation.get("creatorUserName"));
                    
                    // Ajouter le dernier message
                    List<Map<String, Object>> messages = conversationMessages.get(conversation.get("id"));
                    if (messages != null && !messages.isEmpty()) {
                        Map<String, Object> lastMessage = messages.get(messages.size() - 1);
                        conversationSummary.put("lastMessage", lastMessage.get("content"));
                        conversationSummary.put("lastMessageTime", lastMessage.get("timestamp"));
                        conversationSummary.put("lastMessageSender", lastMessage.get("senderType"));
                    }
                    
                    activeConversations.add(conversationSummary);
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("conversations", activeConversations);
            response.put("total", activeConversations.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
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

    // ==================== GESTION ENTREPRISE ====================

    /**
     * Récupère les informations d'entreprise pour un utilisateur
     */
    private Map<String, Object> getEntrepriseInfoForUser(String userId) {
        Map<String, Object> entrepriseInfo = new HashMap<>();
        
        try {
            // TODO: Implémenter la vraie logique de récupération depuis la base de données
            // Pour l'instant, retourner des valeurs par défaut
            entrepriseInfo.put("entrepriseId", "default-entreprise-" + userId);
            entrepriseInfo.put("entrepriseNom", "Entreprise de " + userId);
            entrepriseInfo.put("creatorUserId", userId);
            entrepriseInfo.put("creatorUserName", "Propriétaire");
            
            logger.info("📊 Informations entreprise récupérées pour utilisateur {}: {}", 
                       userId, entrepriseInfo.get("entrepriseNom"));
            
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
