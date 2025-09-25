package abdaty_technologie.API_Invest.dto.response;

import abdaty_technologie.API_Invest.Entity.Enum.*;
import java.util.Date;

public class PersonResponse {
    public String id;
    public String nom;
    public String prenom;
    public String email;
    public String telephone1;
    public String telephone2;
    public Date dateNaissance;
    public String lieuNaissance;
    public Boolean estAutoriser;
    public Nationalites nationnalite;
    public EntrepriseRole entrepriseRole;
    public AntenneAgents antenneAgent;
    public Sexes sexe;
    public SituationMatrimoniales situationMatrimoniale;
    public Civilites civilite;
    public Roles role;
    public String divisionCode;
    public String divisionNom;
    public String division_id;
    public String localite;
}
