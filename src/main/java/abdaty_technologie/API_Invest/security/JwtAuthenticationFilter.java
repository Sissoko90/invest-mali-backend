package abdaty_technologie.API_Invest.security;

import abdaty_technologie.API_Invest.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain chain) throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");
        String requestURI = request.getRequestURI();

        // Logs de diagnostic pour Orange Money V2
        if (requestURI.contains("/orange-money/v2/")) {
            logger.info("🔍 [JWT] Requête Orange Money V2: {}", requestURI);
            logger.info("🔍 [JWT] Header Authorization: {}", requestTokenHeader != null ? "PRÉSENT" : "ABSENT");
        }

        String username = null;
        String jwtToken = null;

        // JWT Token est dans la forme "Bearer token". Supprimer le mot Bearer et obtenir seulement le Token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                username = jwtUtil.getUsernameFromToken(jwtToken);
                if (requestURI.contains("/orange-money/v2/")) {
                    logger.info("🔍 [JWT] Username extrait du token: {}", username);
                }
            } catch (Exception e) {
                logger.error("❌ [JWT] Impossible d'obtenir le nom d'utilisateur du token JWT", e);
            }
        } else if (requestURI.contains("/orange-money/v2/")) {
            logger.warn("⚠️ [JWT] Aucun token Bearer trouvé pour Orange Money V2");
        }

        // Une fois que nous obtenons le token, validons-le
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Si le token est valide, configurons Spring Security pour définir manuellement l'authentification
            if (jwtUtil.validateToken(jwtToken, username)) {
                
                String role = jwtUtil.getRoleFromToken(jwtToken);
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = 
                    new UsernamePasswordAuthenticationToken(username, null, Collections.singletonList(authority));
                
                usernamePasswordAuthenticationToken
                    .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Après avoir défini l'authentification dans le contexte, nous spécifions
                // que l'utilisateur actuel est authentifié. Donc il passe les configurations de Spring Security avec succès.
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        chain.doFilter(request, response);
    }
}
