package abdaty_technologie.API_Invest.security;



import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;


import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;


import java.util.List;

// src/main/java/abdaty_technologie/API_Invest/security/SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:}")
    private String allowedOrigins;

    private final RateLimitingFilter rateLimitingFilter;
    private final SecurityMetricFilter securityMetricFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(RateLimitingFilter rateLimitingFilter, SecurityMetricFilter securityMetricFilter, JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.rateLimitingFilter = rateLimitingFilter;
        this.securityMetricFilter = securityMetricFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // ✅ Bean manquant
    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Endpoints publics (sans authentification)
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/chat/**").permitAll() // Endpoints de chat
                .requestMatchers("/api/v1/entreprises").permitAll() // Ancien endpoint public
                .requestMatchers("/api/v1/agent/entreprises-test/**").permitAll() // Endpoint de test temporaire
                .requestMatchers("/api/v1/agent/antennes").permitAll() // Liste des antennes
                .requestMatchers("/api/v1/autorisation/**").permitAll() // Endpoints d'autorisation d'exercice
                .requestMatchers("/api/v1/agrement/**").permitAll() // Endpoints d'agrément
                .requestMatchers("/api/v1/documents-agrement/**").permitAll() // Endpoints documents agrément
                .requestMatchers("/documents-agrement/**").permitAll() // Endpoints documents agrément (sans préfixe)
                .requestMatchers("/entreprises/agrement/**").permitAll() // Endpoints fichiers agrément via EntrepriseController
                .requestMatchers("/files/**").permitAll() // Endpoints fichiers via FileServerController
                .requestMatchers("/api/v1/files/**").permitAll() // Endpoints fichiers via FileServerController (avec préfixe)
                .requestMatchers("/api/v1/agrement-workflow/**").permitAll() // Endpoints workflow agrément pour agents
                .requestMatchers("/agrement-files/**").permitAll() // Endpoints fichiers agrément
                .requestMatchers("/api/v1/investment-agreements/**").permitAll() // Endpoints demandes d'agrément d'investissement
                .requestMatchers("/investment-agreements/**").permitAll() // Endpoints demandes d'agrément d'investissement (sans préfixe)
                .requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                
                // Endpoints protégés (avec authentification JWT)
                .requestMatchers("/api/v1/agent/**").authenticated()
                .requestMatchers("/api/v1/superadmin/**").authenticated()
                .requestMatchers("/api/v1/orange-money/**").authenticated() // Orange Money nécessite authentification
                
                // Autres endpoints publics par défaut
                .anyRequest().permitAll()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        // Réactivation des filtres JWT pour corriger l'authentification
        http.addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(securityMetricFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 🔥 SOLUTION D'URGENCE CORS - Configuration forcée pour production
        List<String> origins = List.of(
            // Nouveau domaine formalisation.ml
            "https://www.formalisation.ml",
            "https://formalisation.ml",
            "http://www.formalisation.ml",
            "http://formalisation.ml",
            "https://agent.formalisation.ml",
            "http://agent.formalisation.ml",
            
            // Domaines de production HTTPS
            "https://investmali.abdatytch.com",
            "https://investmali-agent.abdatytch.com",
            "https://investmali.com",
            "https://www.investmali.com",
            "https://agent-investmali.com",
            "https://www.agent-investmali.com",
            
            // Domaines de production HTTP (fallback)
            "http://investmali.com",
            "http://www.investmali.com", 
            "http://agent-investmali.com",
            "http://www.agent-investmali.com",
            
            // Serveur IP direct
            "http://102.165.96.223",
            "https://102.165.96.223",
            
            // Serveur local réseau
            "http://192.168.2.4",
            "http://192.168.2.4:3000",
            "http://192.168.2.4:3001",
            "http://192.168.2.4:80",
            "http://192.168.2.4:8080",
            "https://192.168.2.4",
            
            // Développement local
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "https://127.0.0.1",
            "http://localhost"
        );
        
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        
        System.out.println("🔥 CORS URGENCE - Origines forcées: " + origins);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
