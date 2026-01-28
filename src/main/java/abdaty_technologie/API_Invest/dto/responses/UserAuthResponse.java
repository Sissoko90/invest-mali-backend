package abdaty_technologie.API_Invest.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserAuthResponse {
    
    private String userId;
    private String utilisateur;
    private String role;
    private String nom;
    private String prenom;
    private String email;
    private Boolean estAutoriser;
    private String divisionNom;
    private String divisionType;
    
    public UserAuthResponse(String userId, String utilisateur, String role, String nom, 
                           String prenom, String email, Boolean estAutoriser) {
        this.userId = userId;
        this.utilisateur = utilisateur;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.estAutoriser = estAutoriser;
    }
}
