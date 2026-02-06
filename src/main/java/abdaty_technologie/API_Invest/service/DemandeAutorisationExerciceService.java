package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface DemandeAutorisationExerciceService {

    // ==================== CRÉATION ET GESTION DES DEMANDES ====================
    
    /**
     * Créer une nouvelle demande d'autorisation d'exercice
     */
    DemandeAutorisationExercice creerDemande(DemandeAutorisationExercice demande);
    
    /**
     * Mettre à jour une demande existante
     */
    DemandeAutorisationExercice mettreAJourDemande(Long demandeId, DemandeAutorisationExercice demande);
    
    /**
     * Supprimer une demande (soft delete en changeant le statut)
     */
    void supprimerDemande(Long demandeId, String motif);

    // ==================== RECHERCHE ET CONSULTATION ====================
    
    /**
     * Récupérer une demande par son ID
     */
    Optional<DemandeAutorisationExercice> getDemandeById(Long demandeId);
    
    /**
     * Récupérer une demande par son numéro
     */
    Optional<DemandeAutorisationExercice> getDemandeByNumero(String numeroDemande);
    
    /**
     * Récupérer toutes les demandes d'un demandeur
     */
    List<DemandeAutorisationExercice> getDemandesByDemandeur(String emailDemandeur);
    
    /**
     * Récupérer les demandes par type
     */
    List<DemandeAutorisationExercice> getDemandesByType(TypeDemandeAgrement typeDemande);
    
    /**
     * Récupérer les demandes par statut
     */
    List<DemandeAutorisationExercice> getDemandesByStatut(String statut);

    // ==================== WORKFLOW ET ASSIGNATION ====================
    
    /**
     * Assigner une demande à un agent
     */
    DemandeAutorisationExercice assignerDemande(Long demandeId, String agentId, String antenneTraitement);
    
    /**
     * Faire passer une demande à l'étape suivante
     */
    DemandeAutorisationExercice passerEtapeSuivante(Long demandeId, String agentId, String observations);
    
    /**
     * Rejeter une demande
     */
    DemandeAutorisationExercice rejeterDemande(Long demandeId, String agentId, String motifRejet);
    
    /**
     * Valider une demande
     */
    DemandeAutorisationExercice validerDemande(Long demandeId, String agentId, String observations);
    
    /**
     * Suspendre une demande
     */
    DemandeAutorisationExercice suspendreDemande(Long demandeId, String agentId, String motif);

    // ==================== GESTION DES PAIEMENTS ====================
    
    /**
     * Marquer le paiement comme effectué
     */
    DemandeAutorisationExercice marquerPaiementEffectue(Long demandeId, String referencePaiement);
    
    /**
     * Générer une demande de paiement
     */
    Map<String, Object> genererDemandePaiement(Long demandeId);
    
    /**
     * Vérifier le statut du paiement
     */
    Map<String, Object> verifierStatutPaiement(Long demandeId);

    // ==================== GESTION DES DOCUMENTS ====================
    
    /**
     * Ajouter un document à une demande
     */
    DemandeAutorisationExercice ajouterDocument(Long demandeId, String typeDocument, String cheminDocument);
    
    /**
     * Récupérer les documents d'une demande
     */
    List<Map<String, Object>> getDocumentsDemande(Long demandeId);
    
    /**
     * Vérifier si tous les documents requis sont fournis
     */
    boolean documentsComplets(Long demandeId);

    // ==================== STATISTIQUES ET RAPPORTS ====================
    
    /**
     * Obtenir les statistiques par type de demande
     */
    Map<String, Long> getStatistiquesParType();
    
    /**
     * Obtenir les statistiques par statut
     */
    Map<String, Long> getStatistiquesParStatut();
    
    /**
     * Obtenir les demandes en retard
     */
    List<DemandeAutorisationExercice> getDemandesEnRetard();
    
    /**
     * Obtenir le tableau de bord pour un agent
     */
    Map<String, Object> getTableauDeBordAgent(String agentId);

    // ==================== RECHERCHE AVANCÉE ====================
    
    /**
     * Recherche multicritères
     */
    List<DemandeAutorisationExercice> rechercherDemandes(Map<String, Object> criteres);
    
    /**
     * Recherche textuelle
     */
    List<DemandeAutorisationExercice> rechercheTextuelle(String searchTerm);

    // ==================== NOTIFICATIONS ====================
    
    /**
     * Envoyer une notification au demandeur
     */
    void envoyerNotificationDemandeur(Long demandeId, String message);
    
    /**
     * Envoyer une notification à l'agent
     */
    void envoyerNotificationAgent(Long demandeId, String agentId, String message);

    // ==================== WORKFLOW HELPERS ====================
    
    /**
     * Obtenir la prochaine étape selon le type de demande et l'étape actuelle
     */
    EtapeValidation getProchaineEtape(TypeDemandeAgrement typeDemande, EtapeValidation etapeActuelle);
    
    /**
     * Vérifier si une étape peut être franchie
     */
    boolean peutFranchirEtape(Long demandeId, EtapeValidation nouvelleEtape);
    
    /**
     * Obtenir l'historique des étapes d'une demande
     */
    List<Map<String, Object>> getHistoriqueEtapes(Long demandeId);
    
    /**
     * Calculer le délai de traitement estimé
     */
    int calculerDelaiTraitementEstime(TypeDemandeAgrement typeDemande);
}
