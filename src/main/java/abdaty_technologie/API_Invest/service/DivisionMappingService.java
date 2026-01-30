<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.DivisionDto;
import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;

import java.util.List;

/**
 * Service de mapping entre les DTOs INSTAT et les DTOs unifiés
 */
public interface DivisionMappingService {
    
    /**
     * Convertir une région INSTAT en DivisionDto
     */
    DivisionDto mapRegionToDto(RegionResponse region);
    
    /**
     * Convertir un cercle INSTAT en DivisionDto
     */
    DivisionDto mapCercleToDto(CercleResponse cercle);
    
    /**
     * Convertir une commune INSTAT en DivisionDto
     */
    DivisionDto mapCommuneToDto(CommuneResponse commune);
    
    /**
     * Convertir un quartier INSTAT en DivisionDto
     */
    DivisionDto mapQuartierToDto(QuartierResponse quartier);
    
    /**
     * Convertir une liste de régions
     */
    List<DivisionDto> mapRegionsToDto(List<RegionResponse> regions);
    
    /**
     * Convertir une liste de cercles
     */
    List<DivisionDto> mapCerclesToDto(List<CercleResponse> cercles);
    
    /**
     * Convertir une liste de communes
     */
    List<DivisionDto> mapCommunesToDto(List<CommuneResponse> communes);
    
    /**
     * Convertir une liste de quartiers
     */
    List<DivisionDto> mapQuartiersToDto(List<QuartierResponse> quartiers);
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.DivisionDto;
import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;

import java.util.List;

/**
 * Service de mapping entre les DTOs INSTAT et les DTOs unifiés
 */
public interface DivisionMappingService {
    
    /**
     * Convertir une région INSTAT en DivisionDto
     */
    DivisionDto mapRegionToDto(RegionResponse region);
    
    /**
     * Convertir un cercle INSTAT en DivisionDto
     */
    DivisionDto mapCercleToDto(CercleResponse cercle);
    
    /**
     * Convertir une commune INSTAT en DivisionDto
     */
    DivisionDto mapCommuneToDto(CommuneResponse commune);
    
    /**
     * Convertir un quartier INSTAT en DivisionDto
     */
    DivisionDto mapQuartierToDto(QuartierResponse quartier);
    
    /**
     * Convertir une liste de régions
     */
    List<DivisionDto> mapRegionsToDto(List<RegionResponse> regions);
    
    /**
     * Convertir une liste de cercles
     */
    List<DivisionDto> mapCerclesToDto(List<CercleResponse> cercles);
    
    /**
     * Convertir une liste de communes
     */
    List<DivisionDto> mapCommunesToDto(List<CommuneResponse> communes);
    
    /**
     * Convertir une liste de quartiers
     */
    List<DivisionDto> mapQuartiersToDto(List<QuartierResponse> quartiers);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
