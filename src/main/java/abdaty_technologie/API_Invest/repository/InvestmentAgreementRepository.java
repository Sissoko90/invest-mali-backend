package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentAgreementRepository extends JpaRepository<InvestmentAgreement, String> {
    
    /**
     * Trouver toutes les demandes d'agrément d'un utilisateur, triées par date de création décroissante
     */
    List<InvestmentAgreement> findByUserIdOrderByDateCreationDesc(String userId);
    
    /**
     * Trouver les demandes d'agrément d'un utilisateur par statut
     */
    List<InvestmentAgreement> findByUserIdAndStatutOrderByDateCreationDesc(String userId, StatutCreation statut);
    
    /**
     * Trouver une demande d'agrément par numéro de référence
     */
    Optional<InvestmentAgreement> findByReferenceNumber(String referenceNumber);
    
    /**
     * Trouver toutes les demandes d'agrément par statut (pour les agents)
     */
    List<InvestmentAgreement> findByStatutOrderByDateCreationDesc(StatutCreation statut);
    
    /**
     * Trouver les demandes d'agrément par régime sollicité
     */
    List<InvestmentAgreement> findByRegimeSolliciteOrderByDateCreationDesc(String regimeSollicite);
    
    /**
     * Compter le nombre de demandes d'agrément par utilisateur
     */
    long countByUserId(String userId);
    
    /**
     * Compter le nombre de demandes d'agrément par statut
     */
    long countByStatut(StatutCreation statut);
}
