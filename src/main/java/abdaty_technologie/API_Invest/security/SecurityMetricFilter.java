package abdaty_technologie.API_Invest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * SecurityMetricFilter (léger)
 * - Mesure la durée des requêtes HTTP par méthode et statut
 * - Sans dépendance Micrometer pour éviter d'ajouter un starter. On se contente de logs.
 * - Si vous ajoutez "spring-boot-starter-actuator" + Micrometer, vous pourrez réintroduire des métriques ici.
 */
@Component
public class SecurityMetricFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(SecurityMetricFilter.class);

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long end = System.nanoTime();
            long durNs = end - start;
            // Log en DEBUG pour ne pas polluer en prod
            if (log.isDebugEnabled()) {
                log.debug("[metrics] method={} status={} uri={} durationMs={}",
                        request.getMethod(), response.getStatus(), request.getRequestURI(), durNs / 1_000_000.0);
            }
        }
    }
}
