<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;
import abdaty_technologie.API_Invest.service.InstatApiService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour les divisions administratives via l'API INSTAT Mali
 * Remplace l'ancien système basé sur la table divisions
 */
@RestController
@RequestMapping("/api/v1/instat-divisions")
@CrossOrigin(origins = "*")
public class InstatDivisionController {
    
    @Autowired
    private InstatApiService instatApiService;
    
    /**
     * Récupérer toutes les régions
     * GET /api/v1/instat-divisions/regions
     */
    @GetMapping("/regions")
    public ResponseEntity<List<RegionResponse>> getAllRegions() {
        try {
            System.out.println("[InstatDivisionController] Récupération de toutes les régions");
            List<RegionResponse> regions = instatApiService.getAllRegions();
            System.out.println("[InstatDivisionController] " + regions.size() + " régions récupérées");
            return ResponseEntity.ok(regions);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des régions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Récupérer les cercles d'une région
     * GET /api/v1/instat-divisions/regions/{regionCode}/cercles
     */
    @GetMapping("/regions/{regionCode}/cercles")
    public ResponseEntity<List<CercleResponse>> getCerclesByRegion(@PathVariable String regionCode) {
        try {
            System.out.println("[InstatDivisionController] Récupération des cercles pour la région: " + regionCode);
            
            if (regionCode == null || regionCode.trim().isEmpty()) {
                System.err.println("[InstatDivisionController] Code région manquant");
                return ResponseEntity.badRequest().body(null);
            }
            
            List<CercleResponse> cercles = instatApiService.getCerclesByRegion(regionCode);
            System.out.println("[InstatDivisionController] " + cercles.size() + " cercles récupérés");
            return ResponseEntity.ok(cercles);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des cercles: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Récupérer les communes d'un cercle
     * GET /api/v1/instat-divisions/cercles/{cercleCode}/communes
     */
    @GetMapping("/cercles/{cercleCode}/communes")
    public ResponseEntity<List<CommuneResponse>> getCommunesByCercle(@PathVariable String cercleCode) {
        try {
            System.out.println("[InstatDivisionController] Récupération des communes pour le cercle: " + cercleCode);
            
            if (cercleCode == null || cercleCode.trim().isEmpty()) {
                System.err.println("[InstatDivisionController] Code cercle manquant");
                return ResponseEntity.badRequest().body(null);
            }
            
            List<CommuneResponse> communes = instatApiService.getCommunesByCercle(cercleCode);
            System.out.println("[InstatDivisionController] " + communes.size() + " communes récupérées");
            return ResponseEntity.ok(communes);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des communes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Récupérer les quartiers/villages/fractions d'une commune
     * GET /api/v1/instat-divisions/communes/{communeCode}/quartiers
     */
    @GetMapping("/communes/{communeCode}/quartiers")
    public ResponseEntity<List<QuartierResponse>> getQuartiersByCommune(@PathVariable String communeCode) {
        try {
            System.out.println("[InstatDivisionController] Récupération des quartiers pour la commune: " + communeCode);
            
            if (communeCode == null || communeCode.trim().isEmpty()) {
                System.err.println("[InstatDivisionController] Code commune manquant");
                return ResponseEntity.badRequest().body(null);
            }
            
            List<QuartierResponse> quartiers = instatApiService.getQuartiersByCommune(communeCode);
            System.out.println("[InstatDivisionController] " + quartiers.size() + " quartiers récupérés");
            return ResponseEntity.ok(quartiers);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des quartiers: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Rechercher des divisions par nom
     * GET /api/v1/instat-divisions/search?query=...&type=...
     */
    @GetMapping("/search")
    public ResponseEntity<List<Object>> searchDivisions(
            @RequestParam String query,
            @RequestParam(required = false) String type) {
        try {
            System.out.println("[InstatDivisionController] Recherche divisions: query=" + query + ", type=" + type);
            
            if (query == null || query.trim().length() < 2) {
                System.out.println("[InstatDivisionController] Query trop courte");
                return ResponseEntity.ok(List.of());
            }
            
            List<Object> results = instatApiService.searchDivisions(query, type);
            System.out.println("[InstatDivisionController] " + results.size() + " résultats trouvés");
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la recherche: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }
    
    /**
     * Test de connectivité avec l'API INSTAT
     * GET /api/v1/instat-divisions/test
     */
    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        try {
            System.out.println("[InstatDivisionController] Test de connectivité avec l'API INSTAT");
            List<RegionResponse> regions = instatApiService.getAllRegions();
            
            if (regions.isEmpty()) {
                return ResponseEntity.ok("Connexion établie mais aucune région récupérée");
            }
            
            return ResponseEntity.ok("Connexion réussie - " + regions.size() + " régions disponibles");
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur de connectivité: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Erreur de connexion à l'API INSTAT: " + e.getMessage());
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;
import abdaty_technologie.API_Invest.service.InstatApiService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour les divisions administratives via l'API INSTAT Mali
 * Remplace l'ancien système basé sur la table divisions
 */
@RestController
@RequestMapping("/api/v1/instat-divisions")
@CrossOrigin(origins = "*")
public class InstatDivisionController {
    
    @Autowired
    private InstatApiService instatApiService;
    
    /**
     * Récupérer toutes les régions
     * GET /api/v1/instat-divisions/regions
     */
    @GetMapping("/regions")
    public ResponseEntity<List<RegionResponse>> getAllRegions() {
        try {
            System.out.println("[InstatDivisionController] Récupération de toutes les régions");
            List<RegionResponse> regions = instatApiService.getAllRegions();
            System.out.println("[InstatDivisionController] " + regions.size() + " régions récupérées");
            return ResponseEntity.ok(regions);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des régions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Récupérer les cercles d'une région
     * GET /api/v1/instat-divisions/regions/{regionCode}/cercles
     */
    @GetMapping("/regions/{regionCode}/cercles")
    public ResponseEntity<List<CercleResponse>> getCerclesByRegion(@PathVariable String regionCode) {
        try {
            System.out.println("[InstatDivisionController] Récupération des cercles pour la région: " + regionCode);
            
            if (regionCode == null || regionCode.trim().isEmpty()) {
                System.err.println("[InstatDivisionController] Code région manquant");
                return ResponseEntity.badRequest().body(null);
            }
            
            List<CercleResponse> cercles = instatApiService.getCerclesByRegion(regionCode);
            System.out.println("[InstatDivisionController] " + cercles.size() + " cercles récupérés");
            return ResponseEntity.ok(cercles);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des cercles: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Récupérer les communes d'un cercle
     * GET /api/v1/instat-divisions/cercles/{cercleCode}/communes
     */
    @GetMapping("/cercles/{cercleCode}/communes")
    public ResponseEntity<List<CommuneResponse>> getCommunesByCercle(@PathVariable String cercleCode) {
        try {
            System.out.println("[InstatDivisionController] Récupération des communes pour le cercle: " + cercleCode);
            
            if (cercleCode == null || cercleCode.trim().isEmpty()) {
                System.err.println("[InstatDivisionController] Code cercle manquant");
                return ResponseEntity.badRequest().body(null);
            }
            
            List<CommuneResponse> communes = instatApiService.getCommunesByCercle(cercleCode);
            System.out.println("[InstatDivisionController] " + communes.size() + " communes récupérées");
            return ResponseEntity.ok(communes);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des communes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Récupérer les quartiers/villages/fractions d'une commune
     * GET /api/v1/instat-divisions/communes/{communeCode}/quartiers
     */
    @GetMapping("/communes/{communeCode}/quartiers")
    public ResponseEntity<List<QuartierResponse>> getQuartiersByCommune(@PathVariable String communeCode) {
        try {
            System.out.println("[InstatDivisionController] Récupération des quartiers pour la commune: " + communeCode);
            
            if (communeCode == null || communeCode.trim().isEmpty()) {
                System.err.println("[InstatDivisionController] Code commune manquant");
                return ResponseEntity.badRequest().body(null);
            }
            
            List<QuartierResponse> quartiers = instatApiService.getQuartiersByCommune(communeCode);
            System.out.println("[InstatDivisionController] " + quartiers.size() + " quartiers récupérés");
            return ResponseEntity.ok(quartiers);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la récupération des quartiers: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Rechercher des divisions par nom
     * GET /api/v1/instat-divisions/search?query=...&type=...
     */
    @GetMapping("/search")
    public ResponseEntity<List<Object>> searchDivisions(
            @RequestParam String query,
            @RequestParam(required = false) String type) {
        try {
            System.out.println("[InstatDivisionController] Recherche divisions: query=" + query + ", type=" + type);
            
            if (query == null || query.trim().length() < 2) {
                System.out.println("[InstatDivisionController] Query trop courte");
                return ResponseEntity.ok(List.of());
            }
            
            List<Object> results = instatApiService.searchDivisions(query, type);
            System.out.println("[InstatDivisionController] " + results.size() + " résultats trouvés");
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur lors de la recherche: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }
    
    /**
     * Test de connectivité avec l'API INSTAT
     * GET /api/v1/instat-divisions/test
     */
    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        try {
            System.out.println("[InstatDivisionController] Test de connectivité avec l'API INSTAT");
            List<RegionResponse> regions = instatApiService.getAllRegions();
            
            if (regions.isEmpty()) {
                return ResponseEntity.ok("Connexion établie mais aucune région récupérée");
            }
            
            return ResponseEntity.ok("Connexion réussie - " + regions.size() + " régions disponibles");
        } catch (Exception e) {
            System.err.println("[InstatDivisionController] Erreur de connectivité: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Erreur de connexion à l'API INSTAT: " + e.getMessage());
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
