package abdaty_technologie.API_Invest.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    
    private String token;
    private String type = "Bearer";
    private String utilisateur;
    private String role;
    private String nom;
    private String prenom;
    private String email;
    private String personne_id;
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String civilite;
    private String telephone1;
    
    public LoginResponse(String token, String utilisateur, String role, String nom, String prenom, String email, String personne_id, String civilite, String telephone1) {
        this.token = token;
        this.utilisateur = utilisateur;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.personne_id = personne_id;
        this.civilite = civilite;
        this.telephone1 = telephone1;
        System.out.println("DEBUG - LoginResponse créée avec civilité: " + civilite);
    }
    
    // Constructeur sans téléphone pour compatibilité
    public LoginResponse(String token, String utilisateur, String role, String nom, String prenom, String email, String personne_id, String civilite) {
        this.token = token;
        this.utilisateur = utilisateur;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.personne_id = personne_id;
        this.civilite = civilite;
        this.telephone1 = null;
        System.out.println("DEBUG - LoginResponse créée avec civilité: " + civilite);
    }
    
    // Constructeur sans personne_id pour compatibilité
    public LoginResponse(String token, String utilisateur, String role, String nom, String prenom, String email) {
        this.token = token;
        this.utilisateur = utilisateur;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.personne_id = null;
        this.civilite = null;
    }
}
