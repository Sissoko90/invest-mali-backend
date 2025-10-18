package abdaty_technologie.API_Invest.config;

import com.stripe.Stripe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

import jakarta.annotation.PostConstruct;

/**
 * Configuration Stripe pour l'intégration des paiements
 */
@Configuration
public class StripeConfig {
    
    @Value("${stripe.secret-key}")
    private String secretKey;
    
    @Value("${stripe.public-key}")
    private String publicKey;
    
    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;
    
    @Value("${stripe.currency:xof}")
    private String defaultCurrency;
    
    /**
     * Initialise la clé secrète Stripe
     */
    @PostConstruct
    public void init() {
        if (secretKey == null || secretKey.trim().isEmpty()) {
            System.out.println("⚠️ Stripe secret key non configurée - Les paiements Stripe ne fonctionneront pas");
            return;
        }
        Stripe.apiKey = secretKey;
        String maskedKey = secretKey.length() > 12 ? secretKey.substring(0, 12) + "..." : "***";
        System.out.println("✅ Stripe configuré avec la clé: " + maskedKey);
    }
    
    /**
     * Bean pour la clé publique (utilisée côté frontend)
     */
    @Bean
    public String stripePublicKey() {
        return publicKey;
    }
    
    /**
     * Bean pour la clé secrète
     */
    @Bean
    public String stripeSecretKey() {
        return secretKey;
    }
    
    /**
     * Bean pour le secret webhook
     */
    @Bean
    public String stripeWebhookSecret() {
        if (webhookSecret == null || webhookSecret.trim().isEmpty()) {
            System.out.println("⚠️ Webhook secret non configuré - Les webhooks Stripe ne fonctionneront pas");
            return null;
        }
        return webhookSecret;
    }
    
    /**
     * Bean pour la devise par défaut
     */
    @Bean
    public String stripeDefaultCurrency() {
        return defaultCurrency;
    }
}
