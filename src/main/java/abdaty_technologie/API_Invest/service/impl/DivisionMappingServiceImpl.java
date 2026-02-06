package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.dto.DivisionDto;
import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;
import abdaty_technologie.API_Invest.service.DivisionMappingService;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service de mapping entre les DTOs INSTAT et les DTOs unifiés
 */
@Service
public class DivisionMappingServiceImpl implements DivisionMappingService {
    
    @Override
    public DivisionDto mapRegionToDto(RegionResponse region) {
        if (region == null) return null;
        
        DivisionDto dto = new DivisionDto();
        dto.setId(region.getId());
        dto.setCode(region.getCode());
        dto.setNom(region.getNom());
        dto.setLibelle(region.getLibelle() != null ? region.getLibelle() : region.getNom());
        dto.setType("REGION");
        
        // Pour les régions, pas de parent
        dto.setParentId(null);
        dto.setParentCode(null);
        dto.setParentNom(null);
        
        // Hiérarchie - région est le niveau le plus haut
        dto.setRegionId(region.getId());
        dto.setRegionCode(region.getCode());
        dto.setRegionNom(region.getNom());
        
        return dto;
    }
    
    @Override
    public DivisionDto mapCercleToDto(CercleResponse cercle) {
        if (cercle == null) return null;
        
        DivisionDto dto = new DivisionDto();
        dto.setId(cercle.getId());
        dto.setCode(cercle.getCode());
        dto.setNom(cercle.getNom());
        dto.setLibelle(cercle.getLibelle() != null ? cercle.getLibelle() : cercle.getNom());
        dto.setType("CERCLE");
        
        // Parent = région
        dto.setParentId(cercle.getRegionId());
        dto.setParentCode(cercle.getRegionCode());
        dto.setParentNom(null); // Sera rempli si nécessaire
        
        // Hiérarchie
        dto.setRegionId(cercle.getRegionId());
        dto.setRegionCode(cercle.getRegionCode());
        dto.setCercleId(cercle.getId());
        dto.setCercleCode(cercle.getCode());
        dto.setCercleNom(cercle.getNom());
        
        return dto;
    }
    
    @Override
    public DivisionDto mapCommuneToDto(CommuneResponse commune) {
        if (commune == null) return null;
        
        DivisionDto dto = new DivisionDto();
        dto.setId(commune.getId());
        dto.setCode(commune.getCode());
        dto.setNom(commune.getNom());
        dto.setLibelle(commune.getLibelle() != null ? commune.getLibelle() : commune.getNom());
        dto.setType("COMMUNE");
        
        // Parent = cercle
        dto.setParentId(commune.getCercleId());
        dto.setParentCode(commune.getCercleCode());
        dto.setParentNom(null); // Sera rempli si nécessaire
        
        // Hiérarchie
        dto.setRegionId(commune.getRegionId());
        dto.setRegionCode(commune.getRegionCode());
        dto.setCercleId(commune.getCercleId());
        dto.setCercleCode(commune.getCercleCode());
        dto.setCommuneId(commune.getId());
        dto.setCommuneCode(commune.getCode());
        dto.setCommuneNom(commune.getNom());
        
        return dto;
    }
    
    @Override
    public DivisionDto mapQuartierToDto(QuartierResponse quartier) {
        if (quartier == null) return null;
        
        DivisionDto dto = new DivisionDto();
        dto.setId(quartier.getId());
        dto.setCode(quartier.getCode());
        dto.setNom(quartier.getNom());
        dto.setLibelle(quartier.getLibelle() != null ? quartier.getLibelle() : quartier.getNom());
        dto.setType("QUARTIER");
        
        // Parent = commune
        dto.setParentId(quartier.getCommuneId());
        dto.setParentCode(quartier.getCommuneCode());
        dto.setParentNom(null); // Sera rempli si nécessaire
        
        // Hiérarchie complète
        dto.setRegionId(quartier.getRegionId());
        dto.setRegionCode(quartier.getRegionCode());
        dto.setCercleId(quartier.getCercleId());
        dto.setCercleCode(quartier.getCercleCode());
        dto.setCommuneId(quartier.getCommuneId());
        dto.setCommuneCode(quartier.getCommuneCode());
        
        return dto;
    }
    
    @Override
    public List<DivisionDto> mapRegionsToDto(List<RegionResponse> regions) {
        if (regions == null) return List.of();
        
        return regions.stream()
                .map(this::mapRegionToDto)
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<DivisionDto> mapCerclesToDto(List<CercleResponse> cercles) {
        if (cercles == null) return List.of();
        
        return cercles.stream()
                .map(this::mapCercleToDto)
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<DivisionDto> mapCommunesToDto(List<CommuneResponse> communes) {
        if (communes == null) return List.of();
        
        return communes.stream()
                .map(this::mapCommuneToDto)
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<DivisionDto> mapQuartiersToDto(List<QuartierResponse> quartiers) {
        if (quartiers == null) return List.of();
        
        return quartiers.stream()
                .map(this::mapQuartierToDto)
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
}
