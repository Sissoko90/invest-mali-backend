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
 * Contrôleur pour les conversations - répond aux endpoints attendus par le frontend
 */
@RestController
@RequestMapping("")
@CrossOrigin(origins = "*")
public class ConversationController {

    private static final Logger logger = LoggerFactory.getLogger(ConversationController.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private PersonsRepository personsRepository;

    /**
     * Récupère les conversations d'un utilisateur - endpoint attendu par le frontend
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversations(
            @PathVariable String userId,
            @RequestParam(required = false) String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 [ConversationController] getUserConversations - userId: {}, entrepriseId: {}", userId, entrepriseId);
            
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
                logger.info("🔍 DEBUG [ConversationController] Conversation {}: ID={}, Agent={}, User={}, Entreprise={}", 
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
     * Récupère les conversations d'un utilisateur avec paramètre de requête
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/user")
    public ResponseEntity<Map<String, Object>> getUserConversationsQuery(
            @RequestParam String userId,
            @RequestParam(required = false) String entrepriseId) {
        
        logger.info("🔍 [ConversationController] getUserConversationsQuery - redirection vers getUserConversations");
        return getUserConversations(userId, entrepriseId);
    }

    /**
     * Récupère les conversations actives pour une entreprise (pour les agents)
     */
    @Transactional(readOnly = true)
    @GetMapping("/conversations/active")
    public ResponseEntity<Map<String, Object>> getActiveConversations(
            @RequestParam(required = false) String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 [ConversationController] getActiveConversations - entrepriseId: {}", entrepriseId);
            
            List<Conversation> activeConversations;
            
            if (entrepriseId != null && !entrepriseId.isEmpty()) {
                logger.info("🔍 Recherche conversations actives pour entreprise: {}", entrepriseId);
                // Récupérer les conversations actives pour une entreprise spécifique
                activeConversations = conversationRepository.findByEntrepriseIdOrderByCreationDesc(entrepriseId);
                logger.info("✅ {} conversations actives trouvées pour l'entreprise {}", activeConversations.size(), entrepriseId);
            } else {
                logger.info("🔍 Recherche toutes les conversations actives");
                // Récupérer toutes les conversations actives
                activeConversations = conversationRepository.findByStatusOrderByModificationDesc(
                    abdaty_technologie.API_Invest.Entity.Enum.ConversationStatus.ACTIVE, 
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
                logger.info("✅ {} conversations actives trouvées", activeConversations.size());
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
     * Test de santé pour ce contrôleur
     */
    @GetMapping("/conversations/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("controller", "ConversationController");
        response.put("message", "Contrôleur de conversations fonctionnel");
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
