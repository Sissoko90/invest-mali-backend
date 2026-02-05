package abdaty_technologie.API_Invest.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Persons;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.user-url:http://localhost:3002}")
    private String frontendUserUrl;

    @Value("${app.email.from:noreply@investmali.com}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    /**
     * Envoie une notification email à l'utilisateur quand il reçoit un message d'un agent
     */
    public void notifyUserNewMessage(Message message, Conversation conversation) {
        if (!emailEnabled) {
            logger.info("Notifications email désactivées");
            return;
        }

        try {
            // Récupérer les informations de l'utilisateur
            Persons user = conversation.getUser();
            if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                logger.warn("Impossible d'envoyer l'email : utilisateur ou email manquant pour la conversation {}", conversation.getId());
                return;
            }

            // Récupérer les informations de l'agent
            Persons agent = conversation.getAgent();
            String agentName = "Votre agent";
            if (agent != null) {
                agentName = (agent.getNom() != null ? agent.getNom() : "") + " " + (agent.getPrenom() != null ? agent.getPrenom() : "");
                agentName = agentName.trim();
                if (agentName.isEmpty()) {
                    agentName = "Votre agent";
                }
            }

            // Informations de l'entreprise
            String entrepriseName = "votre entreprise";
            if (conversation.getEntreprise() != null && conversation.getEntreprise().getNom() != null) {
                entrepriseName = conversation.getEntreprise().getNom();
            }

            // Construire l'URL d'accès direct
            String chatUrl = frontendUserUrl + "/chat?user=" + user.getId() + "&action=chat";

            // Préparer le contenu de l'email
            String userName = (user.getNom() != null ? user.getNom() : "") + " " + (user.getPrenom() != null ? user.getPrenom() : "");
            userName = userName.trim();
            if (userName.isEmpty()) {
                userName = "Cher utilisateur";
            }

            String messagePreview = message.getContent();
            if (messagePreview.length() > 100) {
                messagePreview = messagePreview.substring(0, 100) + "...";
            }

            // Envoyer l'email HTML
            sendHtmlEmail(
                user.getEmail(),
                "💬 Nouveau message de " + agentName,
                generateEmailHtml(userName, agentName, entrepriseName, messagePreview, chatUrl)
            );

            logger.info("Email de notification envoyé à {} pour le message {}", user.getEmail(), message.getId());

        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de notification pour le message {}: {}", message.getId(), e.getMessage(), e);
        }
    }

    /**
     * Envoie un email HTML
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            logger.info("Email HTML envoyé avec succès à {}", to);

        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email HTML à {}: {}", to, e.getMessage(), e);
            
            // Fallback : envoyer un email texte simple
            try {
                sendSimpleEmail(to, subject, "Vous avez reçu un nouveau message. Connectez-vous à votre espace pour le consulter.");
            } catch (Exception fallbackError) {
                logger.error("Erreur lors de l'envoi de l'email de fallback: {}", fallbackError.getMessage(), fallbackError);
            }
        }
    }

    /**
     * Envoie un email texte simple
     */
    private void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        
        mailSender.send(message);
        logger.info("Email simple envoyé avec succès à {}", to);
    }

    /**
     * Génère le contenu HTML de l'email
     */
    private String generateEmailHtml(String userName, String agentName, String entrepriseName, String messagePreview, String chatUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Nouveau message de votre agent</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; }
                    .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header p { margin: 10px 0 0 0; opacity: 0.9; }
                    .content { padding: 30px 20px; }
                    .message-preview { background: #F8FAFC; padding: 20px; border-left: 4px solid #3B82F6; margin: 20px 0; border-radius: 0 8px 8px 0; }
                    .message-preview h3 { margin-top: 0; color: #1E40AF; }
                    .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); }
                    .cta-button:hover { background: #2563EB; }
                    .features { background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .features ul { margin: 10px 0; padding-left: 20px; }
                    .features li { margin: 5px 0; }
                    .footer { background: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #E5E7EB; }
                    .url-box { background: #F3F4F6; padding: 15px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💬 Nouveau Message</h1>
                        <p>Vous avez reçu un message de votre agent</p>
                    </div>
                    
                    <div class="content">
                        <h2>Bonjour %s,</h2>
                        
                        <p>Votre agent <strong>%s</strong> vous a envoyé un nouveau message concernant votre entreprise <strong>%s</strong>.</p>
                        
                        <div class="message-preview">
                            <h3>📝 Aperçu du message :</h3>
                            <p style="font-style: italic; margin: 0;">"%s"</p>
                        </div>
                        
                        <p>Pour lire le message complet et répondre à votre agent, cliquez sur le bouton ci-dessous :</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" class="cta-button">📱 Ouvrir mes messages</a>
                        </div>
                        
                        <p>Vous pouvez également copier ce lien dans votre navigateur :</p>
                        <div class="url-box">%s</div>
                        
                        <div class="features">
                            <h3 style="margin-top: 0; color: #1E40AF;">🔔 Fonctionnalités disponibles :</h3>
                            <ul>
                                <li>✅ Voir tous vos messages</li>
                                <li>✅ Répondre directement à votre agent</li>
                                <li>✅ Suivre l'avancement de vos dossiers</li>
                                <li>✅ Historique complet des conversations</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #666; font-size: 14px;">
                            💡 <strong>Astuce :</strong> Ajoutez ce lien à vos favoris pour accéder rapidement à vos messages à tout moment.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p><strong>InvestMali</strong> - Plateforme d'investissement et de création d'entreprises</p>
                        <p>Cet email a été envoyé automatiquement. Si vous avez des questions, contactez notre support.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, agentName, entrepriseName, messagePreview, chatUrl, chatUrl);
    }

    /**
     * Teste l'envoi d'email (pour debug)
     */
    public void sendTestEmail(String toEmail) {
        try {
            sendHtmlEmail(
                toEmail,
                "🧪 Test - Notification InvestMali",
                generateEmailHtml(
                    "Utilisateur Test",
                    "Agent Test",
                    "Entreprise Test",
                    "Ceci est un message de test pour vérifier le système de notifications...",
                    frontendUserUrl + "/chat?user=test&action=chat"
                )
            );
            logger.info("Email de test envoyé à {}", toEmail);
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de test: {}", e.getMessage(), e);
        }
    }
}
