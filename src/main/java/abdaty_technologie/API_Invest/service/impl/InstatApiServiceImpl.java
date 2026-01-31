package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;
import abdaty_technologie.API_Invest.service.InstatApiService;

import abdaty_technologie.API_Invest.config.InstatApiConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service d'intégration avec l'API INSTAT Mali
 */
@Service
public class InstatApiServiceImpl implements InstatApiService {
    
    private final RestTemplate restTemplate;
    private final InstatApiConfig config;
    
    @Autowired
    public InstatApiServiceImpl(InstatApiConfig config, RestTemplate instatRestTemplate) {
        this.config = config;
        this.restTemplate = instatRestTemplate;
    }
    
    /**
     * Créer les headers pour les requêtes API
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + config.getBearerToken());
        headers.set("accept", "*/*");
        headers.set("X-CSRF-TOKEN", "");
        return headers;
    }
    
    /**
     * Exécuter une requête GET vers l'API INSTAT
     */
    private <T> List<T> executeGetRequest(String endpoint, ParameterizedTypeReference<List<T>> responseType) {
        try {
            String url = config.getBaseUrl() + endpoint;
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            
            System.out.println("[InstatApiService] Appel API: " + url);
            
            ResponseEntity<List<T>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                responseType
            );
            
            List<T> result = response.getBody();
            if (result != null) {
                System.out.println("[InstatApiService] Réponse reçue: " + result.size() + " éléments");
                return result;
            } else {
                System.out.println("[InstatApiService] Réponse vide ou null");
                return new ArrayList<>();
            }
            
        } catch (HttpClientErrorException e) {
            System.err.println("[InstatApiService] Erreur client (4xx): " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return new ArrayList<>();
        } catch (HttpServerErrorException e) {
            System.err.println("[InstatApiService] Erreur serveur (5xx): " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("[InstatApiService] Erreur inattendue: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<RegionResponse> getAllRegions() {
        System.out.println("[InstatApiService] Récupération de toutes les régions");
        return executeGetRequest("/get/regions", new ParameterizedTypeReference<List<RegionResponse>>() {});
    }
    
    @Override
    public List<CercleResponse> getCerclesByRegion(String regionCode) {
        System.out.println("[InstatApiService] Récupération des cercles pour la région: " + regionCode);
        if (regionCode == null || regionCode.trim().isEmpty()) {
            System.err.println("[InstatApiService] Code région vide ou null");
            return new ArrayList<>();
        }
        
        return executeGetRequest("/get/cercles/" + regionCode, new ParameterizedTypeReference<List<CercleResponse>>() {});
    }
    
    @Override
    public List<CommuneResponse> getCommunesByCercle(String cercleCode) {
        System.out.println("[InstatApiService] Récupération des communes pour le cercle: " + cercleCode);
        if (cercleCode == null || cercleCode.trim().isEmpty()) {
            System.err.println("[InstatApiService] Code cercle vide ou null");
            return new ArrayList<>();
        }
        
        return executeGetRequest("/get/communes/" + cercleCode, new ParameterizedTypeReference<List<CommuneResponse>>() {});
    }
    
    @Override
    public List<QuartierResponse> getQuartiersByCommune(String communeCode) {
        System.out.println("[InstatApiService] Récupération des quartiers pour la commune: " + communeCode);
        if (communeCode == null || communeCode.trim().isEmpty()) {
            System.err.println("[InstatApiService] Code commune vide ou null");
            return new ArrayList<>();
        }
        
        return executeGetRequest("/get/vfq/" + communeCode, new ParameterizedTypeReference<List<QuartierResponse>>() {});
    }
    
    @Override
    public List<Object> searchDivisions(String query, String type) {
        System.out.println("[InstatApiService] Recherche divisions: query=" + query + ", type=" + type);
        
        if (query == null || query.trim().length() < 2) {
            System.out.println("[InstatApiService] Query trop courte, retour liste vide");
            return new ArrayList<>();
        }
        
        List<Object> results = new ArrayList<>();
        String lowerQuery = query.toLowerCase().trim();
        
        try {
            // Rechercher dans les régions
            if (type == null || type.equalsIgnoreCase("REGION")) {
                List<RegionResponse> regions = getAllRegions();
                results.addAll(regions.stream()
                    .filter(r -> r.getNom() != null && r.getNom().toLowerCase().contains(lowerQuery))
                    .collect(Collectors.toList()));
            }
            
            // Rechercher dans les cercles (limité aux premières régions pour éviter trop d'appels)
            if (type == null || type.equalsIgnoreCase("CERCLE")) {
                List<RegionResponse> regions = getAllRegions();
                for (RegionResponse region : regions.stream().limit(5).collect(Collectors.toList())) {
                    List<CercleResponse> cercles = getCerclesByRegion(region.getCode());
                    results.addAll(cercles.stream()
                        .filter(c -> c.getNom() != null && c.getNom().toLowerCase().contains(lowerQuery))
                        .collect(Collectors.toList()));
                }
            }
            
            // Rechercher dans les communes (limité pour éviter trop d'appels)
            if (type == null || type.equalsIgnoreCase("COMMUNE")) {
                List<RegionResponse> regions = getAllRegions();
                for (RegionResponse region : regions.stream().limit(3).collect(Collectors.toList())) {
                    List<CercleResponse> cercles = getCerclesByRegion(region.getCode());
                    for (CercleResponse cercle : cercles.stream().limit(3).collect(Collectors.toList())) {
                        List<CommuneResponse> communes = getCommunesByCercle(cercle.getCode());
                        results.addAll(communes.stream()
                            .filter(c -> c.getNom() != null && c.getNom().toLowerCase().contains(lowerQuery))
                            .collect(Collectors.toList()));
                    }
                }
            }
            
            // Limiter les résultats à 20 pour éviter les réponses trop lourdes
            if (results.size() > 20) {
                results = results.subList(0, 20);
            }
            
        } catch (Exception e) {
            System.err.println("[InstatApiService] Erreur lors de la recherche: " + e.getMessage());
        }
        
        System.out.println("[InstatApiService] Recherche terminée: " + results.size() + " résultats");
        return results;
    }
}
