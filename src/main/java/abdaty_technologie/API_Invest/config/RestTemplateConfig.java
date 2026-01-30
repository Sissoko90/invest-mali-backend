<<<<<<< HEAD
package abdaty_technologie.API_Invest.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration pour RestTemplate utilisé par les services externes
 * comme l'API NINA INSTAT Mali
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Bean RestTemplate pour les appels HTTP externes
     * @return RestTemplate configuré
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
=======
package abdaty_technologie.API_Invest.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration pour RestTemplate utilisé par les services externes
 * comme l'API NINA INSTAT Mali
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Bean RestTemplate pour les appels HTTP externes
     * @return RestTemplate configuré
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
