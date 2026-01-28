package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Paiement;
import java.util.List;
import java.util.Optional;

/**
 * Interface du service pour gérer les paiements
 */
public interface PaymentService {
    
    /**
     * Sauvegarde un paiement
     */
    Paiement save(Paiement paiement);
    
    /**
     * Trouve un paiement par son ID
     */
    Paiement findById(String id);
    
    /**
     * Trouve un paiement par sa référence de transaction
     */
    Paiement findByReferenceTransaction(String referenceTransaction);
    
    /**
     * Trouve tous les paiements d'une entreprise
     */
    List<Paiement> findByEntrepriseId(String entrepriseId);
    
    /**
     * Supprime un paiement
     */
    void delete(Paiement paiement);
    
    /**
     * Trouve tous les paiements
     */
    List<Paiement> findAll();
}
