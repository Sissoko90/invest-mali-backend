package abdaty_technologie.API_Invest.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${security.jwt.secret}")
    private String secret;

    private static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60; // 24 heures
    private static final long REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60; // 7 jours

    private SecretKey getSigningKey() {
        byte[] keyBytes = java.util.Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Récupérer le nom d'utilisateur du token JWT
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    // Récupérer la date d'expiration du token JWT
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    // Pour récupérer toutes les informations du token, nous aurons besoin de la clé secrète
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Vérifier si le token a expiré
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    // Générer un token pour l'utilisateur
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username);
    }

    // Générer un token avec tous les rôles de l'utilisateur
    public String generateTokenWithRoles(String username, String mainRole, List<String> allRoles) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", mainRole); // Rôle principal pour compatibilité
        claims.put("roles", allRoles); // Tous les rôles
        return createToken(claims, username);
    }

    // Créer le token avec les claims et le sujet (nom d'utilisateur)
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .signWith(getSigningKey())
                .compact();
    }

    // Valider le token
    public Boolean validateToken(String token, String username) {
        final String tokenUsername = getUsernameFromToken(token);
        return (tokenUsername.equals(username) && !isTokenExpired(token));
    }

    // Récupérer le rôle du token
    public String getRoleFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("role", String.class));
    }

    // Récupérer tous les rôles du token
    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        return getClaimFromToken(token, claims -> (List<String>) claims.get("roles"));
    }
<<<<<<< HEAD

    // Générer un refresh token
    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_VALIDITY * 1000))
                .signWith(getSigningKey())
                .compact();
    }

    // Valider un refresh token
    public Boolean validateRefreshToken(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            String type = claims.get("type", String.class);
            return "refresh".equals(type) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // Rafraîchir un access token à partir d'un refresh token
    public String refreshAccessToken(String refreshToken, String role, List<String> allRoles) {
        if (!validateRefreshToken(refreshToken)) {
            throw new RuntimeException("Refresh token invalide ou expiré");
        }
        String username = getUsernameFromToken(refreshToken);
        return generateTokenWithRoles(username, role, allRoles);
    }
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
}
