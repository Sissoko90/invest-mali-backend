package abdaty_technologie.API_Invest.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration Spring MVC pour gérer correctement les extensions de fichiers dans les URLs
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    // La configuration par défaut de Spring Boot 3.x gère déjà correctement les extensions
    // Le pattern {filename:.+} dans les @GetMapping suffit
}
