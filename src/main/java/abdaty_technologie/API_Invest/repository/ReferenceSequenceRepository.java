package abdaty_technologie.API_Invest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.ReferenceSequence;

@Repository
public interface ReferenceSequenceRepository extends JpaRepository<ReferenceSequence, Integer> {
}
