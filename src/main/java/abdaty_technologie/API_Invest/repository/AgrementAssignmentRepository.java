package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgrementAssignmentRepository extends JpaRepository<AgrementAssignment, String> {
    
    Optional<AgrementAssignment> findByEntrepriseIdAndEtape(String entrepriseId, EtapeValidation etape);
    
    List<AgrementAssignment> findByEntrepriseIdOrderByDateAssignmentDesc(String entrepriseId);
    
    List<AgrementAssignment> findByAgentIdAndStatut(String agentId, String statut);
    
    List<AgrementAssignment> findByEtapeAndStatut(EtapeValidation etape, String statut);
    
    Optional<AgrementAssignment> findTopByEntrepriseIdOrderByDateAssignmentDesc(String entrepriseId);
}
