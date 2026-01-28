package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import abdaty_technologie.API_Invest.service.ConversationNotificationService;
import abdaty_technologie.API_Invest.service.ConversationNotificationService.ConversationNotification;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Contrôleur pour les notifications de conversation en temps réel
 */
@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class ConversationNotificationController {

    private static final Logger logger = LoggerFactory.getLogger(ConversationNotificationController.class);

    @Autowired
    private ConversationNotificationService notificationService;

    /**
     * Récupère les notifications en attente pour l'utilisateur connecté
     * GET /api/v1/notifications/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingNotifications(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.debug("🔍 Récupération notifications pour utilisateur: {}", userId);
            
            List<ConversationNotification> notifications = notificationService.getPendingNotifications(userId);
            
            response.put("status", "SUCCESS");
            response.put("notifications", notifications);
            response.put("count", notifications.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des notifications: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne du serveur");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Compte le nombre de notifications non lues
     * GET /api/v1/notifications/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.debug("📊 Comptage notifications non lues pour utilisateur: {}", userId);
            
            int count = notificationService.getUnreadNotificationCount(userId);
            
            response.put("status", "SUCCESS");
            response.put("unreadCount", count);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du comptage des notifications: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne du serveur");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Marque toutes les notifications comme lues
     * POST /api/v1/notifications/mark-read
     */
    @PostMapping("/mark-read")
    public ResponseEntity<Map<String, Object>> markNotificationsAsRead(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.debug("✅ Marquage notifications comme lues pour utilisateur: {}", userId);
            
            notificationService.markNotificationsAsRead(userId);
            
            response.put("status", "SUCCESS");
            response.put("message", "Notifications marquées comme lues");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du marquage des notifications: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne du serveur");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Endpoint de polling pour les notifications (alternative au WebSocket)
     * GET /api/v1/notifications/poll
     */
    @GetMapping("/poll")
    public ResponseEntity<Map<String, Object>> pollNotifications(
            @RequestParam(defaultValue = "0") long lastTimestamp,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = getCurrentUserId(authentication);
            logger.debug("🔄 Polling notifications pour utilisateur: {} depuis: {}", userId, lastTimestamp);
            
            List<ConversationNotification> notifications = notificationService.getPendingNotifications(userId);
            
            // Filtrer les notifications plus récentes que lastTimestamp
            List<ConversationNotification> newNotifications = notifications.stream()
                .filter(n -> n.getTimestamp() > lastTimestamp)
                .toList();
            
            response.put("status", "SUCCESS");
            response.put("notifications", newNotifications);
            response.put("count", newNotifications.size());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du polling des notifications: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("message", "Erreur interne du serveur");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Extrait l'ID de l'utilisateur actuel depuis l'authentification
     */
    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }
        return authentication.getName();
    }
}
