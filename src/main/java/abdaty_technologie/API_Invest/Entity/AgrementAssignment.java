<<<<<<< HEAD
package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import java.time.LocalDateTime;

@Entity
@Table(name = "agrement_assignments")
public class AgrementAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "entreprise_id", nullable = false)
    private String entrepriseId;
    
    @Column(name = "agent_id", nullable = false)
    private String agentId;
    
    @Column(name = "agent_nom")
    private String agentNom;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "etape", nullable = false)
    private EtapeValidation etape;
    
    @Column(name = "date_assignment", nullable = false)
    private LocalDateTime dateAssignment;
    
    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    @Column(name = "statut")
    private String statut; // EN_COURS, VALIDE, REJETE, TRANSFERE
    
    @Column(name = "documents_verifies")
    private Boolean documentsVerifies;
    
    @Column(name = "ministere_assigne")
    private String ministereAssigne;
    
    // Constructors
    public AgrementAssignment() {}
    
    public AgrementAssignment(String entrepriseId, String agentId, String agentNom, EtapeValidation etape, 
                             LocalDateTime dateAssignment, LocalDateTime dateTraitement, String observations, 
                             String statut, Boolean documentsVerifies, String ministereAssigne) {
        this.entrepriseId = entrepriseId;
        this.agentId = agentId;
        this.agentNom = agentNom;
        this.etape = etape;
        this.dateAssignment = dateAssignment;
        this.dateTraitement = dateTraitement;
        this.observations = observations;
        this.statut = statut;
        this.documentsVerifies = documentsVerifies;
        this.ministereAssigne = ministereAssigne;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getEntrepriseId() { return entrepriseId; }
    public void setEntrepriseId(String entrepriseId) { this.entrepriseId = entrepriseId; }
    
    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }
    
    public String getAgentNom() { return agentNom; }
    public void setAgentNom(String agentNom) { this.agentNom = agentNom; }
    
    public EtapeValidation getEtape() { return etape; }
    public void setEtape(EtapeValidation etape) { this.etape = etape; }
    
    public LocalDateTime getDateAssignment() { return dateAssignment; }
    public void setDateAssignment(LocalDateTime dateAssignment) { this.dateAssignment = dateAssignment; }
    
    public LocalDateTime getDateTraitement() { return dateTraitement; }
    public void setDateTraitement(LocalDateTime dateTraitement) { this.dateTraitement = dateTraitement; }
    
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    
    public Boolean getDocumentsVerifies() { return documentsVerifies; }
    public void setDocumentsVerifies(Boolean documentsVerifies) { this.documentsVerifies = documentsVerifies; }
    
    public String getMinistereAssigne() { return ministereAssigne; }
    public void setMinistereAssigne(String ministereAssigne) { this.ministereAssigne = ministereAssigne; }
}
=======
package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import java.time.LocalDateTime;

@Entity
@Table(name = "agrement_assignments")
public class AgrementAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "entreprise_id", nullable = false)
    private String entrepriseId;
    
    @Column(name = "agent_id", nullable = false)
    private String agentId;
    
    @Column(name = "agent_nom")
    private String agentNom;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "etape", nullable = false)
    private EtapeValidation etape;
    
    @Column(name = "date_assignment", nullable = false)
    private LocalDateTime dateAssignment;
    
    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    @Column(name = "statut")
    private String statut; // EN_COURS, VALIDE, REJETE, TRANSFERE
    
    @Column(name = "documents_verifies")
    private Boolean documentsVerifies;
    
    @Column(name = "ministere_assigne")
    private String ministereAssigne;
    
    // Constructors
    public AgrementAssignment() {}
    
    public AgrementAssignment(String entrepriseId, String agentId, String agentNom, EtapeValidation etape, 
                             LocalDateTime dateAssignment, LocalDateTime dateTraitement, String observations, 
                             String statut, Boolean documentsVerifies, String ministereAssigne) {
        this.entrepriseId = entrepriseId;
        this.agentId = agentId;
        this.agentNom = agentNom;
        this.etape = etape;
        this.dateAssignment = dateAssignment;
        this.dateTraitement = dateTraitement;
        this.observations = observations;
        this.statut = statut;
        this.documentsVerifies = documentsVerifies;
        this.ministereAssigne = ministereAssigne;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getEntrepriseId() { return entrepriseId; }
    public void setEntrepriseId(String entrepriseId) { this.entrepriseId = entrepriseId; }
    
    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }
    
    public String getAgentNom() { return agentNom; }
    public void setAgentNom(String agentNom) { this.agentNom = agentNom; }
    
    public EtapeValidation getEtape() { return etape; }
    public void setEtape(EtapeValidation etape) { this.etape = etape; }
    
    public LocalDateTime getDateAssignment() { return dateAssignment; }
    public void setDateAssignment(LocalDateTime dateAssignment) { this.dateAssignment = dateAssignment; }
    
    public LocalDateTime getDateTraitement() { return dateTraitement; }
    public void setDateTraitement(LocalDateTime dateTraitement) { this.dateTraitement = dateTraitement; }
    
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    
    public Boolean getDocumentsVerifies() { return documentsVerifies; }
    public void setDocumentsVerifies(Boolean documentsVerifies) { this.documentsVerifies = documentsVerifies; }
    
    public String getMinistereAssigne() { return ministereAssigne; }
    public void setMinistereAssigne(String ministereAssigne) { this.ministereAssigne = ministereAssigne; }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
