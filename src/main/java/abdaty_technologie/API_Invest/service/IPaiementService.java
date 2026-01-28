package abdaty_technologie.API_Invest.service;

import java.math.BigDecimal;
import java.util.List;

import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.dto.requests.PaiementRequest;
import abdaty_technologie.API_Invest.dto.responses.PaiementResponse;

/**
 * Interface pour les services de paiement
 */
public interface IPaiementService {
    
    /**
     * Crée un nouveau paiement
     */
    PaiementResponse creerPaiement(PaiementRequest request);
    
    /**
     * Récupère tous les paiements
     */
    List<PaiementResponse> obtenirTousPaiements();
    
    /**
     * Récupère un paiement par son ID
     */
    PaiementResponse obtenirPaiementParId(String id);
    
    /**
     * Récupère un paiement par sa référence de transaction
     */
    PaiementResponse obtenirPaiementParReference(String reference);
    
    /**
     * Récupère les paiements d'une personne
     */
    List<PaiementResponse> obtenirPaiementsParPersonne(String personneId);
    
    /**
     * Récupère les paiements d'une entreprise
     */
    List<PaiementResponse> obtenirPaiementsParEntreprise(String entrepriseId);
    
    /**
     * Récupère les paiements par statut
     */
    List<PaiementResponse> obtenirPaiementsParStatut(StatutPaiement statut);
    
    /**
     * Valide un paiement
     */
    PaiementResponse validerPaiement(String id);
    
    /**
     * Refuse un paiement
     */
    PaiementResponse refuserPaiement(String id);
    
    /**
     * Annule un paiement
     */
    PaiementResponse annulerPaiement(String id);
    
    /**
     * Calcule le total des paiements d'une personne
     */
    BigDecimal calculerTotalPaiementsPersonne(String personneId, StatutPaiement statut);
    
    /**
     * Calcule le total des paiements d'une entreprise
     */
    BigDecimal calculerTotalPaiementsEntreprise(String entrepriseId, StatutPaiement statut);
    
    /**
     * Supprime un paiement
     */
    void supprimerPaiement(String id);
    
    /**
     * Vérifie si un paiement existe par référence de transaction
     */
    boolean existsByReference(String reference);
    
    /**
     * Récupère tous les paiements par statut
     */
    List<PaiementResponse> getPaiementsByStatut(StatutPaiement statut);
}
