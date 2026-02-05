package abdaty_technologie.API_Invest.orangemoney.v2.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèle pour la réponse du token OAuth2
 * Basé sur la réponse du test Postman
 */
public class OAuthTokenResponse {
    
    @JsonProperty("token_type")
    private String tokenType;
    
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("expires_in")
    private Integer expiresIn;
    
    public OAuthTokenResponse() {}
    
    public String getTokenType() {
        return tokenType;
    }
    
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public Integer getExpiresIn() {
        return expiresIn;
    }
    
    public void setExpiresIn(Integer expiresIn) {
        this.expiresIn = expiresIn;
    }
    
    public boolean isValid() {
        return accessToken != null && !accessToken.trim().isEmpty();
    }
    
    @Override
    public String toString() {
        return "OAuthTokenResponse{" +
                "tokenType='" + tokenType + '\'' +
                ", accessToken='" + (accessToken != null ? "***" + accessToken.substring(Math.max(0, accessToken.length() - 10)) : null) + '\'' +
                ", expiresIn=" + expiresIn +
                '}';
    }
}
