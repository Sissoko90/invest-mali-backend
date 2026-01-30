<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur de chat final qui fonctionne - Compatible avec le frontend
 */
// @RestController
// @RequestMapping("/api/v1/chat")
// @CrossOrigin(origins = "*")
public class FinalWorkingChatController {

    /**
     * Test de fonctionnement
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Chat controller fonctionne parfaitement !");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Démarre une conversation depuis l'agent - ENDPOINT ATTENDU PAR LE FRONTEND
     * POST /api/v1/chat/conversations/start-agent
     */
    @PostMapping("/conversations/start-agent")
    public ResponseEntity<Map<String, Object>> startAgentConversation(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        String agentId = (String) request.get("agentId");
        String userId = (String) request.get("userId");
        String entrepriseId = (String) request.get("entrepriseId");
        String subject = (String) request.get("subject");
        
        // Génération d'un ID de conversation unique
        String conversationId = "conv-" + System.currentTimeMillis();
        
        response.put("status", "SUCCESS");
        response.put("message", "Conversation créée avec succès");
        response.put("conversationId", conversationId);
        response.put("subject", subject != null ? subject : "Nouvelle conversation");
        response.put("agentId", agentId);
        response.put("userId", userId);
        response.put("entrepriseId", entrepriseId);
        response.put("creation", System.currentTimeMillis());
        response.put("isExisting", false);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier si une conversation existe - ENDPOINT ATTENDU PAR LE FRONTEND
     * GET /api/v1/chat/conversations/check-existing/{entrepriseId}
     */
    @GetMapping("/conversations/check-existing/{entrepriseId}")
    public ResponseEntity<Map<String, Object>> checkExisting(@PathVariable String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("entrepriseId", entrepriseId);
        response.put("hasExistingConversation", false);
        response.put("message", "Aucune conversation existante trouvée");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur de chat final qui fonctionne - Compatible avec le frontend
 */
// @RestController
// @RequestMapping("/api/v1/chat")
// @CrossOrigin(origins = "*")
public class FinalWorkingChatController {

    /**
     * Test de fonctionnement
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Chat controller fonctionne parfaitement !");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Démarre une conversation depuis l'agent - ENDPOINT ATTENDU PAR LE FRONTEND
     * POST /api/v1/chat/conversations/start-agent
     */
    @PostMapping("/conversations/start-agent")
    public ResponseEntity<Map<String, Object>> startAgentConversation(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        String agentId = (String) request.get("agentId");
        String userId = (String) request.get("userId");
        String entrepriseId = (String) request.get("entrepriseId");
        String subject = (String) request.get("subject");
        
        // Génération d'un ID de conversation unique
        String conversationId = "conv-" + System.currentTimeMillis();
        
        response.put("status", "SUCCESS");
        response.put("message", "Conversation créée avec succès");
        response.put("conversationId", conversationId);
        response.put("subject", subject != null ? subject : "Nouvelle conversation");
        response.put("agentId", agentId);
        response.put("userId", userId);
        response.put("entrepriseId", entrepriseId);
        response.put("creation", System.currentTimeMillis());
        response.put("isExisting", false);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier si une conversation existe - ENDPOINT ATTENDU PAR LE FRONTEND
     * GET /api/v1/chat/conversations/check-existing/{entrepriseId}
     */
    @GetMapping("/conversations/check-existing/{entrepriseId}")
    public ResponseEntity<Map<String, Object>> checkExisting(@PathVariable String entrepriseId) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("entrepriseId", entrepriseId);
        response.put("hasExistingConversation", false);
        response.put("message", "Aucune conversation existante trouvée");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
