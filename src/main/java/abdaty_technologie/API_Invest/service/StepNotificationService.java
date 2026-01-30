<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;

/**
 * Service pour les notifications d'étapes de validation
 */
public interface StepNotificationService {
    
    /**
     * Envoie une notification lors du changement d'étape de validation
     */
    void notifyStepChange(Entreprise entreprise, EtapeValidation ancienneEtape, EtapeValidation nouvelleEtape, String agentNom);
    
    /**
     * Envoie une notification lors de l'assignation d'un agent
     */
    void notifyAgentAssignment(Entreprise entreprise, String agentNom, String agentEmail);
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;

/**
 * Service pour les notifications d'étapes de validation
 */
public interface StepNotificationService {
    
    /**
     * Envoie une notification lors du changement d'étape de validation
     */
    void notifyStepChange(Entreprise entreprise, EtapeValidation ancienneEtape, EtapeValidation nouvelleEtape, String agentNom);
    
    /**
     * Envoie une notification lors de l'assignation d'un agent
     */
    void notifyAgentAssignment(Entreprise entreprise, String agentNom, String agentEmail);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
