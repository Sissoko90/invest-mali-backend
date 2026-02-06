package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Paiement;
import abdaty_technologie.API_Invest.repository.PaiementRepository;
import abdaty_technologie.API_Invest.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Implémentation du service pour gérer les paiements
 */
@Service
public class PaymentServiceImpl implements PaymentService {
    
    @Autowired
    private PaiementRepository paiementRepository;
    
    @Override
    public Paiement save(Paiement paiement) {
        return paiementRepository.save(paiement);
    }
    
    @Override
    public Paiement findById(String id) {
        Optional<Paiement> paiement = paiementRepository.findById(id);
        return paiement.orElse(null);
    }
    
    @Override
    public Paiement findByReferenceTransaction(String referenceTransaction) {
        Optional<Paiement> paiement = paiementRepository.findByReferenceTransaction(referenceTransaction);
        return paiement.orElse(null);
    }
    
    @Override
    public List<Paiement> findByEntrepriseId(String entrepriseId) {
        return paiementRepository.findByEntrepriseId(entrepriseId);
    }
    
    @Override
    public void delete(Paiement paiement) {
        paiementRepository.delete(paiement);
    }
    
    @Override
    public List<Paiement> findAll() {
        return paiementRepository.findAll();
    }
}
