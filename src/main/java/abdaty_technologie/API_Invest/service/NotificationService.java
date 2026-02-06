package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Conversation;
import abdaty_technologie.API_Invest.Entity.Message;
import abdaty_technologie.API_Invest.Entity.Persons;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * 🔔 SERVICE DE NOTIFICATIONS POUR LE CHAT BIDIRECTIONNEL
 * 
 * Gère les notifications push et email pour les nouveaux messages
 * entre agents et utilisateurs
 */
@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    // @Autowired(required = false)
    // private WebSocketNotificationService webSocketService;

    @Value("${app.notification.email.enabled:true}")
    private boolean emailNotificationsEnabled;

    @Value("${app.notification.push.enabled:false}")
    private boolean pushNotificationsEnabled;

    @Value("${app.notification.email.from:noreply@investmali.com}")
    private String fromEmail;

    @Value("${app.notification.email.subject.prefix:[InvestMali Chat]}")
    private String emailSubjectPrefix;

    /**
     * Notifier un nouveau message dans une conversation
     */
    public void notifyNewMessage(Message message, Conversation conversation) {
        try {
            Persons sender = message.getSender();
            Persons recipient = getRecipient(conversation, sender);

            if (recipient == null) {
                logger.warn("⚠️ Aucun destinataire trouvé pour la notification");
                return;
            }

            logger.info("🔔 Envoi notification nouveau message de {} vers {}", 
                sender.getEmail(), recipient.getEmail());

            // Notifications asynchrones pour ne pas bloquer l'envoi du message
            CompletableFuture.runAsync(() -> {
                try {
                    // Notification email
                    if (emailNotificationsEnabled && recipient.getEmail() != null) {
                        sendEmailNotification(message, conversation, sender, recipient);
                    }

                    // Notification push (à implémenter selon vos besoins)
                    if (pushNotificationsEnabled) {
                        sendPushNotification(message, conversation, sender, recipient);
                    }

                    // Notification WebSocket en temps réel (désactivé temporairement)
                    // if (webSocketService != null) {
                    //     webSocketService.notifyNewMessage(message, conversation);
                    // }

                } catch (Exception e) {
                    logger.error("❌ Erreur lors de l'envoi des notifications: {}", e.getMessage(), e);
                }
            });

        } catch (Exception e) {
            logger.error("❌ Erreur lors de la préparation des notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Déterminer le destinataire de la notification
     */
    private Persons getRecipient(Conversation conversation, Persons sender) {
        if (sender.getId().equals(conversation.getAgent().getId())) {
            // Le message vient de l'agent, notifier l'utilisateur
            return conversation.getUser();
        } else if (sender.getId().equals(conversation.getUser().getId())) {
            // Le message vient de l'utilisateur, notifier l'agent
            return conversation.getAgent();
        }
        return null;
    }

    /**
     * Envoyer une notification email
     */
    private void sendEmailNotification(Message message, Conversation conversation, Persons sender, Persons recipient) {
        try {
            if (mailSender == null) {
                logger.warn("⚠️ JavaMailSender non configuré, notification email ignorée");
                return;
            }

            String senderName = sender.getNom() + " " + sender.getPrenom();
            String recipientEmail = recipient.getEmail();
            String entrepriseName = conversation.getEntreprise().getNom();

            // Déterminer le type d'expéditeur
            String senderType = sender.getId().equals(conversation.getAgent().getId()) ? "Agent" : "Utilisateur";
            
            // Construire le sujet
            String subject = String.format("%s Nouveau message de %s - %s", 
                emailSubjectPrefix, senderType, entrepriseName);

            // Construire le contenu
            StringBuilder content = new StringBuilder();
            content.append("Bonjour ").append(recipient.getNom()).append(" ").append(recipient.getPrenom()).append(",\n\n");
            content.append("Vous avez reçu un nouveau message concernant l'entreprise \"").append(entrepriseName).append("\".\n\n");
            content.append("Expéditeur: ").append(senderName).append(" (").append(senderType).append(")\n");
            content.append("Sujet: ").append(conversation.getSubject()).append("\n\n");
            content.append("Message:\n");
            content.append("\"").append(message.getContent()).append("\"\n\n");
            content.append("Pour répondre, connectez-vous à votre espace InvestMali.\n\n");
            content.append("Cordialement,\n");
            content.append("L'équipe InvestMali");

            // Créer et envoyer l'email
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(content.toString());

            mailSender.send(mailMessage);

            logger.info("✅ Email de notification envoyé à {}", recipientEmail);

        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'envoi de l'email de notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Envoyer une notification push
     * À implémenter selon vos besoins (Firebase, WebSocket, etc.)
     */
    private void sendPushNotification(Message message, Conversation conversation, Persons sender, Persons recipient) {
        try {
            // TODO: Implémenter les notifications push
            // Exemples d'implémentation possibles :
            
            // 1. WebSocket pour notifications en temps réel
            // webSocketService.sendNotification(recipient.getId(), notificationData);
            
            // 2. Firebase Cloud Messaging pour mobile
            // fcmService.sendNotification(recipient.getFcmToken(), notificationData);
            
            // 3. Server-Sent Events (SSE)
            // sseService.sendEvent(recipient.getId(), "new-message", notificationData);

            logger.info("🔔 Notification push envoyée à {}", recipient.getEmail());

        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'envoi de la notification push: {}", e.getMessage(), e);
        }
    }

    /**
     * Notifier le démarrage d'une nouvelle conversation
     */
    public void notifyNewConversation(Conversation conversation, Persons initiator) {
        try {
            Persons recipient = getRecipient(conversation, initiator);
            
            if (recipient == null) {
                logger.warn("⚠️ Aucun destinataire trouvé pour la notification de nouvelle conversation");
                return;
            }

            logger.info("🔔 Notification nouvelle conversation de {} vers {}", 
                initiator.getEmail(), recipient.getEmail());

            // Notification asynchrone
            CompletableFuture.runAsync(() -> {
                try {
                    if (emailNotificationsEnabled && recipient.getEmail() != null) {
                        sendNewConversationEmail(conversation, initiator, recipient);
                    }

                    // Notification WebSocket en temps réel (désactivé temporairement)
                    // if (webSocketService != null) {
                    //     webSocketService.notifyNewConversation(conversation, initiator);
                    // }
                } catch (Exception e) {
                    logger.error("❌ Erreur lors de l'envoi de la notification de nouvelle conversation: {}", e.getMessage(), e);
                }
            });

        } catch (Exception e) {
            logger.error("❌ Erreur lors de la préparation de la notification de nouvelle conversation: {}", e.getMessage(), e);
        }
    }

    /**
     * Envoyer un email pour une nouvelle conversation
     */
    private void sendNewConversationEmail(Conversation conversation, Persons initiator, Persons recipient) {
        try {
            if (mailSender == null) {
                logger.warn("⚠️ JavaMailSender non configuré, notification email ignorée");
                return;
            }

            String initiatorName = initiator.getNom() + " " + initiator.getPrenom();
            String recipientEmail = recipient.getEmail();
            String entrepriseName = conversation.getEntreprise().getNom();

            // Déterminer le type d'initiateur
            String initiatorType = initiator.getId().equals(conversation.getAgent().getId()) ? "Agent" : "Utilisateur";
            
            // Construire le sujet
            String subject = String.format("%s Nouvelle conversation - %s", 
                emailSubjectPrefix, entrepriseName);

            // Construire le contenu
            StringBuilder content = new StringBuilder();
            content.append("Bonjour ").append(recipient.getNom()).append(" ").append(recipient.getPrenom()).append(",\n\n");
            content.append("Une nouvelle conversation a été initiée concernant l'entreprise \"").append(entrepriseName).append("\".\n\n");
            content.append("Initiée par: ").append(initiatorName).append(" (").append(initiatorType).append(")\n");
            content.append("Sujet: ").append(conversation.getSubject()).append("\n\n");
            content.append("Connectez-vous à votre espace InvestMali pour participer à cette conversation.\n\n");
            content.append("Cordialement,\n");
            content.append("L'équipe InvestMali");

            // Créer et envoyer l'email
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(content.toString());

            mailSender.send(mailMessage);

            logger.info("✅ Email de nouvelle conversation envoyé à {}", recipientEmail);

        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'envoi de l'email de nouvelle conversation: {}", e.getMessage(), e);
        }
    }
}
