<<<<<<< HEAD
package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des paiements TresorPay
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    /**
     * Trouve un paiement par sa référence TresorPay
     */
    Optional<Payment> findByTresorPayReference(String tresorPayReference);
    
    /**
     * Trouve tous les paiements d'une entreprise
     */
    List<Payment> findByEntrepriseId(String entrepriseId);
    
    List<Payment> findByEntrepriseIdOrderByCreatedAtDesc(String entrepriseId);
    
    /**
     * Trouve les paiements par statut
     */
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
    
    /**
     * Trouve les paiements par méthode de paiement
     */
    List<Payment> findByPaymentMethodOrderByCreatedAtDesc(String paymentMethod);
    
    /**
     * Compte les paiements par statut pour une entreprise
     */
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.entrepriseId = :entrepriseId AND p.status = :status")
    long countByEntrepriseIdAndStatus(@Param("entrepriseId") String entrepriseId, @Param("status") String status);
}
=======
package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des paiements TresorPay
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    /**
     * Trouve un paiement par sa référence TresorPay
     */
    Optional<Payment> findByTresorPayReference(String tresorPayReference);
    
    /**
     * Trouve tous les paiements d'une entreprise
     */
    List<Payment> findByEntrepriseId(String entrepriseId);
    
    List<Payment> findByEntrepriseIdOrderByCreatedAtDesc(String entrepriseId);
    
    /**
     * Trouve les paiements par statut
     */
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
    
    /**
     * Trouve les paiements par méthode de paiement
     */
    List<Payment> findByPaymentMethodOrderByCreatedAtDesc(String paymentMethod);
    
    /**
     * Compte les paiements par statut pour une entreprise
     */
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.entrepriseId = :entrepriseId AND p.status = :status")
    long countByEntrepriseIdAndStatus(@Param("entrepriseId") String entrepriseId, @Param("status") String status);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
