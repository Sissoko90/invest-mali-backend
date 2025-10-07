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

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

/**
 * Contrôleur pour le debug et les conversations utilisateur avec gestion d'erreur robuste
 */
@RestController
@RequestMapping("/api/v1/chat")
@CrossOrigin(origins = "*")
public class ChatDebugController {

    private static final Logger logger = LoggerFactory.getLogger(ChatDebugController.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private PersonsRepository personsRepository;

    /**
     * Debug: Vérifie les conversations en base pour un utilisateur spécifique
     */
    @GetMapping("/debug-safe/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> debugUserConversationsSafe(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 DEBUG - Vérification conversations pour userId: {}", userId);
            
            // Vérifier si l'utilisateur existe
            Optional<Persons> userOpt = personsRepository.findById(userId);
            if (!userOpt.isPresent()) {
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Persons user = userOpt.get();
            logger.info("✅ Utilisateur trouvé: {} {}", user.getPrenom(), user.getNom());
            
            // Récupérer toutes les conversations où l'utilisateur est participant
            List<Conversation> conversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(userId, userId);
            logger.info("📊 {} conversations trouvées pour l'utilisateur", conversations.size());
            
            List<Map<String, Object>> conversationDetails = new ArrayList<>();
            
            for (Conversation conv : conversations) {
                try {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", conv.getId());
                    details.put("subject", conv.getSubject());
                    details.put("status", conv.getStatus().toString());
                    
                    // Agent avec gestion null
                    if (conv.getAgent() != null) {
                        details.put("agentId", conv.getAgent().getId());
                        details.put("agentName", safeGetFullName(conv.getAgent()));
                    } else {
                        details.put("agentId", "null");
                        details.put("agentName", "Agent null");
                    }
                    
                    // User avec gestion null
                    if (conv.getUser() != null) {
                        details.put("userId", conv.getUser().getId());
                        details.put("userName", safeGetFullName(conv.getUser()));
                    } else {
                        details.put("userId", "null");
                        details.put("userName", "User null");
                    }
                    
                    // Entreprise avec gestion null
                    if (conv.getEntreprise() != null) {
                        details.put("entrepriseId", conv.getEntreprise().getId());
                        details.put("entrepriseNom", conv.getEntreprise().getNom());
                    } else {
                        details.put("entrepriseId", "null");
                        details.put("entrepriseNom", "Entreprise null");
                    }
                    
                    details.put("createdAt", conv.getCreation().toString());
                    details.put("modifiedAt", conv.getModification().toString());
                    
                    // Compter les messages
                    long messageCount = messageRepository.countByConversationId(conv.getId());
                    details.put("messageCount", messageCount);
                    
                    conversationDetails.add(details);
                } catch (Exception convEx) {
                    logger.error("❌ Erreur traitement conversation {}: {}", conv.getId(), convEx.getMessage());
                    Map<String, Object> errorDetails = new HashMap<>();
                    errorDetails.put("id", conv.getId());
                    errorDetails.put("error", "Erreur: " + convEx.getMessage());
                    conversationDetails.add(errorDetails);
                }
            }
            
            response.put("status", "SUCCESS");
            response.put("userId", userId);
            response.put("userName", safeGetFullName(user));
            response.put("totalConversations", conversations.size());
            response.put("conversations", conversationDetails);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du debug: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            response.put("stackTrace", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Récupère les conversations d'un utilisateur avec gestion d'erreur robuste
     */
    @Transactional(readOnly = true)
    @GetMapping("/safe/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversationsSafe(
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
