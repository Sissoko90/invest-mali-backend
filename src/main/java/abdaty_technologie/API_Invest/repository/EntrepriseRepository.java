package abdaty_technologie.API_Invest.repository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, String>, JpaSpecificationExecutor<Entreprise> {
    
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

    // Pagination par étape de validation
    Page<Entreprise> findByEtapeValidation(EtapeValidation etapeValidation, Pageable pageable);
    
    // Chargement avec fetch join des membres et assignedTo par étape de validation
    @Query("SELECT DISTINCT e FROM Entreprise e " +
           "LEFT JOIN FETCH e.membres em " +
           "LEFT JOIN FETCH em.personne " +
           "LEFT JOIN FETCH e.assignedTo at " +
           "LEFT JOIN FETCH at.personne " +
           "WHERE e.etapeValidation = :etape")
    List<Entreprise> findByEtapeValidationWithMembres(@Param("etape") EtapeValidation etape);

    // Pagination par code de division ET étape de validation
    Page<Entreprise> findByDivision_CodeAndEtapeValidation(String code, EtapeValidation etapeValidation, Pageable pageable);

    // Entreprises bannies (paginées)
    Page<Entreprise> findByBanniTrue(Pageable pageable);

    // Chargement avec fetch join des membres et des personnes pour le détail
    @Query("SELECT e FROM Entreprise e " +
           "LEFT JOIN FETCH e.membres em " +
           "LEFT JOIN FETCH em.personne " +
           "WHERE e.id = :id")
    Optional<Entreprise> findByIdWithMembres(@Param("id") String id);

    // Chargement avec fetch join des membres, personnes ET paiement pour l'API complète
    @Query("SELECT e FROM Entreprise e " +
           "LEFT JOIN FETCH e.membres em " +
           "LEFT JOIN FETCH em.personne " +
           "LEFT JOIN FETCH e.paiements " +
           "WHERE e.id = :id")
    Optional<Entreprise> findByIdWithMembresAndPaiement(@Param("id") String id);

    // Méthodes pour l'assignation des demandes
    Page<Entreprise> findByAssignedToId(String agentId, Pageable pageable);
    
    Page<Entreprise> findByEtapeValidationAndAssignedToIsNull(EtapeValidation etape, Pageable pageable);
    
    Page<Entreprise> findByEtapeValidationAndAssignedToIsNullAndStatutCreationIn(
        EtapeValidation etape, List<StatutCreation> statuts, Pageable pageable);
    
    // Recherche par personne associée ou utilisateur créateur
    @Query("SELECT e FROM Entreprise e WHERE (:personId IS NOT NULL AND e.createdBy.personne.id = :personId) " +
           "OR (:userId IS NOT NULL AND e.createdBy.id = :userId)")
    List<Entreprise> findByCreatedByPersonOrUser(@Param("personId") String personId,
                                                 @Param("userId") String userId);
    
    // Filtrage par antenne pour les agents
    Page<Entreprise> findByAntenneAgent(AntenneAgents antenneAgent, Pageable pageable);
    
    // Méthodes pour les statistiques de création
    long countByCreationBetween(Instant startDate, Instant endDate);
    
    // Trouver les entreprises d'un participant par son ID
    @Query("SELECT e FROM Entreprise e " +
           "JOIN e.membres em " +
           "WHERE em.personne.id = :personId")
    List<Entreprise> findByParticipantId(@Param("personId") String personId);
}
