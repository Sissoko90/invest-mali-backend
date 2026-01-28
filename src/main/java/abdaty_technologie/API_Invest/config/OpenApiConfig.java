package abdaty_technologie.API_Invest.config;

import java.sql.Blob;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springdoc.core.utils.SpringDocUtils;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

    static {
        // Evite les erreurs de génération de schémas pour java.sql.Blob
        // en le remplaçant par un type binaire simple (byte[])
        SpringDocUtils.getConfig().replaceWithClass(Blob.class, byte[].class);
    }

    @Bean
    public OpenAPI investMaliOpenAPI() {
        Info info = new Info()
            .title("InvestMali API")
            .description("API publique pour la gestion des entreprises et des divisions territoriales.\n\n"
                + "Cette documentation est générée automatiquement à partir du code (Springdoc OpenAPI).")
            .version("v1")
            .termsOfService("https://example.com/terms")
            .contact(new Contact()
                .name("Abdaty Technologie")
                .email("contact@abdaty-technologie.com")
                .url("https://abdaty-technologie.com"))
            .license(new License()
                .name("Propriétaire")
                .url("https://abdaty-technologie.com/licenses"));

        ExternalDocumentation externalDocs = new ExternalDocumentation()
            .description("Guide d'intégration et ressources")
            .url("https://abdaty-technologie.com/docs");

        // Déclare le serveur logique (utile pour les clients générés)
        Server server = new Server()
            .url("/api/v1")
            .description("Serveur local (contexte /api/v1)");

        return new OpenAPI()
            .info(info)
            .externalDocs(externalDocs)
            .addServersItem(server);
    }
}
