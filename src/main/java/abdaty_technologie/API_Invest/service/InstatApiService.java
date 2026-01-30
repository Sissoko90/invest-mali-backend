<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;

import java.util.List;

/**
 * Interface pour le service d'intégration avec l'API INSTAT Mali
 */
public interface InstatApiService {
    
    /**
     * Récupérer toutes les régions
     * @return Liste des régions
     */
    List<RegionResponse> getAllRegions();
    
    /**
     * Récupérer les cercles d'une région
     * @param regionCode Code de la région (ex: "01")
     * @return Liste des cercles
     */
    List<CercleResponse> getCerclesByRegion(String regionCode);
    
    /**
     * Récupérer les communes d'un cercle
     * @param cercleCode Code du cercle (ex: "0101")
     * @return Liste des communes
     */
    List<CommuneResponse> getCommunesByCercle(String cercleCode);
    
    /**
     * Récupérer les quartiers/villages/fractions d'une commune
     * @param communeCode Code de la commune (ex: "01010101")
     * @return Liste des quartiers/villages/fractions
     */
    List<QuartierResponse> getQuartiersByCommune(String communeCode);
    
    /**
     * Rechercher des divisions par nom
     * @param query Terme de recherche
     * @param type Type de division (optionnel)
     * @return Liste des résultats
     */
    List<Object> searchDivisions(String query, String type);
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;

import java.util.List;

/**
 * Interface pour le service d'intégration avec l'API INSTAT Mali
 */
public interface InstatApiService {
    
    /**
     * Récupérer toutes les régions
     * @return Liste des régions
     */
    List<RegionResponse> getAllRegions();
    
    /**
     * Récupérer les cercles d'une région
     * @param regionCode Code de la région (ex: "01")
     * @return Liste des cercles
     */
    List<CercleResponse> getCerclesByRegion(String regionCode);
    
    /**
     * Récupérer les communes d'un cercle
     * @param cercleCode Code du cercle (ex: "0101")
     * @return Liste des communes
     */
    List<CommuneResponse> getCommunesByCercle(String cercleCode);
    
    /**
     * Récupérer les quartiers/villages/fractions d'une commune
     * @param communeCode Code de la commune (ex: "01010101")
     * @return Liste des quartiers/villages/fractions
     */
    List<QuartierResponse> getQuartiersByCommune(String communeCode);
    
    /**
     * Rechercher des divisions par nom
     * @param query Terme de recherche
     * @param type Type de division (optionnel)
     * @return Liste des résultats
     */
    List<Object> searchDivisions(String query, String type);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
