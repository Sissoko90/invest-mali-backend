<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement;

public interface AgrementService {
    
    /**
     * Initier une demande d'agrément pour une entreprise
     * @param entrepriseId ID de l'entreprise
     * @return L'entreprise mise à jour
     */
    Entreprise initierDemandeAgrement(String entrepriseId);
    
    /**
     * Valider l'étape actuelle et passer à la suivante
     * @param entrepriseId ID de l'entreprise
     * @param etapeActuelle Étape actuelle
     * @return L'entreprise mise à jour
     */
    Entreprise validerEtapeAgrement(String entrepriseId, EtapeValidation etapeActuelle);
    
    /**
     * Rejeter une demande à l'étape de révision
     * @param entrepriseId ID de l'entreprise
     * @param observations Observations sur le rejet
     * @return L'entreprise mise à jour
     */
    Entreprise rejeterDemandeAgrement(String entrepriseId, String observations);
    
    /**
     * Délivrer l'agrément avec le type sélectionné
     * @param entrepriseId ID de l'entreprise
     * @param typeAgrement Type d'agrément
     * @param observations Observations optionnelles
     * @return L'entreprise mise à jour
     */
    Entreprise delivrerAgrement(String entrepriseId, TypeAgrement typeAgrement, String observations);
    
    /**
     * Marquer l'agrément comme retiré
     * @param entrepriseId ID de l'entreprise
     * @return L'entreprise mise à jour
     */
    Entreprise marquerAgrementRetire(String entrepriseId);
    
    /**
     * Générer un numéro d'autorisation unique
     * @param typeAgrement Type d'agrément
     * @return Le numéro d'autorisation généré
     */
    String genererNumeroAutorisation(TypeAgrement typeAgrement);
    
    /**
     * Soumettre la demande d'agrément après upload de tous les documents
     * @param entrepriseId ID de l'entreprise
     * @return L'entreprise mise à jour
     */
    Entreprise soumettreDemandeAgrement(String entrepriseId);
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement;

public interface AgrementService {
    
    /**
     * Initier une demande d'agrément pour une entreprise
     * @param entrepriseId ID de l'entreprise
     * @return L'entreprise mise à jour
     */
    Entreprise initierDemandeAgrement(String entrepriseId);
    
    /**
     * Valider l'étape actuelle et passer à la suivante
     * @param entrepriseId ID de l'entreprise
     * @param etapeActuelle Étape actuelle
     * @return L'entreprise mise à jour
     */
    Entreprise validerEtapeAgrement(String entrepriseId, EtapeValidation etapeActuelle);
    
    /**
     * Rejeter une demande à l'étape de révision
     * @param entrepriseId ID de l'entreprise
     * @param observations Observations sur le rejet
     * @return L'entreprise mise à jour
     */
    Entreprise rejeterDemandeAgrement(String entrepriseId, String observations);
    
    /**
     * Délivrer l'agrément avec le type sélectionné
     * @param entrepriseId ID de l'entreprise
     * @param typeAgrement Type d'agrément
     * @param observations Observations optionnelles
     * @return L'entreprise mise à jour
     */
    Entreprise delivrerAgrement(String entrepriseId, TypeAgrement typeAgrement, String observations);
    
    /**
     * Marquer l'agrément comme retiré
     * @param entrepriseId ID de l'entreprise
     * @return L'entreprise mise à jour
     */
    Entreprise marquerAgrementRetire(String entrepriseId);
    
    /**
     * Générer un numéro d'autorisation unique
     * @param typeAgrement Type d'agrément
     * @return Le numéro d'autorisation généré
     */
    String genererNumeroAutorisation(TypeAgrement typeAgrement);
    
    /**
     * Soumettre la demande d'agrément après upload de tous les documents
     * @param entrepriseId ID de l'entreprise
     * @return L'entreprise mise à jour
     */
    Entreprise soumettreDemandeAgrement(String entrepriseId);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
