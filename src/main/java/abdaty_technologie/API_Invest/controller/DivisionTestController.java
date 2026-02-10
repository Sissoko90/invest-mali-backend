package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.DivisionDto;
import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.service.InstatApiService;
import abdaty_technologie.API_Invest.service.DivisionMappingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Contrôleur de test pour valider l'intégration avec l'API INSTAT Mali
 */
@RestController
@RequestMapping("/api/v1/test-instat")
@CrossOrigin(origins = "*")
public class DivisionTestController {
    
    @Autowired
    private InstatApiService instatApiService;
    
    @Autowired
    private DivisionMappingService mappingService;
    
    /**
     * Test complet de l'API INSTAT
     */
    @GetMapping("/full-test")
    public ResponseEntity<String> fullTest() {
        StringBuilder result = new StringBuilder();
        result.append("=== TEST COMPLET API INSTAT MALI ===\n\n");
        
        try {
            // Test 1: Régions
            result.append("1. Test des régions:\n");
            List<RegionResponse> regions = instatApiService.getAllRegions();
            result.append("   - Nombre de régions: ").append(regions.size()).append("\n");
            if (!regions.isEmpty()) {
                RegionResponse firstRegion = regions.get(0);
                result.append("   - Première région: ").append(firstRegion.getNom())
                      .append(" (Code: ").append(firstRegion.getCode()).append(")\n");
                
                // Test 2: Cercles de la première région
                result.append("\n2. Test des cercles (région ").append(firstRegion.getCode()).append("):\n");
                List<CercleResponse> cercles = instatApiService.getCerclesByRegion(firstRegion.getCode());
                result.append("   - Nombre de cercles: ").append(cercles.size()).append("\n");
                if (!cercles.isEmpty()) {
                    CercleResponse firstCercle = cercles.get(0);
                    result.append("   - Premier cercle: ").append(firstCercle.getNom())
                          .append(" (Code: ").append(firstCercle.getCode()).append(")\n");
                }
            }
            
            // Test 3: Mapping
            result.append("\n3. Test du mapping:\n");
            List<DivisionDto> regionsDto = mappingService.mapRegionsToDto(regions);
            result.append("   - Régions mappées: ").append(regionsDto.size()).append("\n");
            if (!regionsDto.isEmpty()) {
                DivisionDto firstDto = regionsDto.get(0);
                result.append("   - Premier DTO: ").append(firstDto.getNom())
                      .append(" (Type: ").append(firstDto.getType()).append(")\n");
            }
            
            result.append("\n✅ TOUS LES TESTS RÉUSSIS !");
            
        } catch (Exception e) {
            result.append("\n❌ ERREUR: ").append(e.getMessage());
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(result.toString());
    }
    
    /**
     * Test rapide de connectivité
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        try {
            List<RegionResponse> regions = instatApiService.getAllRegions();
            return ResponseEntity.ok("✅ API INSTAT accessible - " + regions.size() + " régions");
        } catch (Exception e) {
            return ResponseEntity.ok("❌ API INSTAT inaccessible: " + e.getMessage());
        }
    }
    
    /**
     * Test de debug pour voir les données brutes
     */
    @GetMapping("/debug-raw")
    public ResponseEntity<String> debugRaw() {
        try {
            // Test direct avec RestTemplate
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
            
            return ResponseEntity.ok("Données brutes API INSTAT:\n" + response.getBody());
            
        } catch (Exception e) {
            return ResponseEntity.ok("Erreur: " + e.getMessage());
        }
    }
    
    /**
     * Test d'une région spécifique (Bamako)
     */
    @GetMapping("/test-bamako")
    public ResponseEntity<String> testBamako() {
        StringBuilder result = new StringBuilder();
        result.append("=== TEST BAMAKO ===\n\n");
        
        try {
            // Trouver Bamako
            List<RegionResponse> regions = instatApiService.getAllRegions();
            RegionResponse bamako = null;
            
            for (RegionResponse region : regions) {
                if (region.getNom() != null && region.getNom().toLowerCase().contains("bamako")) {
                    bamako = region;
                    break;
                }
            }
            
            if (bamako != null) {
                result.append("Bamako trouvé:\n");
                result.append("- ID: ").append(bamako.getId()).append("\n");
                result.append("- Code: ").append(bamako.getCode()).append("\n");
                result.append("- Nom: ").append(bamako.getNom()).append("\n");
                
                // Test des cercles/arrondissements de Bamako
                List<CercleResponse> cercles = instatApiService.getCerclesByRegion(bamako.getCode());
                result.append("\nCercles/Arrondissements de Bamako: ").append(cercles.size()).append("\n");
                
                for (CercleResponse cercle : cercles) {
                    result.append("- ").append(cercle.getNom())
                          .append(" (Code: ").append(cercle.getCode()).append(")\n");
                }
                
            } else {
                result.append("❌ Bamako non trouvé dans les régions");
            }
            
        } catch (Exception e) {
            result.append("❌ ERREUR: ").append(e.getMessage());
        }
        
        return ResponseEntity.ok(result.toString());
    }
}
