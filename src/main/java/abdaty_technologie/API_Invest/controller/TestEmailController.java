package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.service.EmailService;

@RestController
@RequestMapping("/test-email")
public class TestEmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<String> sendTestEmail(@RequestParam String to, 
                                               @RequestParam(defaultValue = "Test Email") String subject,
                                               @RequestParam(defaultValue = "Ceci est un test d'envoi d'email depuis InvestMali") String body) {
        try {
            System.out.println("🧪 [TEST EMAIL] Envoi test vers: " + to);
            System.out.println("🧪 [TEST EMAIL] Sujet: " + subject);
            
            emailService.sendTo(to, subject, body);
            
            System.out.println("✅ [TEST EMAIL] Envoi terminé sans exception");
            return ResponseEntity.ok("Email de test envoyé avec succès vers " + to);
        } catch (Exception e) {
            System.err.println("❌ [TEST EMAIL] Erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de l'envoi: " + e.getMessage());
        }
    }
}
