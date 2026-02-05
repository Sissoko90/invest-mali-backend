package abdaty_technologie.API_Invest.service.rccm;

import abdaty_technologie.API_Invest.util.MultipartBodyPublisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.Base64;

@Service
public class RccmService {

    @Value("${rccm.api.base-url}")
    private String rccmUrl;
    
    @Value("${rccm.api.username}")
    private String rccmUsername;
    
    @Value("${rccm.api.password}")
    private String rccmPassword;
    
    @Value("${rccm.api.ident-tiers}")
    private String identTiers;
    
    @Value("${rccm.api.noeud}")
    private String noeud;

    public String sendToRccm(Path zipPath) throws Exception {
        System.out.println("🚀 [RccmService] Envoi vers RCCM: " + rccmUrl);
        System.out.println("📁 [RccmService] Fichier ZIP: " + zipPath.toString());
        System.out.println("📊 [RccmService] Taille fichier: " + zipPath.toFile().length() + " bytes");
        
        MultipartBodyPublisher mp = new MultipartBodyPublisher()
                .addField("identTiers", identTiers)
                .addField("noeud", noeud)
                .addFile("zipFile", zipPath, identTiers + ".zip");

        System.out.println("🔐 [RccmService] Paramètres envoyés:");
        System.out.println("   - identTiers: " + identTiers);
        System.out.println("   - noeud: " + noeud);
        System.out.println("   - zipFile: " + identTiers + ".zip (" + zipPath.toFile().length() + " bytes)");
        System.out.println("   - credentials: " + rccmUsername + ":***");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(rccmUrl))
                .header("Authorization", "Basic " + baseAuth())
                .header("Content-Type", "multipart/form-data; boundary=" + mp.getBoundary())
                .POST(mp.build())
                .build();

        System.out.println("📡 [RccmService] Envoi de la requête...");
        
        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("🔄 [RccmService] Réponse RCCM: " + response.statusCode());
        System.out.println("📄 [RccmService] Body length: " + response.body().length());
        
        String body = response.body();
        if (body.startsWith("<!DOCTYPE html") || body.startsWith("<html") || body.startsWith("<!doctype")) {
            System.out.println("⚠️ [RccmService] Réponse HTML reçue (erreur serveur)");
            System.out.println("📄 [RccmService] Body (premiers 500 chars): " + body.substring(0, Math.min(500, body.length())));
            throw new RuntimeException("Le serveur RCCM a retourné une page HTML d'erreur. Vérifiez le format XML.");
        } else {
            System.out.println("📄 [RccmService] Body: " + body);
        }

        if (response.statusCode() != 200) {
            throw new RuntimeException("Erreur RCCM: " + response.statusCode() + " - " + body);
        }

        return body;
    }

    private String baseAuth() {
        String credentials = rccmUsername + ":" + rccmPassword;
        return Base64.getEncoder().encodeToString(credentials.getBytes());
    }
}
