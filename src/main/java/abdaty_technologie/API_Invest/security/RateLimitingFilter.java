<<<<<<< HEAD
package abdaty_technologie.API_Invest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Very simple in-memory token-bucket rate limiter per client IP.
 * Properties:
 *  - app.rate-limit.capacity
 *  - app.rate-limit.refill-tokens
 *  - app.rate-limit.refill-period-seconds
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${app.rate-limit.capacity:1000}")
    private int capacity;
    @Value("${app.rate-limit.refill-tokens:500}")
    private int refillTokens;
    @Value("${app.rate-limit.refill-period-seconds:30}")
    private long refillPeriodSeconds;

    public static class Bucket {
        public int tokens;
        public long lastRefillEpochSec;
        
        public Bucket() {
            this.tokens = 0;
            this.lastRefillEpochSec = 0;
        }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String ip = resolveClientIp(request);
        Bucket b = buckets.computeIfAbsent(ip, k -> {
            Bucket nb = new Bucket();
            nb.tokens = capacity;
            nb.lastRefillEpochSec = Instant.now().getEpochSecond();
            return nb;
        });

        refillIfNecessary(b);
        if (b.tokens <= 0) {
            log.warn("[rate-limit] IP={} capacity={} refill={}/{}s -> 429 Too Many Requests", ip, capacity, refillTokens, refillPeriodSeconds);
            response.setStatus(429); // Too Many Requests
            response.setHeader("Retry-After", String.valueOf(refillPeriodSeconds));
            response.getWriter().write("Rate limit exceeded. Try again later.");
            return;
        }
        b.tokens--;
        filterChain.doFilter(request, response);
    }

    private void refillIfNecessary(Bucket b) {
        long now = Instant.now().getEpochSecond();
        long elapsed = now - b.lastRefillEpochSec;
        if (elapsed >= refillPeriodSeconds) {
            long periods = elapsed / refillPeriodSeconds;
            long add = periods * refillTokens;
            int newTokens = (int) Math.min((long) capacity, (long) b.tokens + add);
            b.tokens = newTokens;
            b.lastRefillEpochSec = now;
        }
    }

    // Récupère l'IP client (respecte X-Forwarded-For si derrière un proxy)
    private String resolveClientIp(HttpServletRequest req) {
        String h = req.getHeader("X-Forwarded-For");
        if (h != null && !h.isBlank()) {
            return h.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
=======
package abdaty_technologie.API_Invest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Very simple in-memory token-bucket rate limiter per client IP.
 * Properties:
 *  - app.rate-limit.capacity
 *  - app.rate-limit.refill-tokens
 *  - app.rate-limit.refill-period-seconds
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${app.rate-limit.capacity:1000}")
    private int capacity;
    @Value("${app.rate-limit.refill-tokens:500}")
    private int refillTokens;
    @Value("${app.rate-limit.refill-period-seconds:30}")
    private long refillPeriodSeconds;

    public static class Bucket {
        public int tokens;
        public long lastRefillEpochSec;
        
        public Bucket() {
            this.tokens = 0;
            this.lastRefillEpochSec = 0;
        }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String ip = resolveClientIp(request);
        Bucket b = buckets.computeIfAbsent(ip, k -> {
            Bucket nb = new Bucket();
            nb.tokens = capacity;
            nb.lastRefillEpochSec = Instant.now().getEpochSecond();
            return nb;
        });

        refillIfNecessary(b);
        if (b.tokens <= 0) {
            log.warn("[rate-limit] IP={} capacity={} refill={}/{}s -> 429 Too Many Requests", ip, capacity, refillTokens, refillPeriodSeconds);
            response.setStatus(429); // Too Many Requests
            response.setHeader("Retry-After", String.valueOf(refillPeriodSeconds));
            response.getWriter().write("Rate limit exceeded. Try again later.");
            return;
        }
        b.tokens--;
        filterChain.doFilter(request, response);
    }

    private void refillIfNecessary(Bucket b) {
        long now = Instant.now().getEpochSecond();
        long elapsed = now - b.lastRefillEpochSec;
        if (elapsed >= refillPeriodSeconds) {
            long periods = elapsed / refillPeriodSeconds;
            long add = periods * refillTokens;
            int newTokens = (int) Math.min((long) capacity, (long) b.tokens + add);
            b.tokens = newTokens;
            b.lastRefillEpochSec = now;
        }
    }

    // Récupère l'IP client (respecte X-Forwarded-For si derrière un proxy)
    private String resolveClientIp(HttpServletRequest req) {
        String h = req.getHeader("X-Forwarded-For");
        if (h != null && !h.isBlank()) {
            return h.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
