package abdaty_technologie.API_Invest.dto.response;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignationWithEntrepriseDto {
    private String id;
    private String entrepriseId;
    private String agentId;
    private String agentNom;
    private EtapeValidation etape;
    private LocalDateTime dateAssignment;
    private LocalDateTime dateTraitement;
    private String observations;
    private String statut;
    private Boolean documentsVerifies;
    private String ministereAssigne;
    
    // Informations de l'entreprise
    private EntrepriseInfo entreprise;
    
    @Data
    public static class EntrepriseInfo {
        private String id;
        private String nom;
        private String sigle;
        private String reference;
        private String typeEntreprise;
        private String etapeValidation;
    }
    
    // Constructeur pour mapper depuis AgrementAssignment et Entreprise
    public AssignationWithEntrepriseDto(AgrementAssignment assignment, Entreprise entreprise) {
        this.id = assignment.getId();
        this.entrepriseId = assignment.getEntrepriseId();
        this.agentId = assignment.getAgentId();
        this.agentNom = assignment.getAgentNom();
        this.etape = assignment.getEtape();
        this.dateAssignment = assignment.getDateAssignment();
        this.dateTraitement = assignment.getDateTraitement();
        this.observations = assignment.getObservations();
        this.statut = assignment.getStatut();
        this.documentsVerifies = assignment.getDocumentsVerifies();
        this.ministereAssigne = assignment.getMinistereAssigne();
        
        if (entreprise != null) {
            this.entreprise = new EntrepriseInfo();
            this.entreprise.setId(entreprise.getId());
            this.entreprise.setNom(entreprise.getNom());
            this.entreprise.setSigle(entreprise.getSigle());
            this.entreprise.setReference(entreprise.getReference());
            this.entreprise.setTypeEntreprise(entreprise.getTypeEntreprise() != null ? entreprise.getTypeEntreprise().toString() : null);
            this.entreprise.setEtapeValidation(entreprise.getEtapeValidation() != null ? entreprise.getEtapeValidation().toString() : null);
        }
    }
}
