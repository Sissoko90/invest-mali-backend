package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.util.Map;

/**
 * Contrôleur de test simple pour l'API INSTAT Mali
 */
@RestController
@RequestMapping("/api/v1/simple-instat")
@CrossOrigin(origins = "*")
public class SimpleInstatTestController {
    
    /**
     * Test simple de l'API INSTAT
     */
    @GetMapping("/test")
    public ResponseEntity<String> testInstat() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // Headers pour l'API INSTAT
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEyNjkxMjI5MTUzOTE2MDkxMTY5MTIyOTEwNjkxMzI5NjM5MTI3OTEyNzk2MDkxNzA5MTIyOTYxOTEwNjkxNjQ5MTI0OTE1MzkxNTA5MTUwOTExNTk2MjkxNzA5MTIwOTEyNjkxMjY5MTIxOTE2NzkxMTc5MTIx");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            // Appel direct à l'API INSTAT
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://nina.api.instat.ml/api/get/regions",
                HttpMethod.GET,
                entity,
                Map.class
            );
            
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null) {
                Object value = responseBody.get("value");
                Object count = responseBody.get("Count");
                
                return ResponseEntity.ok(
                    "✅ API INSTAT fonctionne !\n" +
                    "Count: " + count + "\n" +
                    "Value type: " + (value != null ? value.getClass().getSimpleName() : "null") + "\n" +
                    "Réponse complète: " + responseBody.toString()
                );
            } else {
                return ResponseEntity.ok("❌ Réponse vide de l'API INSTAT");
            }
            
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Erreur: " + e.getMessage() + "\nCause: " + (e.getCause() != null ? e.getCause().getMessage() : "Aucune"));
        }
    }
    
    /**
     * Test de mapping simple
     */
    @GetMapping("/regions-simple")
    public ResponseEntity<String> getRegionsSimple() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEyNjkxMjI5MTUzOTE2MDkxMTY5MTIyOTEwNjkxMzI5NjM5MTI3OTEyNzk2MDkxNzA5MTIyOTYxOTEwNjkxNjQ5MTI0OTE1MzkxNTA5MTUwOTExNTk2MjkxNzA5MTIwOTEyNjkxMjY5MTIxOTE2NzkxMTc5MTIx");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                "https://nina.api.instat.ml/api/get/regions",
                HttpMethod.GET,
                entity,
                String.class
            );
            
            return ResponseEntity.ok("Données brutes:\n" + response.getBody());
            
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Erreur: " + e.getMessage());
        }
    }
}
