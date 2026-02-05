package abdaty_technologie.API_Invest.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Paiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, String> {
    
    // Recherche par référence de transaction
    Optional<Paiement> findByReferenceTransaction(String referenceTransaction);
    
    // Vérifier l'existence par référence de transaction
    boolean existsByReferenceTransaction(String referenceTransaction);
    
    // Recherche par type de paiement
    List<Paiement> findByTypePaiement(TypePaiement typePaiement);
    
    // Recherche par statut
    List<Paiement> findByStatut(StatutPaiement statut);
    
    // Recherche par statut avec chargement des relations
    @Query("SELECT DISTINCT p FROM Paiement p " +
           "LEFT JOIN FETCH p.entreprise e " +
           "LEFT JOIN FETCH e.membres " +
           "LEFT JOIN FETCH p.personne " +
           "WHERE p.statut = :statut")
    List<Paiement> findByStatutWithRelations(@Param("statut") StatutPaiement statut);
    
    // Recherche par entreprise
    @Query("SELECT p FROM Paiement p WHERE p.entreprise.id = :entrepriseId")
    List<Paiement> findByEntrepriseId(@Param("entrepriseId") String entrepriseId);
    
    // Recherche par personne
    @Query("SELECT p FROM Paiement p WHERE p.personne.id = :personneId")
    List<Paiement> findByPersonneId(@Param("personneId") String personneId);
    
    // Recherche par montant
    List<Paiement> findByMontant(BigDecimal montant);
    
    // Recherche par montant supérieur à
    List<Paiement> findByMontantGreaterThan(BigDecimal montant);
    
    // Recherche par montant inférieur à
    List<Paiement> findByMontantLessThan(BigDecimal montant);
    
    // Recherche par plage de montant
    List<Paiement> findByMontantBetween(BigDecimal montantMin, BigDecimal montantMax);
    
    // Recherche par statut et personne
    @Query("SELECT p FROM Paiement p WHERE p.personne.id = :personneId AND p.statut = :statut")
    List<Paiement> findByPersonneIdAndStatut(@Param("personneId") String personneId, @Param("statut") StatutPaiement statut);
    
    // Somme des paiements par entreprise et statut
    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.entreprise.id = :entrepriseId AND p.statut = :statut")
    BigDecimal sumMontantByEntrepriseIdAndStatut(@Param("entrepriseId") String entrepriseId, @Param("statut") StatutPaiement statut);
    
    // Somme des paiements par personne et statut
    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.personne.id = :personneId AND p.statut = :statut")
    BigDecimal sumMontantByPersonneIdAndStatut(@Param("personneId") String personneId, @Param("statut") StatutPaiement statut);
}
