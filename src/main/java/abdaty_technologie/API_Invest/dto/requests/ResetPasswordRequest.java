package abdaty_technologie.API_Invest.dto.requests;

import abdaty_technologie.API_Invest.constants.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = ValidationMessages.FIELD_REQUIRED)
    private String token;

    @NotBlank(message = ValidationMessages.USER_PASSWORD_REQUIRED)
    private String nouveauMotdepasse;
}
