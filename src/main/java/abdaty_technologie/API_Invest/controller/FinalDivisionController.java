<<<<<<< HEAD
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
 * Contrôleur final pour les divisions administratives
 * Utilise l'API INSTAT Mali avec la vraie structure de données
 * Compatible avec l'ancienne API
 */
@RestController
@RequestMapping("/divisions")
@CrossOrigin(origins = "*")
public class FinalDivisionController {
    
    private static final String INSTAT_BASE_URL = "https://apimali.test.instat.ml/api";
    private static final String BEARER_TOKEN = "MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw";
    
    /**
     * Créer les headers pour l'API INSTAT
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + BEARER_TOKEN);
        headers.set("accept", "*/*");
        headers.set("X-CSRF-TOKEN", "");
        return headers;
    }
    
    /**
     * Test de connectivité
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/regions",
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
     * Récupérer toutes les régions
     */
    @GetMapping("/regions")
    public ResponseEntity<List<Map<String, Object>>> getRegions() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/regions",
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
                        "libelle", region.getOrDefault("nom_region", ""),
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
            System.out.println("🔍 [FinalDivisionController] Récupération cercles pour région: " + regionCode);
            String url = INSTAT_BASE_URL + "/get/cercles/" + regionCode;
            System.out.println("🔍 [FinalDivisionController] URL INSTAT: " + url);
            
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                List.class
            );
            
            System.out.println("✅ [FinalDivisionController] Réponse INSTAT reçue, status: " + response.getStatusCode());
            
            List<Map<String, Object>> cercles = (List<Map<String, Object>>) response.getBody();
            System.out.println("✅ [FinalDivisionController] Nombre de cercles bruts: " + (cercles != null ? cercles.size() : 0));
            
            if (cercles != null && !cercles.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> cercle : cercles) {
                    System.out.println("🔍 [FinalDivisionController] Cercle brut: " + cercle);
                    Map<String, Object> transformed = Map.of(
                        "id", cercle.getOrDefault("code", ""),
                        "code", cercle.getOrDefault("code", ""),
                        "nom", cercle.getOrDefault("nom", ""),
                        "libelle", cercle.getOrDefault("nom", ""),
                        "type", "CERCLE",
                        "parentCode", regionCode
                    );
                    result.add(transformed);
                }
                
                System.out.println("✅ [FinalDivisionController] Retour de " + result.size() + " cercles transformés");
                return ResponseEntity.ok(result);
            }
            
            System.out.println("⚠️ [FinalDivisionController] Aucun cercle trouvé pour la région " + regionCode);
            return ResponseEntity.ok(new ArrayList<>());
            
        } catch (Exception e) {
            System.err.println("❌ [FinalDivisionController] Erreur récupération cercles: " + e.getMessage());
            e.printStackTrace();
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
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/communes/" + cercleCode,
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
                        "libelle", commune.getOrDefault("nom", ""),
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
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/vfq/" + communeCode,
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
                        "libelle", quartier.getOrDefault("nom", ""),
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
     * Compter les divisions (approximatif)
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/regions",
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> regions = (List<Map<String, Object>>) response.getBody();
            long count = regions != null ? regions.size() : 0;
            
            return ResponseEntity.ok(count);
            
        } catch (Exception e) {
            System.err.println("Erreur comptage: " + e.getMessage());
            return ResponseEntity.ok(0L);
        }
    }
}
=======
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
 * Contrôleur final pour les divisions administratives
 * Utilise l'API INSTAT Mali avec la vraie structure de données
 * Compatible avec l'ancienne API
 */
@RestController
@RequestMapping("/divisions")
@CrossOrigin(origins = "*")
public class FinalDivisionController {
    
    private static final String INSTAT_BASE_URL = "https://apimali.test.instat.ml/api";
    private static final String BEARER_TOKEN = "MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw";
    
    /**
     * Créer les headers pour l'API INSTAT
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + BEARER_TOKEN);
        headers.set("accept", "*/*");
        headers.set("X-CSRF-TOKEN", "");
        return headers;
    }
    
    /**
     * Test de connectivité
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/regions",
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
     * Récupérer toutes les régions
     */
    @GetMapping("/regions")
    public ResponseEntity<List<Map<String, Object>>> getRegions() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/regions",
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
                        "libelle", region.getOrDefault("nom_region", ""),
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
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/cercles/" + regionCode,
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
                        "libelle", cercle.getOrDefault("nom", ""),
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
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/communes/" + cercleCode,
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
                        "libelle", commune.getOrDefault("nom", ""),
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
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/vfq/" + communeCode,
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
                        "libelle", quartier.getOrDefault("nom", ""),
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
     * Compter les divisions (approximatif)
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<List> response = restTemplate.exchange(
                INSTAT_BASE_URL + "/get/regions",
                HttpMethod.GET,
                entity,
                List.class
            );
            
            List<Map<String, Object>> regions = (List<Map<String, Object>>) response.getBody();
            long count = regions != null ? regions.size() : 0;
            
            return ResponseEntity.ok(count);
            
        } catch (Exception e) {
            System.err.println("Erreur comptage: " + e.getMessage());
            return ResponseEntity.ok(0L);
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
