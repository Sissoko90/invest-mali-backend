package abdaty_technologie.API_Invest.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration pour l'API INSTAT Mali
 */
@Configuration
public class InstatApiConfig {
    
    @Value("${instat.api.base-url:https://apimali.test.instat.ml/api}")
    private String baseUrl;
    
    @Value("${instat.api.bearer-token:MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw}")
    private String bearerToken;
    
    @Value("${instat.api.timeout:30000}")
    private int timeout;
    
    @Value("${instat.api.enabled:true}")
    private boolean enabled;
    
    @Bean
    public RestTemplate instatRestTemplate() {
        return new RestTemplate();
    }
    
    // Getters
    public String getBaseUrl() {
        return baseUrl;
    }
    
    public String getBearerToken() {
        return bearerToken;
    }
    
    public int getTimeout() {
        return timeout;
    }
    
    public boolean isEnabled() {
        return enabled;
    }
}
