package abdaty_technologie.API_Invest.orangemoney.v2.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèle pour la requête d'obtention du token OAuth2
 * Basé sur le test Postman fourni
 */
public class OAuthTokenRequest {
    
    @JsonProperty("grant_type")
    private String grantType = "client_credentials";
    
    public OAuthTokenRequest() {}
    
    public String getGrantType() {
        return grantType;
    }
    
    public void setGrantType(String grantType) {
        this.grantType = grantType;
    }
    
    @Override
    public String toString() {
        return "OAuthTokenRequest{" +
                "grantType='" + grantType + '\'' +
                '}';
    }
}
