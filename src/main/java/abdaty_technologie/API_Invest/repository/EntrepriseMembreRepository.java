package abdaty_technologie.API_Invest.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;

@Repository
public interface EntrepriseMembreRepository extends JpaRepository<EntrepriseMembre, String> {
    List<EntrepriseMembre> findByEntreprise_Id(String entrepriseId);
    List<EntrepriseMembre> findByEntreprise_IdAndRole(String entrepriseId, EntrepriseRole role);
    List<EntrepriseMembre> findByEntreprise_IdAndRoleAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
            String entrepriseId, EntrepriseRole role, LocalDate from, LocalDate to);

    // Batch fetch for list endpoints to avoid N+1 and LazyInitializationException
    @Query("SELECT em FROM EntrepriseMembre em JOIN FETCH em.personne JOIN FETCH em.entreprise WHERE em.entreprise.id IN :ids")
    List<EntrepriseMembre> findByEntrepriseIdsWithPersonne(@Param("ids") List<String> entrepriseIds);

    // Single entreprise fetch join
    @Query("SELECT em FROM EntrepriseMembre em JOIN FETCH em.personne JOIN FETCH em.entreprise WHERE em.entreprise.id = :id")
    List<EntrepriseMembre> findByEntrepriseIdWithPersonne(@Param("id") String entrepriseId);

    // Find all memberships for a specific person with full entreprise data
    @Query("SELECT em FROM EntrepriseMembre em JOIN FETCH em.personne JOIN FETCH em.entreprise e LEFT JOIN FETCH e.division WHERE em.personne.id = :personId")
    List<EntrepriseMembre> findByPersonne_Id(@Param("personId") String personId);
}
