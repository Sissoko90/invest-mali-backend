package abdaty_technologie.API_Invest.dto.requests;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.Nationalites;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
public class CreateAgentRequest {
    
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;
    
    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;
    
    @Email(message = "L'email doit être valide")
    private String email;
    
    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "^\\+?[0-9\\s\\-\\(\\)]{8,20}$", message = "Le format du téléphone n'est pas valide")
    private String telephone1;
    
    private String telephone2;
    
    @NotNull(message = "Le rôle est obligatoire")
    private Roles role;
    
    @NotNull(message = "L'antenne est obligatoire")
    private AntenneAgents antenneAgent;
    
    private Date dateNaissance;
    
    private String lieuNaissance;
    
    private String localite;
    
    private Civilites civilite;
    
    private Sexes sexe;
    
    private Nationalites nationalite;
    
    private Boolean estAutoriser = true; // Par défaut activé
    
    // Mot de passe temporaire (optionnel, peut être généré automatiquement)
    private String motDePasseTemporaire;
}
