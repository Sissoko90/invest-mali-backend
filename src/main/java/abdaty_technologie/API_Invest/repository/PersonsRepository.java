package abdaty_technologie.API_Invest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;


@Repository
public interface PersonsRepository extends JpaRepository<Persons, String> {
    
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
}
