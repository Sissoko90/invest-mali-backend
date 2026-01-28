package abdaty_technologie.API_Invest.dto.response;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.Nationalites;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.time.Instant;

@Getter
@Setter
public class AgentResponse {
    
    private String id;
    
    private String nom;
    
    private String prenom;
    
    private String email;
    
    private String telephone1;
    
    private String telephone2;
    
    private Roles role;
    
    private AntenneAgents antenneAgent;
    
    private Date dateNaissance;
    
    private String lieuNaissance;
    
    private String localite;
    
    private Civilites civilite;
    
    private Sexes sexe;
    
    private Nationalites nationalite;
    
    private Boolean estAutoriser;
    
    private Instant creation;
    
    private Instant modification;
    
    // Statistiques supplémentaires (optionnelles)
    private Long nombreEntreprisesGerees;
    
    // Constructeur pour mapper facilement
    public AgentResponse() {}
    
    // Méthodes utilitaires pour obtenir les noms lisibles
    public String getAntenneNom() {
        return antenneAgent != null ? antenneAgent.getValue() : null;
    }
    
    public String getRoleNom() {
        return role != null ? role.getValue() : null;
    }
}
