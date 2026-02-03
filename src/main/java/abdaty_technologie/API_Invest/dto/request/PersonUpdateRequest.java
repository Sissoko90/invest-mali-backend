package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.*;
import java.time.LocalDate;

/**
 * Champs optionnels: si null, on ne modifie pas.
 */
public class PersonUpdateRequest {
    public String nom;
    public String prenom;
    // Email optionnel - accepte null, chaîne vide, ou email valide
    // Note: @Email ne valide pas les chaînes vides, donc on utilise un pattern personnalisé
    @jakarta.validation.constraints.Pattern(regexp = "^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "doit être une adresse électronique syntaxiquement correcte")
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
    public String localite; // Localité précise optionnelle (rue)
    public String porte; // Numéro de porte optionnel
    public String adresseLibre; // Adresse libre optionnelle
    // Liste des conjoints (pour les personnes mariées)
    public java.util.List<ConjointRequest> conjoints;
}
