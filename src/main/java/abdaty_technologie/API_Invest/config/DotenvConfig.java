package abdaty_technologie.API_Invest.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
public class DotenvConfig {

    @PostConstruct
    public void loadDotenv() {
        try {
            // Charger le fichier .env depuis la racine du projet
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")  // Racine du projet
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();

            // Définir les variables d'environnement système
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                
                // Ne pas écraser les variables d'environnement système existantes
                if (System.getenv(key) == null) {
                    System.setProperty(key, value);
                    System.out.println("✅ Variable d'environnement chargée: " + key + " = " + value);
                }
            });

            System.out.println("🔧 Fichier .env chargé avec succès");
            
        } catch (Exception e) {
            System.err.println("⚠️ Impossible de charger le fichier .env: " + e.getMessage());
            System.err.println("L'application continuera avec les variables d'environnement système");
        }
    }
}
