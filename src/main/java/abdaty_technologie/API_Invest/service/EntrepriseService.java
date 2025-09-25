package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.dto.request.EntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.BanEntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.UpdateEntrepriseRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EntrepriseService {
    Entreprise createEntreprise(EntrepriseRequest request);
    Page<Entreprise> listEntreprises(Pageable pageable);
    Page<Entreprise> listEntreprises(String divisionCode, Pageable pageable);

    // Bannissement / débannissement
    Entreprise ban(String id, BanEntrepriseRequest request);
    Entreprise unban(String id);
    Page<Entreprise> listBanned(Pageable pageable);

    // Mise à jour d'une entreprise
    Entreprise updateEntreprise(String id, UpdateEntrepriseRequest request);

    // Assignation des demandes aux agents
    Entreprise assignToAgent(String entrepriseId, Utilisateurs agent);
    Entreprise unassignFromAgent(String entrepriseId);
    Page<Entreprise> getAssignedToAgent(String agentId, Pageable pageable);
    Page<Entreprise> getUnassignedForStep(EtapeValidation etape, Pageable pageable);
}
