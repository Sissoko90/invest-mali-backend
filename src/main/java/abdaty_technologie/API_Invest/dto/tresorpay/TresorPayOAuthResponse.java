package abdaty_technologie.API_Invest.dto.tresorpay;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO pour la réponse OAuth2 de TresorPay
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TresorPayOAuthResponse {
    
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("expires_in")
    private Integer expiresIn;
    
    @JsonProperty("refresh_expires_in")
    private Integer refreshExpiresIn;
    
    @JsonProperty("token_type")
    private String tokenType;
    
    @JsonProperty("not-before-policy")
    private Integer notBeforePolicy;
    
    @JsonProperty("scope")
    private String scope;
}
