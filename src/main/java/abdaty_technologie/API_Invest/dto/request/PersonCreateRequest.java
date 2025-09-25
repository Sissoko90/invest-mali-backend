package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class PersonCreateRequest {
    @NotBlank
    public String nom;
    @NotBlank
    public String prenom;
    @Email
    public String email;
    @NotBlank
    public String telephone1;
    public String telephone2;
    @NotNull
    public LocalDate dateNaissance; // format: YYYY-MM-DD
    @NotBlank
    public String lieuNaissance;
    // Optionnel: calculé côté serveur à partir de l'âge
    public Boolean estAutoriser;
    @NotNull
    public Nationalites nationnalite;
    // Optionnel à la création; requis seulement si role == USER
    public EntrepriseRole entrepriseRole;
    // Optionnel si role == USER; requis si role != USER
    public AntenneAgents antenneAgent;
    @NotNull
    public Sexes sexe;
    @NotNull
    public SituationMatrimoniales situationMatrimoniale;
    @NotNull
    public Civilites civilite;
    // Optionnel: par défaut USER si null
    public Roles role;
    // Division code optionnel
    public String divisionCode;
    // Division ID (UUID) optionnel
    public String division_id;
    // Localité précise optionnelle
    public String localite;
}
