package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.*;
import jakarta.validation.constraints.Email;
import java.time.LocalDate;

/**
 * Champs optionnels: si null, on ne modifie pas.
 */
public class PersonUpdateRequest {
    public String nom;
    public String prenom;
    @Email
    public String email;
    public String telephone1;
    public String telephone2;
    public LocalDate dateNaissance; // format: YYYY-MM-DD
    public String lieuNaissance;
    public Boolean estAutoriser; // si null, recalcul possible si dateNaissance changée
    public Nationalites nationnalite;
    public EntrepriseRole entrepriseRole;
    public AntenneAgents antenneAgent; // obligatoire si role != USER
    public Sexes sexe;
    public SituationMatrimoniales situationMatrimoniale;
    public Civilites civilite;
    public Roles role; // si null, on garde l'actuel
    public String divisionCode; // si null, inchangé; vide -> supprime
    public String division_id; // Division ID (UUID) optionnel
    public String localite; // Localité précise optionnelle
}
