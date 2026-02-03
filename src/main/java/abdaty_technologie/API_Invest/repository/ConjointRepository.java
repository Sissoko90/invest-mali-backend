package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.Conjoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConjointRepository extends JpaRepository<Conjoint, String> {
    
    List<Conjoint> findByPersonId(String personId);
    
    void deleteByPersonId(String personId);
}
