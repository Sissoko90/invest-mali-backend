package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.service.EmailService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/email-test")
@CrossOrigin(origins = "*")
public class EmailTestController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestParam String to) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("🧪 [EmailTestController] Test d'envoi d'email vers: " + to);
            
            String subject = "[TEST] Email de test - InvestMali";
            String body = "Bonjour,\n\nCeci est un email de test pour vérifier la configuration SMTP.\n\nSi vous recevez ce message, la configuration email fonctionne correctement.\n\nCordialement,\nL'équipe InvestMali";
            
            emailService.sendTo(to, subject, body);
            
            response.put("success", true);
            response.put("message", "Email de test envoyé avec succès à: " + to);
            response.put("to", to);
            
            System.out.println("✅ [EmailTestController] Test terminé avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [EmailTestController] Erreur lors du test: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("message", "Erreur lors de l'envoi: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getEmailConfig() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Informations sur la configuration (sans révéler les mots de passe)
            response.put("emailServiceAvailable", emailService != null);
            response.put("message", "Vérifiez les logs pour plus de détails sur la configuration");
            
            System.out.println("📋 [EmailTestController] Vérification de la configuration email");
            System.out.println("  - EmailService injecté: " + (emailService != null ? "OUI" : "NON"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Erreur lors de la vérification: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/rate-limit-info")
    public ResponseEntity<Map<String, Object>> getRateLimitInfo() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("message", "Rate limiting augmenté pour le développement");
        response.put("capacity", "10000 requêtes");
        response.put("refill", "5000 tokens par minute");
        response.put("recommendation", "Redémarrez le serveur pour appliquer les nouveaux paramètres");
        
        System.out.println("🔄 [EmailTestController] Informations rate limiting");
        
        return ResponseEntity.ok(response);
    }
}
