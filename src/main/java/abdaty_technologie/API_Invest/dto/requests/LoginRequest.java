package abdaty_technologie.API_Invest.dto.requests;

import abdaty_technologie.API_Invest.constants.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class LoginRequest {
    
    @NotBlank(message = ValidationMessages.PERSON_EMAIL_REQUIRED)
    @Email(message = ValidationMessages.PERSON_EMAIL_INVALID)
    private String email;
    
    @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
    private String motdepasse;
}
