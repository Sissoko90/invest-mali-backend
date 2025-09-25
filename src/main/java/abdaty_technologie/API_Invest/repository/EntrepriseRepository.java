package abdaty_technologie.API_Invest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, String> {
    
    // Recherche par référence
    Optional<Entreprise> findByReference(String reference);
    
    // Recherche par nom
    Optional<Entreprise> findByNom(String nom);
    
    // Recherche par sigle
    Optional<Entreprise> findBySigle(String sigle);
    
    // Recherche par type d'entreprise
    List<Entreprise> findByTypeEntreprise(TypeEntreprise typeEntreprise);
    
    // Recherche par statut de création
    List<Entreprise> findByStatutCreation(StatutCreation statutCreation);
    
    // Recherche par division
    @Query("SELECT e FROM Entreprise e WHERE e.division.id = :divisionId")
    List<Entreprise> findByDivisionId(@Param("divisionId") String divisionId);
    
    // Vérifier l'existence par référence
    boolean existsByReference(String reference);
    
    // Vérifier l'existence par nom
    boolean existsByNom(String nom);
    
    // Vérifier l'existence par sigle
    boolean existsBySigle(String sigle);

    // Pagination par code de division
    Page<Entreprise> findByDivision_Code(String code, Pageable pageable);

    // Entreprises bannies (paginées)
    Page<Entreprise> findByBanniTrue(Pageable pageable);

    // Chargement avec fetch join des membres et des personnes pour le détail
    @Query("SELECT e FROM Entreprise e " +
           "LEFT JOIN FETCH e.membres em " +
           "LEFT JOIN FETCH em.personne " +
           "WHERE e.id = :id")
    Optional<Entreprise> findByIdWithMembres(@Param("id") String id);

    // Méthodes pour l'assignation des demandes
    Page<Entreprise> findByAssignedToId(String agentId, Pageable pageable);
    
    Page<Entreprise> findByEtapeValidationAndAssignedToIsNull(EtapeValidation etape, Pageable pageable);
    
    Page<Entreprise> findByEtapeValidationAndAssignedToIsNullAndStatutCreationIn(
        EtapeValidation etape, List<StatutCreation> statuts, Pageable pageable);
}
