package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.repository.ConversationRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

/**
 * Contrôleur temporaire pour tester les conversations utilisateur
 */
@RestController
@RequestMapping("/api/v1/temp")
@CrossOrigin(origins = "*")
public class TempChatController {

    private static final Logger logger = LoggerFactory.getLogger(TempChatController.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private PersonsRepository personsRepository;

    /**
     * Test simple pour vérifier les conversations d'un utilisateur
     */
    @GetMapping("/user/{userId}/conversations")
    public ResponseEntity<Map<String, Object>> testUserConversations(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 TEST - Vérification conversations pour userId: {}", userId);
            
            // Vérifier si l'utilisateur existe
            boolean userExists = personsRepository.existsById(userId);
            response.put("userExists", userExists);
            
            if (!userExists) {
                response.put("status", "ERROR");
                response.put("message", "Utilisateur non trouvé: " + userId);
                return ResponseEntity.ok(response);
            }
            
            // Récupérer les conversations
            List<Conversation> conversations = conversationRepository.findByUserIdOrAgentIdOrderByModificationDesc(userId, userId);
            
            response.put("status", "SUCCESS");
            response.put("userId", userId);
            response.put("totalConversations", conversations.size());
            response.put("message", "Test réussi - " + conversations.size() + " conversations trouvées");
            
            // Ajouter les IDs des conversations pour debug
            response.put("conversationIds", conversations.stream()
                .map(Conversation::getId)
                .toList());
            
            logger.info("✅ TEST réussi - {} conversations trouvées pour {}", conversations.size(), userId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du test: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Test de santé simple
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Contrôleur temporaire fonctionnel");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}
