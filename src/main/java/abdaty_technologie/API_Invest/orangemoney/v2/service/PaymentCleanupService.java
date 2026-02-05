package abdaty_technologie.API_Invest.orangemoney.v2.service;

import abdaty_technologie.API_Invest.Entity.Paiement;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service pour nettoyer les paiements en conflit ou orphelins
 */
@Service
public class PaymentCleanupService {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentCleanupService.class);
    
    @Autowired
    private PaymentService paymentService;
    
    /**
     * Nettoie les paiements en attente anciens (plus de 30 minutes)
     * Ces paiements sont probablement des orphelins dus à des erreurs
     */
    public int cleanupOldPendingPayments() {
        logger.info("🧹 [PaymentCleanup] Nettoyage des paiements en attente anciens");
        
        try {
            // Trouver les paiements en attente créés il y a plus de 30 minutes
            LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(30);
            
            // Note: Cette méthode devrait être implémentée dans PaymentService
            // List<Paiement> oldPendingPayments = paymentService.findOldPendingPayments(cutoffTime);
            
            // Pour l'instant, on log seulement
            logger.info("🧹 [PaymentCleanup] Recherche des paiements en attente depuis plus de 30 minutes");
            logger.info("🧹 [PaymentCleanup] Cutoff time: {}", cutoffTime);
            
            // TODO: Implémenter la logique de nettoyage quand PaymentService aura la méthode
            return 0;
            
        } catch (Exception e) {
            logger.error("❌ [PaymentCleanup] Erreur lors du nettoyage: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * Marque un paiement comme expiré
     */
    public void markPaymentAsExpired(String paymentId) {
        try {
            Paiement paiement = paymentService.findById(paymentId);
            if (paiement != null && paiement.getStatut() == StatutPaiement.EN_ATTENTE) {
                paiement.setStatut(StatutPaiement.REFUSE);
                paymentService.save(paiement);
                logger.info("⏰ [PaymentCleanup] Paiement marqué comme expiré: {}", paymentId);
            }
        } catch (Exception e) {
            logger.error("❌ [PaymentCleanup] Erreur lors du marquage d'expiration: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Vérifie s'il existe des paiements en conflit pour une entreprise
     */
    public boolean hasConflictingPayments(String entrepriseId) {
        try {
            // TODO: Implémenter la vérification des conflits
            logger.debug("🔍 [PaymentCleanup] Vérification des conflits pour l'entreprise: {}", entrepriseId);
            return false;
        } catch (Exception e) {
            logger.error("❌ [PaymentCleanup] Erreur lors de la vérification des conflits: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Résout les conflits de paiement pour une entreprise
     * Garde le plus récent et marque les autres comme annulés
     */
    public void resolvePaymentConflicts(String entrepriseId) {
        try {
            logger.info("🔧 [PaymentCleanup] Résolution des conflits pour l'entreprise: {}", entrepriseId);
            
            // TODO: Implémenter la résolution des conflits
            // 1. Trouver tous les paiements EN_ATTENTE pour cette entreprise
            // 2. Garder le plus récent
            // 3. Marquer les autres comme REFUSE
            
        } catch (Exception e) {
            logger.error("❌ [PaymentCleanup] Erreur lors de la résolution des conflits: {}", e.getMessage(), e);
        }
    }
}
