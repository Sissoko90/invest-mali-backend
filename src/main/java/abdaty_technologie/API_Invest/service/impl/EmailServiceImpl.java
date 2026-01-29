package abdaty_technologie.API_Invest.service.impl;

import java.util.Collection;
import java.util.Objects;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import abdaty_technologie.API_Invest.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendTo(String to, String subject, String text) {
        log.info("📧 [EmailService] Tentative d'envoi email - to: {} | subject: {} | mailEnabled: {}", to, subject, mailEnabled);
        
        if (!mailEnabled) {
            log.warn("❌ [EmailService] Mail désactivé (app.mail.enabled=false). Message ignoré pour {} | subject='{}'", to, subject);
            return;
        }

        if (to == null || to.isBlank()) {
            log.warn("❌ [EmailService] Email destinataire vide ou null: '{}'", to);
            return;
        }
        
        log.info("🔧 [EmailService] Configuration - from: {} | mailSender: {}", from, mailSender != null ? "OK" : "NULL");
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            if (from != null && !from.isBlank()) {
                helper.setFrom(from);
                log.debug("✅ [EmailService] From défini: {}", from);
            } else {
                log.warn(" [EmailService] Aucun 'from' défini dans la configuration");
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true); // true = HTML
            
            log.info(" [EmailService] Envoi en cours vers {} avec mailSender...", to);
            mailSender.send(mimeMessage);
            log.info(" [EmailService] Email envoyé avec succès à {}", to);
        } catch (MessagingException e) {
            log.error(" [EmailService] Erreur lors de l'envoi à {} : {}", to, e.getMessage(), e);
            log.error(" [EmailService] Détails de l'erreur: {}", e.getClass().getSimpleName());
            if (e.getCause() != null) {
                log.error(" [EmailService] Cause racine: {}", e.getCause().getMessage());
            }
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        } catch (Exception e) {
            log.error(" [EmailService] Erreur inattendue lors de l'envoi à {} : {}", to, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public void sendToMany(Collection<String> tos, String subject, String text) {
        if (tos == null || tos.isEmpty()) return;
        tos.stream().filter(Objects::nonNull).filter(s -> !s.isBlank()).distinct()
            .forEach(to -> sendTo(to, subject, text));
    }
}
