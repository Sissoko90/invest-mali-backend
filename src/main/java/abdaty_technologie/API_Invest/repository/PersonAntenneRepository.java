package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.PersonAntenne;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonAntenneRepository extends JpaRepository<PersonAntenne, Long> {
    
    @Query("SELECT pa FROM PersonAntenne pa WHERE pa.person = :person AND pa.actif = true")
    List<PersonAntenne> findByPersonAndActifTrue(@Param("person") Persons person);
    
    @Query("SELECT pa FROM PersonAntenne pa WHERE pa.person.id = :personId AND pa.actif = true")
    List<PersonAntenne> findByPersonIdAndActifTrue(@Param("personId") Long personId);
    
    @Query("SELECT pa FROM PersonAntenne pa WHERE pa.antenne = :antenne AND pa.actif = true")
    List<PersonAntenne> findByAntenneAndActifTrue(@Param("antenne") AntenneAgents antenne);
    
    @Query("SELECT COUNT(pa) > 0 FROM PersonAntenne pa WHERE pa.person = :person AND pa.antenne = :antenne AND pa.actif = true")
    boolean existsByPersonAndAntenneAndActifTrue(@Param("person") Persons person, @Param("antenne") AntenneAgents antenne);
}
