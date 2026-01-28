package abdaty_technologie.API_Invest.dto.response;

import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;
import lombok.Data;

import java.time.Instant;

@Data
public class EntrepriseAgrementDto {
    private String id;
    private String nom;
    private String sigle;
    private String reference;
    private TypeEntreprise typeEntreprise;
    private EtapeValidation etapeValidation;
    private String observations;
    private Instant createdAt;
    private Instant updatedAt;
    
    // Constructeur pour mapper depuis Entreprise
    public EntrepriseAgrementDto(String id, String nom, String sigle, String reference, 
                                TypeEntreprise typeEntreprise, EtapeValidation etapeValidation, 
                                String observations, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.nom = nom;
        this.sigle = sigle;
        this.reference = reference;
        this.typeEntreprise = typeEntreprise;
        this.etapeValidation = etapeValidation;
        this.observations = observations;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
