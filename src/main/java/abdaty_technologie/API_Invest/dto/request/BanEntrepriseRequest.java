package abdaty_technologie.API_Invest.dto.request;

import jakarta.validation.constraints.NotBlank;

public class BanEntrepriseRequest {
    @NotBlank
    public String motif;
}
