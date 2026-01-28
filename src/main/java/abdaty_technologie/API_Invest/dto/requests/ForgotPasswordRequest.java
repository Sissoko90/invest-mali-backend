package abdaty_technologie.API_Invest.dto.requests;

import abdaty_technologie.API_Invest.constants.ValidationMessages;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = ValidationMessages.PERSON_EMAIL_REQUIRED)
    @Email(message = ValidationMessages.PERSON_EMAIL_INVALID)
    private String email;
}
