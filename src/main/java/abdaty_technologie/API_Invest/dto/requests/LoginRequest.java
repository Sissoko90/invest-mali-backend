package abdaty_technologie.API_Invest.dto.requests;

import abdaty_technologie.API_Invest.constants.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    
    @NotBlank(message = "L'identifiant (email ou téléphone) est obligatoire")
    private String identifiant;
    
    @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
    private String motdepasse;
    
    // Méthode de compatibilité pour le code existant
    public String getEmail() {
        return identifiant;
    }
    
    public void setEmail(String email) {
        this.identifiant = email;
    }
}
