package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import java.util.List;
import java.util.Map;

public interface AgrementWorkflowService {
    
    // Étape ACCUEIL - Assignment
    AgrementAssignment assignerDemandeAccueil(String entrepriseId, String agentId);
    List<Entreprise> getDemandesNonAssignees();
    List<AgrementAssignment> getMesAssignations(String agentId);
    
    // Étape ACCUEIL - Vérification documents
    AgrementAssignment verifierDocumentsAccueil(String entrepriseId, String agentId, boolean documentsOk, String observations);
    AgrementAssignment passerEnRevision(String entrepriseId, String agentId);
    
    // Étape REVISION - Visionner et valider
    Map<String, Object> getDocumentsEntreprise(String entrepriseId);
    AgrementAssignment validerRevision(String entrepriseId, String agentId, String observations);
    AgrementAssignment rejeterVersAccueil(String entrepriseId, String agentId, String motifRejet);
    AgrementAssignment passerAuRegisseur(String entrepriseId, String agentId);
    
    // Étape REGISSEUR - Génération paiement
    Map<String, Object> genererPaiementTransport(String entrepriseId, String agentId);
    Map<String, Object> regenererPaiementTransport(String entrepriseId, String agentId);
    AgrementAssignment verifierPaiement(String entrepriseId, String agentId);
    AgrementAssignment passerAuMinistere(String entrepriseId, String agentId, String ministereRole);
    
    // Étape MINISTERE - Validation finale
    List<String> getMinisteresDisponibles();
    AgrementAssignment validerMinistere(String entrepriseId, String agentId, String observations);
    AgrementAssignment passerAuRetrait(String entrepriseId, String agentId);
    AgrementAssignment rejeterMinistereVersAccueil(String entrepriseId, String agentId, String motifRejet);
    Map<String, Object> uploadAgrementSigne(String entrepriseId, String agentId, org.springframework.web.multipart.MultipartFile file);
    
    // Étape RETRAIT
    org.springframework.http.ResponseEntity<?> getAgrementFile(String entrepriseId);
    Map<String, Object> autoriserTelechargement(String entrepriseId, String agentId);
    Map<String, Object> marquerTelechargementEffectue(String entrepriseId);
    
    // Utilitaires
    AgrementAssignment getAssignationActuelle(String entrepriseId);
    List<AgrementAssignment> getHistoriqueAssignations(String entrepriseId);
    
    // ==================== NOUVEAUX WORKFLOWS D'AUTORISATION D'EXERCICE ====================
    
    // Création de demandes avec workflow spécifique
    AgrementAssignment creerDemandeAvecWorkflow(String entrepriseId, String agentId, TypeDemandeAgrement typedemande);
    
    // Passage à l'étape suivante dans un workflow
    AgrementAssignment passerEtapeSuivante(String entrepriseId, String agentId, EtapeValidation nouvelleEtape, String observations);
    
    // Rejet de demande avec retour à une étape spécifique
    AgrementAssignment rejeterDemande(String entrepriseId, String agentId, String motifRejet, String etapeRetour);
}
