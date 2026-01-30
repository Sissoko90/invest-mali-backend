package abdaty_technologie.API_Invest.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;

@Repository
public interface UtilisateursRepository extends JpaRepository<Utilisateurs, String> {
    
    // Recherche par nom d'utilisateur
    Optional<Utilisateurs> findByUtilisateur(String utilisateur);
    
    // Recherche par personne associée
    @Query("SELECT u FROM Utilisateurs u WHERE u.personne.id = :personneId")
    Optional<Utilisateurs> findByPersonneId(@Param("personneId") String personneId);
    
<<<<<<< HEAD
    // Recherche par email de la personne
    @Query("SELECT u FROM Utilisateurs u WHERE u.personne.email = :email")
    Optional<Utilisateurs> findByPersonneEmail(@Param("email") String email);
    
    // Recherche par téléphone de la personne
    @Query("SELECT u FROM Utilisateurs u WHERE u.personne.telephone1 = :telephone")
    Optional<Utilisateurs> findByPersonneTelephone(@Param("telephone") String telephone);
    
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
    /**
     * Trouve tous les utilisateurs qui ont un rôle différent de USER (donc les agents)
     * avec pagination
     */
    @Query("SELECT u FROM Utilisateurs u " +
           "JOIN u.personne p " +
           "WHERE p.role != :userRole " +
           "ORDER BY p.nom, p.prenom")
    Page<Utilisateurs> findAgentsOnly(@Param("userRole") Roles userRole, Pageable pageable);
    
    /**
     * Compte le nombre d'agents (utilisateurs avec rôle différent de USER)
     */
    @Query("SELECT COUNT(u) FROM Utilisateurs u " +
           "JOIN u.personne p " +
           "WHERE p.role != :userRole")
    long countAgentsOnly(@Param("userRole") Roles userRole);
    
    // Vérifier l'existence par nom d'utilisateur
    boolean existsByUtilisateur(String utilisateur);
    
    // Vérifier l'existence par personne
    @Query("SELECT COUNT(u) > 0 FROM Utilisateurs u WHERE u.personne.id = :personneId")
    boolean existsByPersonneId(@Param("personneId") String personneId);
}
