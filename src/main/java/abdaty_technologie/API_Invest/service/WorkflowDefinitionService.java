<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Service pour définir et gérer les différents workflows d'autorisation d'exercice
 */
@Service
public class WorkflowDefinitionService {

    /**
     * Obtenir la séquence d'étapes pour un type de demande donné
     */
    public List<EtapeValidation> getWorkflowSteps(TypeDemandeAgrement typedemande) {
        switch (typedemande) {
            case AGREMENT:
                return getWorkflowAgrement();
            case DECISION:
                return getWorkflowDecision();
            case ENREGISTREMENT:
                return getWorkflowEnregistrement();
            default:
                // Workflow ancien pour compatibilité
                return getWorkflowAncien();
        }
    }

    /**
     * Workflow Agrément complet: 
     * Accueil(paiement) -> MIC -> MF -> SGG -> Présidence -> SGG -> MIC -> Accueil -> Usager
     */
    private List<EtapeValidation> getWorkflowAgrement() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT,
            EtapeValidation.MIC_PREMIERE_VALIDATION,
            EtapeValidation.MINISTERE_FINANCES,
            EtapeValidation.SGG_PREMIERE_VALIDATION,
            EtapeValidation.PRESIDENCE,
            EtapeValidation.SGG_SECONDE_VALIDATION,
            EtapeValidation.MIC_SECONDE_VALIDATION,
            EtapeValidation.ACCUEIL_RETOUR_AGREMENT
        );
    }

    /**
     * Workflow Décision: 
     * Accueil -> MIC -> SGG -> MIC -> Accueil -> Usager
     */
    private List<EtapeValidation> getWorkflowDecision() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_DECISION,
            EtapeValidation.MIC_DECISION,
            EtapeValidation.SGG_DECISION,
            EtapeValidation.MIC_RETOUR_DECISION,
            EtapeValidation.ACCUEIL_RETOUR_DECISION
        );
    }

    /**
     * Workflow Enregistrement: 
     * Accueil -> Usager (direct)
     */
    private List<EtapeValidation> getWorkflowEnregistrement() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_ENREGISTREMENT,
            EtapeValidation.ENREGISTREMENT_COMPLETE
        );
    }

    /**
     * Workflow ancien pour compatibilité
     */
    private List<EtapeValidation> getWorkflowAncien() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_AGREMENT,
            EtapeValidation.REVISION_AGREMENT,
            EtapeValidation.REGISSEUR_AGREMENT,
            EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT,
            EtapeValidation.MINISTERE_AGREMENT,
            EtapeValidation.RETRAIT_AGREMENT,
            EtapeValidation.AGREMENT_COMPLETE
        );
    }

    /**
     * Obtenir l'étape suivante dans le workflow
     */
    public EtapeValidation getNextStep(TypeDemandeAgrement typedemande, EtapeValidation currentStep) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        int currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex == -1 || currentIndex >= steps.size() - 1) {
            return null; // Pas d'étape suivante
        }
        
        return steps.get(currentIndex + 1);
    }

    /**
     * Obtenir l'étape précédente dans le workflow
     */
    public EtapeValidation getPreviousStep(TypeDemandeAgrement typedemande, EtapeValidation currentStep) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        int currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex <= 0) {
            return null; // Pas d'étape précédente
        }
        
        return steps.get(currentIndex - 1);
    }

    /**
     * Vérifier si une étape est la première du workflow
     */
    public boolean isFirstStep(TypeDemandeAgrement typedemande, EtapeValidation step) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return !steps.isEmpty() && steps.get(0).equals(step);
    }

    /**
     * Vérifier si une étape est la dernière du workflow
     */
    public boolean isLastStep(TypeDemandeAgrement typedemande, EtapeValidation step) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return !steps.isEmpty() && steps.get(steps.size() - 1).equals(step);
    }

    /**
     * Obtenir la première étape d'un workflow
     */
    public EtapeValidation getFirstStep(TypeDemandeAgrement typedemande) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return steps.isEmpty() ? null : steps.get(0);
    }

    /**
     * Obtenir la dernière étape d'un workflow
     */
    public EtapeValidation getLastStep(TypeDemandeAgrement typedemande) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return steps.isEmpty() ? null : steps.get(steps.size() - 1);
    }

    /**
     * Obtenir des informations détaillées sur un workflow
     */
    public Map<String, Object> getWorkflowInfo(TypeDemandeAgrement typedemande) {
        Map<String, Object> info = new HashMap<>();
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        
        info.put("type", typedemande.name());
        info.put("libelle", typedemande.getLibelle());
        info.put("montant", typedemande.getMontantFixe());
        info.put("workflowType", typedemande.getWorkflowType());
        info.put("totalSteps", steps.size());
        info.put("steps", steps);
        info.put("requiresPaiement", typedemande == TypeDemandeAgrement.AGREMENT);
        
        return info;
    }

    /**
     * Vérifier si une étape nécessite un paiement
     */
    public boolean requiresPayment(EtapeValidation step) {
        return step == EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT;
    }

    /**
     * Obtenir le rôle/département responsable d'une étape
     */
    public String getStepResponsible(EtapeValidation step) {
        switch (step) {
            case ACCUEIL_AGREMENT_PAIEMENT:
            case ACCUEIL_DECISION:
            case ACCUEIL_ENREGISTREMENT:
            case ACCUEIL_RETOUR_AGREMENT:
            case ACCUEIL_RETOUR_DECISION:
                return "ACCUEIL";
            
            case MIC_PREMIERE_VALIDATION:
            case MIC_DECISION:
            case MIC_SECONDE_VALIDATION:
            case MIC_RETOUR_DECISION:
                return "MIC";
            
            case MINISTERE_FINANCES:
                return "MINISTERE_FINANCES";
            
            case SGG_PREMIERE_VALIDATION:
            case SGG_DECISION:
            case SGG_SECONDE_VALIDATION:
                return "SGG";
            
            case PRESIDENCE:
                return "PRESIDENCE";
            
            case ENREGISTREMENT_COMPLETE:
                return "SYSTEM";
            
            default:
                return "UNKNOWN";
        }
    }
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Service pour définir et gérer les différents workflows d'autorisation d'exercice
 */
