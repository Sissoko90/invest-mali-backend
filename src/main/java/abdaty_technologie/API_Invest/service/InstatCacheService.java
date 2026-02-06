package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;

import java.util.List;

/**
 * Service de cache pour optimiser les appels à l'API INSTAT Mali
 * Évite les appels répétés pour les mêmes données
 */
public interface InstatCacheService {
    
    /**
     * Récupérer les régions avec cache
     */
    List<RegionResponse> getCachedRegions();
    
    /**
     * Récupérer les cercles avec cache
     */
    List<CercleResponse> getCachedCercles(String regionCode);
    
    /**
     * Récupérer les communes avec cache
     */
    List<CommuneResponse> getCachedCommunes(String cercleCode);
    
    /**
     * Récupérer les quartiers avec cache
     */
    List<QuartierResponse> getCachedQuartiers(String communeCode);
    
    /**
     * Vider le cache
     */
    void clearCache();
    
    /**
     * Vider le cache pour un type spécifique
     */
    void clearCache(String type);
    
    /**
     * Obtenir les statistiques du cache
     */
    String getCacheStats();
}
