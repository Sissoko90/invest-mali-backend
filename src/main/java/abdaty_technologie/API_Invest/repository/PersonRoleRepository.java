package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.PersonRole;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonRoleRepository extends JpaRepository<PersonRole, Long> {
    
    @Query("SELECT pr FROM PersonRole pr WHERE pr.person = :person AND pr.actif = true")
    List<PersonRole> findByPersonAndActifTrue(@Param("person") Persons person);
    
    @Query("SELECT pr FROM PersonRole pr WHERE pr.person.id = :personId AND pr.actif = true")
    List<PersonRole> findByPersonIdAndActifTrue(@Param("personId") Long personId);
    
    @Query("SELECT pr FROM PersonRole pr WHERE pr.role = :role AND pr.actif = true")
    List<PersonRole> findByRoleAndActifTrue(@Param("role") Roles role);
    
    @Query("SELECT COUNT(pr) > 0 FROM PersonRole pr WHERE pr.person = :person AND pr.role = :role AND pr.actif = true")
    boolean existsByPersonAndRoleAndActifTrue(@Param("person") Persons person, @Param("role") Roles role);
}