@Service
public class WorkflowDefinitionService {

    /**
     * Obtenir la séquence d'étapes pour un type de demande donné
     */
    public List<EtapeValidation> getWorkflowSteps(TypeDemandeAgrement typedemande) {
        switch (typedemande) {
            case AGREMENT:
                return getWorkflowAgrement();
            case DECISION:
                return getWorkflowDecision();
            case ENREGISTREMENT:
                return getWorkflowEnregistrement();
            default:
                // Workflow ancien pour compatibilité
                return getWorkflowAncien();
        }
    }

    /**
     * Workflow Agrément complet: 
     * Accueil(paiement) -> MIC -> MF -> SGG -> Présidence -> SGG -> MIC -> Accueil -> Usager
     */
    private List<EtapeValidation> getWorkflowAgrement() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT,
            EtapeValidation.MIC_PREMIERE_VALIDATION,
            EtapeValidation.MINISTERE_FINANCES,
            EtapeValidation.SGG_PREMIERE_VALIDATION,
            EtapeValidation.PRESIDENCE,
            EtapeValidation.SGG_SECONDE_VALIDATION,
            EtapeValidation.MIC_SECONDE_VALIDATION,
            EtapeValidation.ACCUEIL_RETOUR_AGREMENT
        );
    }

    /**
     * Workflow Décision: 
     * Accueil -> MIC -> SGG -> MIC -> Accueil -> Usager
     */
    private List<EtapeValidation> getWorkflowDecision() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_DECISION,
            EtapeValidation.MIC_DECISION,
            EtapeValidation.SGG_DECISION,
            EtapeValidation.MIC_RETOUR_DECISION,
            EtapeValidation.ACCUEIL_RETOUR_DECISION
        );
    }

    /**
     * Workflow Enregistrement: 
     * Accueil -> Usager (direct)
     */
    private List<EtapeValidation> getWorkflowEnregistrement() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_ENREGISTREMENT,
            EtapeValidation.ENREGISTREMENT_COMPLETE
        );
    }

    /**
     * Workflow ancien pour compatibilité
     */
    private List<EtapeValidation> getWorkflowAncien() {
        return Arrays.asList(
            EtapeValidation.ACCUEIL_AGREMENT,
            EtapeValidation.REVISION_AGREMENT,
            EtapeValidation.REGISSEUR_AGREMENT,
            EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT,
            EtapeValidation.MINISTERE_AGREMENT,
            EtapeValidation.RETRAIT_AGREMENT,
            EtapeValidation.AGREMENT_COMPLETE
        );
    }

    /**
     * Obtenir l'étape suivante dans le workflow
     */
    public EtapeValidation getNextStep(TypeDemandeAgrement typedemande, EtapeValidation currentStep) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        int currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex == -1 || currentIndex >= steps.size() - 1) {
            return null; // Pas d'étape suivante
        }
        
        return steps.get(currentIndex + 1);
    }

    /**
     * Obtenir l'étape précédente dans le workflow
     */
    public EtapeValidation getPreviousStep(TypeDemandeAgrement typedemande, EtapeValidation currentStep) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        int currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex <= 0) {
            return null; // Pas d'étape précédente
        }
        
        return steps.get(currentIndex - 1);
    }

    /**
     * Vérifier si une étape est la première du workflow
     */
    public boolean isFirstStep(TypeDemandeAgrement typedemande, EtapeValidation step) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return !steps.isEmpty() && steps.get(0).equals(step);
    }

    /**
     * Vérifier si une étape est la dernière du workflow
     */
    public boolean isLastStep(TypeDemandeAgrement typedemande, EtapeValidation step) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return !steps.isEmpty() && steps.get(steps.size() - 1).equals(step);
    }

    /**
     * Obtenir la première étape d'un workflow
     */
    public EtapeValidation getFirstStep(TypeDemandeAgrement typedemande) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return steps.isEmpty() ? null : steps.get(0);
    }

    /**
     * Obtenir la dernière étape d'un workflow
     */
    public EtapeValidation getLastStep(TypeDemandeAgrement typedemande) {
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        return steps.isEmpty() ? null : steps.get(steps.size() - 1);
    }

    /**
     * Obtenir des informations détaillées sur un workflow
     */
    public Map<String, Object> getWorkflowInfo(TypeDemandeAgrement typedemande) {
        Map<String, Object> info = new HashMap<>();
        List<EtapeValidation> steps = getWorkflowSteps(typedemande);
        
        info.put("type", typedemande.name());
        info.put("libelle", typedemande.getLibelle());
        info.put("montant", typedemande.getMontantFixe());
        info.put("workflowType", typedemande.getWorkflowType());
        info.put("totalSteps", steps.size());
        info.put("steps", steps);
        info.put("requiresPaiement", typedemande == TypeDemandeAgrement.AGREMENT);
        
        return info;
    }

    /**
     * Vérifier si une étape nécessite un paiement
     */
    public boolean requiresPayment(EtapeValidation step) {
        return step == EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT;
    }

    /**
     * Obtenir le rôle/département responsable d'une étape
     */
    public String getStepResponsible(EtapeValidation step) {
        switch (step) {
            case ACCUEIL_AGREMENT_PAIEMENT:
            case ACCUEIL_DECISION:
            case ACCUEIL_ENREGISTREMENT:
            case ACCUEIL_RETOUR_AGREMENT:
            case ACCUEIL_RETOUR_DECISION:
                return "ACCUEIL";
            
            case MIC_PREMIERE_VALIDATION:
            case MIC_DECISION:
            case MIC_SECONDE_VALIDATION:
            case MIC_RETOUR_DECISION:
                return "MIC";
            
            case MINISTERE_FINANCES:
                return "MINISTERE_FINANCES";
            
            case SGG_PREMIERE_VALIDATION:
            case SGG_DECISION:
            case SGG_SECONDE_VALIDATION:
                return "SGG";
            
            case PRESIDENCE:
                return "PRESIDENCE";
            
            case ENREGISTREMENT_COMPLETE:
                return "SYSTEM";
            
            default:
                return "UNKNOWN";
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
