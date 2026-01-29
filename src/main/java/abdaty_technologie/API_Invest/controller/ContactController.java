package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.requests.ContactRequest;
import abdaty_technologie.API_Invest.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/contact")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @Value("${app.contact.email:formalisation@apimali.gov.ml}")
    private String contactEmail;

    @PostMapping("/send")
    @Operation(summary = "Envoyer un message de contact", description = "Envoie un email de contact à l'équipe InvestMali")
    public ResponseEntity<?> sendContactMessage(@Valid @RequestBody ContactRequest request) {
        try {
            // Construire le contenu de l'email
            String emailContent = buildEmailContent(request);
            
            // Envoyer l'email à l'équipe
            emailService.sendTo(
                contactEmail,
                "Nouveau message de contact: " + request.getSubject(),
                emailContent
            );
            
            // Envoyer un email de confirmation à l'utilisateur uniquement si l'email est fourni
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                String confirmationContent = buildConfirmationEmail(request);
                emailService.sendTo(
                    request.getEmail(),
                    "Confirmation de réception - InvestMali",
                    confirmationContent
                );
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'envoi du message: " + e.getMessage()
            ));
        }
    }

    private String buildEmailContent(ContactRequest request) {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <h2 style="color: #2c5f2d; border-bottom: 2px solid #97bc62; padding-bottom: 10px;">
                        Nouveau message de contact
                    </h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p><strong>Nom:</strong> %s</p>
                        <p><strong>Email:</strong> %s</p>
                        <p><strong>Téléphone:</strong> %s</p>
                        <p><strong>Sujet:</strong> %s</p>
                        
                        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #2c5f2d;">
                            <p><strong>Message:</strong></p>
                            <p style="white-space: pre-wrap;">%s</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-radius: 8px;">
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            Ce message a été envoyé depuis le formulaire de contact du site InvestMali.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """,
            request.getName(),
            request.getEmail(),
            request.getPhone() != null ? request.getPhone() : "Non renseigné",
            request.getSubject(),
            request.getMessage()
        );
    }

    private String buildConfirmationEmail(ContactRequest request) {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <h2 style="color: #2c5f2d; border-bottom: 2px solid #97bc62; padding-bottom: 10px;">
                        Merci de nous avoir contactés !
                    </h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p>Bonjour <strong>%s</strong>,</p>
                        
                        <p>Nous avons bien reçu votre message concernant: <strong>%s</strong></p>
                        
                        <p>Notre équipe d'experts examine votre demande et vous répondra dans les plus brefs délais, généralement sous 24 à 48 heures ouvrées.</p>
                        
                        <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border-radius: 8px;">
                            <p style="margin: 0;"><strong>Votre message:</strong></p>
                            <p style="white-space: pre-wrap; margin-top: 10px;">%s</p>
                        </div>
                        
                        <p>En attendant, n'hésitez pas à consulter notre site pour plus d'informations sur nos services.</p>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="https://investmali.com" style="display: inline-block; padding: 12px 30px; background-color: #2c5f2d; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Visiter notre site
                            </a>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            <strong>InvestMali</strong><br>
                            Votre partenaire pour l'investissement au Mali<br>
                            Email: formalisation@apimali.gov.ml | Tél: +223 20 22 XX XX
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """,
            request.getName(),
            request.getSubject(),
            request.getMessage()
        );
    }
}
