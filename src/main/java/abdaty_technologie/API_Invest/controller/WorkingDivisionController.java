package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/**
 * Contrôleur de divisions fonctionnel - Version simplifiée
 */
@RestController
@RequestMapping("/api/v1/working-divisions")
@CrossOrigin(origins = "*")
public class WorkingDivisionController {
    
    /**
     * Test de connectivité INSTAT
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List> response = restTemplate.exchange(
                "https://apimali.test.instat.ml/api/get/regions",
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> regions = (List<Map<String, Object>>) response.getBody();
            if (regions != null && !regions.isEmpty()) {
                return ResponseEntity.ok("✅ API INSTAT accessible - " + regions.size() + " régions disponibles");
            } else {
                return ResponseEntity.ok("⚠️ API INSTAT répond mais aucune région trouvée");
            }
            
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Erreur API INSTAT: " + e.getMessage());
        }
    }
    
    /**
     * Récupérer les régions (version simplifiée)
     */
    @GetMapping("/regions")
    public ResponseEntity<List<Map<String, Object>>> getRegions() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List> response = restTemplate.exchange(
                "https://apimali.test.instat.ml/api/get/regions",
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> regions = (List<Map<String, Object>>) response.getBody();
            if (regions != null && !regions.isEmpty()) {
                // Transformer en format compatible
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> region : regions) {
                    Map<String, Object> transformed = Map.of(
                        "id", region.getOrDefault("code_region", ""),
                        "code", region.getOrDefault("code_region", ""),
                        "nom", region.getOrDefault("nom_region", ""),
                        "type", "REGION"
                    );
                    result.add(transformed);
                }
                
                return ResponseEntity.ok(result);
            }
            
            return ResponseEntity.ok(new ArrayList<>());
            
        } catch (Exception e) {
            System.err.println("Erreur récupération régions: " + e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    /**
     * Récupérer les cercles d'une région
     */
    @GetMapping("/regions/{regionCode}/cercles")
    public ResponseEntity<List<Map<String, Object>>> getCercles(@PathVariable String regionCode) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List> response = restTemplate.exchange(
                "https://apimali.test.instat.ml/api/get/cercles/" + regionCode,
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> cercles = (List<Map<String, Object>>) response.getBody();
            if (cercles != null && !cercles.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> cercle : cercles) {
                    Map<String, Object> transformed = Map.of(
                        "id", cercle.getOrDefault("code", ""),
                        "code", cercle.getOrDefault("code", ""),
                        "nom", cercle.getOrDefault("nom", ""),
                        "type", "CERCLE",
                        "parentCode", regionCode
                    );
                    result.add(transformed);
                }
                
                return ResponseEntity.ok(result);
            }
            
            return ResponseEntity.ok(new ArrayList<>());
            
        } catch (Exception e) {
            System.err.println("Erreur récupération cercles: " + e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    /**
     * Récupérer les communes d'un cercle
     */
    @GetMapping("/cercles/{cercleCode}/communes")
    public ResponseEntity<List<Map<String, Object>>> getCommunes(@PathVariable String cercleCode) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List> response = restTemplate.exchange(
                "https://apimali.test.instat.ml/api/get/communes/" + cercleCode,
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> communes = (List<Map<String, Object>>) response.getBody();
            if (communes != null && !communes.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> commune : communes) {
                    Map<String, Object> transformed = Map.of(
                        "id", commune.getOrDefault("code", ""),
                        "code", commune.getOrDefault("code", ""),
                        "nom", commune.getOrDefault("nom", ""),
                        "type", "COMMUNE",
                        "parentCode", cercleCode
                    );
                    result.add(transformed);
                }
                
                return ResponseEntity.ok(result);
            }
            
            return ResponseEntity.ok(new ArrayList<>());
            
        } catch (Exception e) {
            System.err.println("Erreur récupération communes: " + e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    /**
     * Récupérer les quartiers d'une commune
     */
    @GetMapping("/communes/{communeCode}/quartiers")
    public ResponseEntity<List<Map<String, Object>>> getQuartiers(@PathVariable String communeCode) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List> response = restTemplate.exchange(
                "https://apimali.test.instat.ml/api/get/vfq/" + communeCode,
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> quartiers = (List<Map<String, Object>>) response.getBody();
            if (quartiers != null && !quartiers.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> quartier : quartiers) {
                    Map<String, Object> transformed = Map.of(
                        "id", quartier.getOrDefault("code", ""),
                        "code", quartier.getOrDefault("code", ""),
                        "nom", quartier.getOrDefault("nom", ""),
                        "type", "QUARTIER",
                        "parentCode", communeCode
                    );
                    result.add(transformed);
                }
                
                return ResponseEntity.ok(result);
            }
            
            return ResponseEntity.ok(new ArrayList<>());
            
        } catch (Exception e) {
            System.err.println("Erreur récupération quartiers: " + e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    /**
     * Diagnostic - Vérifier si une division existe par code
     */
    @GetMapping("/check/{code}")
    public ResponseEntity<Map<String, Object>> checkDivision(@PathVariable String code) {
        try {
            // Vérifier d'abord via API INSTAT
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw");
            headers.set("accept", "*/*");
            headers.set("X-CSRF-TOKEN", "");
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            Map<String, Object> result = Map.of(
                "code", code,
                "exists", false,
                "source", "none",
                "details", "Division non trouvée"
            );
            
            // Essayer de trouver via API INSTAT
            try {
                // Pour les quartiers de Bamako (codes commençant par 9001)
                if (code.startsWith("9001")) {
                    String communeCode = code.substring(0, 8); // 90010201
                    
                    ResponseEntity<List> response = restTemplate.exchange(
                        "https://apimali.test.instat.ml/api/get/vfq/" + communeCode,
                        HttpMethod.GET,
                        entity,
                        List.class
                    );
                    
                    List<Map<String, Object>> quartiers = (List<Map<String, Object>>) response.getBody();
                    if (quartiers != null) {
                        for (Map<String, Object> quartier : quartiers) {
                            if (code.equals(quartier.get("code"))) {
                                result = Map.of(
                                    "code", code,
                                    "exists", true,
                                    "source", "INSTAT_API",
                                    "details", quartier
                                );
                                break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Erreur API INSTAT pour " + code + ": " + e.getMessage());
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "code", code,
                "exists", false,
                "source", "error",
                "details", "Erreur: " + e.getMessage()
            ));
        }
    }
}
