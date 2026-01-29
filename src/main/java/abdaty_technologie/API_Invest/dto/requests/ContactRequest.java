package abdaty_technologie.API_Invest.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContactRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String name;

    @Email(message = "L'email n'est pas valide")
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    private String phone;

    @NotBlank(message = "Le sujet est obligatoire")
    private String subject;

    @NotBlank(message = "Le message est obligatoire")
    private String message;
}
