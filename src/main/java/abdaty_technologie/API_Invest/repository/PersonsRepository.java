package abdaty_technologie.API_Invest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;


@Repository
public interface PersonsRepository extends JpaRepository<Persons, String>, JpaSpecificationExecutor<Persons> {
    
    // Recherche par email
    Optional<Persons> findByEmail(String email);
    
    // Recherche par téléphone principal
    Optional<Persons> findByTelephone1(String telephone1);
    
    // Recherche par nom et prénom
    List<Persons> findByNomAndPrenom(String nom, String prenom);
    
    // Recherche par nom
    List<Persons> findByNomContainingIgnoreCase(String nom);
    
    // Recherche par rôle
    List<Persons> findByRole(Roles role);
    

    // (retiré) Recherche par type de personne: méthode supprimée, champ inexistant dans l'entité

    
    // Recherche par entreprise via la table de jointure EntrepriseMembre
    @Query("SELECT p FROM Persons p JOIN EntrepriseMembre em ON em.personne = p WHERE em.entreprise.id = :entrepriseId")
    List<Persons> findByEntrepriseId(@Param("entrepriseId") String entrepriseId);
    
    // Recherche par division
    @Query("SELECT p FROM Persons p WHERE p.division.id = :divisionId")
    List<Persons> findByDivisionId(@Param("divisionId") String divisionId);

    // Pagination par code de division
    //Page<Persons> findByDivision_Code(String code, Pageable pageable);
    
    // Recherche des personnes autorisées
    List<Persons> findByEstAutoriser(Boolean estAutoriser);
    
    // Vérifier l'existence par email
    boolean existsByEmail(String email);
    
    // Vérifier l'existence par téléphone
    boolean existsByTelephone1(String telephone1);
    
    boolean existsByTelephone2(String telephone2);
    
    // Méthodes pour la gestion des agents
    boolean existsByEmailAndIdNot(String email, String id);
    
    boolean existsByTelephone1AndIdNot(String telephone1, String id);
    
    long countByRole(Roles role);
    
    @Query("SELECT COUNT(p) FROM Persons p WHERE p.role LIKE :rolePrefix%")
    long countByRoleStartingWith(@Param("rolePrefix") String rolePrefix);
    
    @Query("SELECT COUNT(p) FROM Persons p WHERE p.role LIKE :rolePrefix% AND p.estAutoriser = :estAutoriser")
    long countByRoleStartingWithAndEstAutoriser(@Param("rolePrefix") String rolePrefix, @Param("estAutoriser") boolean estAutoriser);
    
    long countByAntenneAgent(AntenneAgents antenneAgent);
    
    // Méthodes avec pagination pour la gestion des agents
    Page<Persons> findByRole(Roles role, Pageable pageable);
    
    Page<Persons> findByAntenneAgent(AntenneAgents antenneAgent, Pageable pageable);
    
    Page<Persons> findByRoleAndAntenneAgent(Roles role, AntenneAgents antenneAgent, Pageable pageable);
}
