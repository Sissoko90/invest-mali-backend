package abdaty_technologie.API_Invest.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.service.StepNotificationService;
import abdaty_technologie.API_Invest.service.EmailService;

@Service
public class StepNotificationServiceImpl implements StepNotificationService {

    @Autowired
    private EmailService emailService;

    @Override
    public void notifyStepChange(Entreprise entreprise, EtapeValidation ancienneEtape, EtapeValidation nouvelleEtape, String agentNom) {
        System.out.println("🚀 [StepNotification] DÉBUT notifyStepChange");
        System.out.println("🚀 [StepNotification] Entreprise: " + (entreprise != null ? entreprise.getNom() : "null"));
        System.out.println("🚀 [StepNotification] Transition: " + ancienneEtape + " → " + nouvelleEtape);
        
        try {
            if (entreprise == null) {
                System.err.println("❌ [StepNotification] Entreprise est null");
                return;
            }
            
            if (entreprise.getMembres() == null) {
                System.err.println("❌ [StepNotification] Membres de l'entreprise sont null");
                return;
            }
            
            System.out.println("🔍 [StepNotification] Nombre de membres: " + entreprise.getMembres().size());
            
            // Récupérer les emails des fondateurs
            List<String> foundersEmails = entreprise.getMembres().stream()
                    .filter(membre -> {
                        boolean hasPersonne = membre.getPersonne() != null;
                        boolean hasEmail = hasPersonne && membre.getPersonne().getEmail() != null && !membre.getPersonne().getEmail().trim().isEmpty();
                        System.out.println("🔍 [StepNotification] Membre: " + (hasPersonne ? membre.getPersonne().getNom() : "null") + " - Email: " + (hasEmail ? membre.getPersonne().getEmail() : "null"));
                        return hasEmail;
                    })
                    .map(membre -> membre.getPersonne().getEmail())
                    .collect(Collectors.toList());

            System.out.println("📧 [StepNotification] Emails trouvés: " + foundersEmails);

            if (foundersEmails.isEmpty()) {
                System.out.println("⚠️ [StepNotification] Aucun email trouvé pour l'entreprise: " + entreprise.getNom());
                return;
            }

            String subject = getSubjectForStep(entreprise.getNom(), nouvelleEtape);
            String body = getBodyForStep(entreprise, ancienneEtape, nouvelleEtape, agentNom);

            System.out.println("📧 [StepNotification] Envoi notification transition: " + ancienneEtape + " → " + nouvelleEtape);
            System.out.println("📧 [StepNotification] Entreprise: " + entreprise.getNom() + " (" + entreprise.getReference() + ")");
            System.out.println("📧 [StepNotification] Destinataires: " + foundersEmails);
            System.out.println("📧 [StepNotification] Sujet: " + subject);

            if (emailService == null) {
                System.err.println("❌ [StepNotification] EmailService est null");
                return;
            }

            emailService.sendToMany(foundersEmails, subject, body);
            System.out.println("✅ [StepNotification] Email envoyé avec succès via EmailService");
            
        } catch (Exception e) {
            System.err.println("❌ [StepNotification] Erreur lors de l'envoi de notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void notifyAgentAssignment(Entreprise entreprise, String agentNom, String agentEmail) {
        System.out.println("🚀 [StepNotification] DÉBUT notifyAgentAssignment");
        System.out.println("🚀 [StepNotification] Entreprise: " + (entreprise != null ? entreprise.getNom() : "null"));
        System.out.println("🚀 [StepNotification] Agent: " + agentNom + " (" + agentEmail + ")");
        
        try {
            if (entreprise == null) {
                System.err.println("❌ [StepNotification] Entreprise est null");
                return;
            }
            
            if (entreprise.getMembres() == null) {
                System.err.println("❌ [StepNotification] Membres de l'entreprise sont null");
                return;
            }
            
            System.out.println("🔍 [StepNotification] Nombre de membres: " + entreprise.getMembres().size());
            
            List<String> foundersEmails = entreprise.getMembres().stream()
                    .filter(membre -> {
                        boolean hasPersonne = membre.getPersonne() != null;
                        boolean hasEmail = hasPersonne && membre.getPersonne().getEmail() != null && !membre.getPersonne().getEmail().trim().isEmpty();
                        System.out.println("🔍 [StepNotification] Membre: " + (hasPersonne ? membre.getPersonne().getNom() : "null") + " - Email: " + (hasEmail ? membre.getPersonne().getEmail() : "null"));
                        return hasEmail;
                    })
                    .map(membre -> membre.getPersonne().getEmail())
                    .collect(Collectors.toList());

            System.out.println("📧 [StepNotification] Emails trouvés: " + foundersEmails);

            if (foundersEmails.isEmpty()) {
                System.out.println("⚠️ [StepNotification] Aucun email trouvé pour l'entreprise: " + entreprise.getNom());
                return;
            }

            String subject = "[InvestMali] Agent assigné à votre dossier - " + entreprise.getNom();
            
            StringBuilder body = new StringBuilder();
            body.append("Bonjour,\n\n");
            body.append("Nous vous informons qu'un agent a été assigné au traitement de votre dossier :\n\n");
            body.append("📋 **Informations du dossier**\n");
            body.append("• Entreprise : ").append(entreprise.getNom()).append("\n");
            body.append("• Référence : ").append(entreprise.getReference()).append("\n");
            body.append("• Agent assigné : ").append(agentNom).append("\n");
            if (agentEmail != null && !agentEmail.isEmpty()) {
                body.append("• Contact agent : ").append(agentEmail).append("\n");
            }
            body.append("\n");
            body.append("Votre agent dédié prendra en charge le suivi personnalisé de votre dossier et vous contactera si des informations complémentaires sont nécessaires.\n\n");
            body.append("Notre équipe reste à votre disposition pour toute information complémentaire.\n\n");
            body.append("Cordialement,\n");
            body.append("L'équipe InvestMali");

            System.out.println("📧 [StepNotification] Sujet: " + subject);
            System.out.println("📧 [StepNotification] Destinataires: " + foundersEmails);

            if (emailService == null) {
                System.err.println("❌ [StepNotification] EmailService est null");
                return;
            }

            emailService.sendToMany(foundersEmails, subject, body.toString());
            System.out.println("✅ [StepNotification] Email d'assignation envoyé avec succès via EmailService");
            
        } catch (Exception e) {
            System.err.println("❌ [StepNotification] Erreur lors de l'envoi de notification d'assignation: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getSubjectForStep(String entrepriseNom, EtapeValidation etape) {
        String stepName = getStepDisplayName(etape);
        return "[InvestMali] Votre entreprise " + entrepriseNom + " - Étape " + stepName;
    }

    private String getBodyForStep(Entreprise entreprise, EtapeValidation ancienneEtape, EtapeValidation nouvelleEtape, String agentNom) {
        StringBuilder body = new StringBuilder();
        body.append("Bonjour,\n\n");
        body.append("Nous avons le plaisir de vous informer que votre entreprise '").append(entreprise.getNom()).append("' a évolué dans son processus de validation.\n\n");
        body.append("📋 **Informations du dossier**\n");
        body.append("• Entreprise : ").append(entreprise.getNom()).append("\n");
        body.append("• Référence : ").append(entreprise.getReference()).append("\n");
        body.append("• Ancienne étape : ").append(getStepDisplayName(ancienneEtape)).append("\n");
        body.append("• Nouvelle étape : ").append(getStepDisplayName(nouvelleEtape)).append("\n");
        if (agentNom != null && !agentNom.equals("Système")) {
            body.append("• Agent en charge : ").append(agentNom).append("\n");
        }
        body.append("\n");
        
        // Message spécifique à l'étape
        String stepMessage = getStepSpecificMessage(nouvelleEtape);
        if (stepMessage != null) {
            body.append(stepMessage).append("\n\n");
        }
        
        body.append("Notre équipe reste à votre disposition pour toute information complémentaire.\n\n");
        body.append("Cordialement,\n");
        body.append("L'équipe InvestMali");
        
        return body.toString();
    }

    private String getStepDisplayName(EtapeValidation etape) {
        if (etape == null) return "Inconnue";
        
        switch (etape) {
            case ACCUEIL: return "Accueil";
            case REGISSEUR: return "Régisseur";
            case REVISION: return "Révision";
            case IMPOTS: return "Impôts";
            case RCCM1: return "RCCM 1";
            case RCCM2: return "RCCM 2";
            case NINA: return "NINA";
            case RETRAIT: return "Retrait";
            case REGISSEUR_AGREMENT: return "Régisseur Agrément";
            case REVISION_AGREMENT: return "Révision Agrément";
            case MINISTERE_AGREMENT: return "Ministère Agrément";
            case RETRAIT_AGREMENT: return "Retrait Agrément";
            default: return etape.name();
        }
    }

    private String getStepSpecificMessage(EtapeValidation etape) {
        if (etape == null) return null;
        
        switch (etape) {
            case ACCUEIL:
                return "Votre dossier est en cours de traitement à l'accueil. Nos équipes vérifient la complétude de votre dossier.";
            case REGISSEUR:
                return "Votre dossier a été transmis au régisseur pour validation. Cette étape permet de vérifier la conformité juridique de votre entreprise.";
            case REVISION:
                return "Votre dossier est en cours de révision. Nos experts examinent tous les aspects de votre demande.";
            case IMPOTS:
                return "Votre dossier est en cours de traitement au niveau des impôts pour les formalités fiscales.";
            case RCCM1:
                return "Votre dossier est en cours de traitement au RCCM (Registre du Commerce et du Crédit Mobilier) - Première étape.";
            case RCCM2:
                return "Votre dossier est en cours de traitement au RCCM (Registre du Commerce et du Crédit Mobilier) - Deuxième étape.";
            case NINA:
                return "Votre dossier est en cours de traitement pour l'attribution du Numéro d'Identification National des Entreprises (NINA).";
            case RETRAIT:
                return "Félicitations ! Votre dossier est prêt pour le retrait. Vous pouvez venir récupérer vos documents.";
            case REGISSEUR_AGREMENT:
                return "Votre demande d'agrément est en cours de traitement au niveau du régisseur.";
            case REVISION_AGREMENT:
                return "Votre demande d'agrément est en cours de révision par nos experts.";
            case MINISTERE_AGREMENT:
                return "Votre demande d'agrément a été transmise au ministère compétent pour validation finale.";
            case RETRAIT_AGREMENT:
                return "Félicitations ! Votre agrément est prêt pour le retrait.";
            default:
                return "Votre dossier continue son traitement selon les procédures en vigueur.";
        }
    }
}
