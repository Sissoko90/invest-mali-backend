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
    private String redirectUrl;
    
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
        this.redirectUrl = determineRedirectUrl(role);
        System.out.println("DEBUG - LoginResponse créée avec civilité: " + civilite);
    }
    
    public LoginResponse(String token, String utilisateur, String role, String nom, String prenom, String email, String personne_id, String civilite, String telephone1, String redirectUrl) {
        this.token = token;
        this.utilisateur = utilisateur;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.personne_id = personne_id;
        this.civilite = civilite;
        this.telephone1 = telephone1;
        this.redirectUrl = redirectUrl;
        System.out.println("DEBUG - LoginResponse créée avec civilité: " + civilite);
    }
    
    private String determineRedirectUrl(String role) {
        System.out.println(" [LoginResponse] Détermination redirectUrl pour role: " + role);
        
        if (role == null) {
            System.out.println(" [LoginResponse] Role null, redirection vers /");
            return "/";
        }
        
        String redirectUrl;
        switch (role) {
            case "SUPER_ADMIN":
                redirectUrl = "/dashboard";
                System.out.println("✅ [LoginResponse] Super Admin détecté, redirection vers /dashboard");
                break;
            case "ADMIN":
                redirectUrl = "/dashboard";
                System.out.println("✅ [LoginResponse] Admin détecté, redirection vers /dashboard");
                break;
            case "AGENT_ANTENNE":
            case "AGENT_REGIONAL":
            case "AGENT_NATIONAL":
            case "AGENT_REGISTER":
            case "AGENT_ACCEUIL":
            case "REGISSEUR":
            case "AGENT_REVISION":
            case "AGENT_IMPOT":
            case "AGENT_RCCM1":
            case "AGENT_RCCM2":
            case "AGENT_NINA":
            case "AGENT_RETRAIT":
                redirectUrl = "/dossier";
                System.out.println(" [LoginResponse] Agent détecté (" + role + "), redirection vers /dossier");
                break;
            default:
                redirectUrl = "/";
                System.out.println(" [LoginResponse] Role non reconnu (" + role + "), redirection par défaut vers /");
                break;
        }
        
        System.out.println(" [LoginResponse] RedirectUrl finale: " + redirectUrl);
        return redirectUrl;
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
        this.redirectUrl = determineRedirectUrl(role);
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
        this.redirectUrl = determineRedirectUrl(role);
    }
}
