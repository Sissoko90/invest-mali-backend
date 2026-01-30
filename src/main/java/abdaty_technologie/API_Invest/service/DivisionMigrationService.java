<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.DivisionDto;

import java.util.List;

/**
 * Service de migration pour basculer progressivement de l'ancien système
 * basé sur la table divisions vers l'API INSTAT Mali
 */
public interface DivisionMigrationService {
    
    /**
     * Vérifier si l'API INSTAT est disponible
     */
    boolean isInstatApiAvailable();
    
    /**
     * Récupérer les régions (avec fallback sur l'ancien système si nécessaire)
     */
    List<DivisionDto> getRegionsWithFallback();
    
    /**
     * Récupérer les cercles avec fallback
     */
    List<DivisionDto> getCerclesWithFallback(String regionCode);
    
    /**
     * Récupérer les communes avec fallback
     */
    List<DivisionDto> getCommunesWithFallback(String cercleCode);
    
    /**
     * Récupérer les quartiers avec fallback
     */
    List<DivisionDto> getQuartiersWithFallback(String communeCode);
    
    /**
     * Rechercher des divisions avec fallback
     */
    List<DivisionDto> searchDivisionsWithFallback(String query, String type);
    
    /**
     * Récupérer une division par code avec fallback
     */
    DivisionDto getDivisionByCodeWithFallback(String code);
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.DivisionDto;

import java.util.List;

/**
 * Service de migration pour basculer progressivement de l'ancien système
 * basé sur la table divisions vers l'API INSTAT Mali
 */
public interface DivisionMigrationService {
    
    /**
     * Vérifier si l'API INSTAT est disponible
     */
    boolean isInstatApiAvailable();
    
    /**
     * Récupérer les régions (avec fallback sur l'ancien système si nécessaire)
     */
    List<DivisionDto> getRegionsWithFallback();
    
    /**
     * Récupérer les cercles avec fallback
     */
    List<DivisionDto> getCerclesWithFallback(String regionCode);
    
    /**
     * Récupérer les communes avec fallback
     */
    List<DivisionDto> getCommunesWithFallback(String cercleCode);
    
    /**
     * Récupérer les quartiers avec fallback
     */
    List<DivisionDto> getQuartiersWithFallback(String communeCode);
    
    /**
     * Rechercher des divisions avec fallback
     */
    List<DivisionDto> searchDivisionsWithFallback(String query, String type);
    
    /**
     * Récupérer une division par code avec fallback
     */
    DivisionDto getDivisionByCodeWithFallback(String code);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
