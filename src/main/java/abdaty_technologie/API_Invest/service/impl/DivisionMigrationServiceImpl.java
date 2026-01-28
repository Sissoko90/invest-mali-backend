package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.dto.DivisionDto;
import abdaty_technologie.API_Invest.dto.instat.RegionResponse;
import abdaty_technologie.API_Invest.dto.instat.CercleResponse;
import abdaty_technologie.API_Invest.dto.instat.CommuneResponse;
import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;
import abdaty_technologie.API_Invest.service.DivisionMigrationService;
import abdaty_technologie.API_Invest.service.InstatApiService;
import abdaty_technologie.API_Invest.service.DivisionMappingService;
import abdaty_technologie.API_Invest.config.InstatApiConfig;

// Import pour l'ancien système (fallback)
import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de migration pour basculer progressivement de l'ancien système
 * basé sur la table divisions vers l'API INSTAT Mali
 */
@Service
public class DivisionMigrationServiceImpl implements DivisionMigrationService {
    
    @Autowired
    private InstatApiService instatApiService;
    
    @Autowired
    private DivisionMappingService mappingService;
    
    @Autowired
    private InstatApiConfig config;
    
    @Autowired
    private DivisionsRepository divisionsRepository; // Fallback vers l'ancien système
    
    @Override
    public boolean isInstatApiAvailable() {
        if (!config.isEnabled()) {
            System.out.println("[DivisionMigration] API INSTAT désactivée par configuration");
            return false;
        }
        
        try {
            List<RegionResponse> regions = instatApiService.getAllRegions();
            boolean available = regions != null && !regions.isEmpty();
            System.out.println("[DivisionMigration] API INSTAT " + (available ? "disponible" : "indisponible"));
            return available;
        } catch (Exception e) {
            System.err.println("[DivisionMigration] API INSTAT indisponible: " + e.getMessage());
            return false;
        }
    }
    
    @Override
    public List<DivisionDto> getRegionsWithFallback() {
        try {
            if (isInstatApiAvailable()) {
                System.out.println("[DivisionMigration] Utilisation API INSTAT pour les régions");
                List<RegionResponse> regions = instatApiService.getAllRegions();
                return mappingService.mapRegionsToDto(regions);
            }
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur API INSTAT, fallback vers table divisions: " + e.getMessage());
        }
        
        // Fallback vers l'ancien système
        System.out.println("[DivisionMigration] Fallback vers table divisions pour les régions");
        return getRegionsFromDatabase();
    }
    
    @Override
    public List<DivisionDto> getCerclesWithFallback(String regionCode) {
        try {
            if (isInstatApiAvailable()) {
                System.out.println("[DivisionMigration] Utilisation API INSTAT pour les cercles");
                List<CercleResponse> cercles = instatApiService.getCerclesByRegion(regionCode);
                return mappingService.mapCerclesToDto(cercles);
            }
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur API INSTAT, fallback vers table divisions: " + e.getMessage());
        }
        
        // Fallback vers l'ancien système
        System.out.println("[DivisionMigration] Fallback vers table divisions pour les cercles");
        return getCerclesFromDatabase(regionCode);
    }
    
    @Override
    public List<DivisionDto> getCommunesWithFallback(String cercleCode) {
        try {
            if (isInstatApiAvailable()) {
                System.out.println("[DivisionMigration] Utilisation API INSTAT pour les communes");
                List<CommuneResponse> communes = instatApiService.getCommunesByCercle(cercleCode);
                return mappingService.mapCommunesToDto(communes);
            }
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur API INSTAT, fallback vers table divisions: " + e.getMessage());
        }
        
        // Fallback vers l'ancien système
        System.out.println("[DivisionMigration] Fallback vers table divisions pour les communes");
        return getCommunesFromDatabase(cercleCode);
    }
    
    @Override
    public List<DivisionDto> getQuartiersWithFallback(String communeCode) {
        try {
            if (isInstatApiAvailable()) {
                System.out.println("[DivisionMigration] Utilisation API INSTAT pour les quartiers");
                List<QuartierResponse> quartiers = instatApiService.getQuartiersByCommune(communeCode);
                return mappingService.mapQuartiersToDto(quartiers);
            }
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur API INSTAT, fallback vers table divisions: " + e.getMessage());
        }
        
        // Fallback vers l'ancien système
        System.out.println("[DivisionMigration] Fallback vers table divisions pour les quartiers");
        return getQuartiersFromDatabase(communeCode);
    }
    
    @Override
    public List<DivisionDto> searchDivisionsWithFallback(String query, String type) {
        try {
            if (isInstatApiAvailable()) {
                System.out.println("[DivisionMigration] Utilisation API INSTAT pour la recherche");
                // Implémentation de recherche via API INSTAT
                return searchViaInstatApi(query, type);
            }
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur API INSTAT, fallback vers table divisions: " + e.getMessage());
        }
        
        // Fallback vers l'ancien système
        System.out.println("[DivisionMigration] Fallback vers table divisions pour la recherche");
        return searchInDatabase(query, type);
    }
    
    @Override
    public DivisionDto getDivisionByCodeWithFallback(String code) {
        try {
            if (isInstatApiAvailable()) {
                System.out.println("[DivisionMigration] Utilisation API INSTAT pour recherche par code");
                return findByCodeViaInstatApi(code);
            }
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur API INSTAT, fallback vers table divisions: " + e.getMessage());
        }
        
        // Fallback vers l'ancien système
        System.out.println("[DivisionMigration] Fallback vers table divisions pour recherche par code");
        return findByCodeInDatabase(code);
    }
    
    // === MÉTHODES DE FALLBACK VERS L'ANCIEN SYSTÈME ===
    
    private List<DivisionDto> getRegionsFromDatabase() {
        try {
            List<Divisions> regions = divisionsRepository.findByDivisionType(abdaty_technologie.API_Invest.Entity.Enum.DivisionType.REGION);
            return convertDivisionsToDto(regions);
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur fallback régions: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    private List<DivisionDto> getCerclesFromDatabase(String regionCode) {
        try {
            // Trouver la région par code puis ses cercles
            // Cette logique dépend de votre implémentation actuelle
            return new ArrayList<>(); // TODO: Implémenter selon votre logique actuelle
        } catch (Exception e) {
            System.err.println("[DivisionMigration] Erreur fallback cercles: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    private List<DivisionDto> getCommunesFromDatabase(String cercleCode) {
        // TODO: Implémenter selon votre logique actuelle
        return new ArrayList<>();
    }
    
    private List<DivisionDto> getQuartiersFromDatabase(String communeCode) {
        // TODO: Implémenter selon votre logique actuelle
        return new ArrayList<>();
    }
    
    private List<DivisionDto> searchInDatabase(String query, String type) {
        // TODO: Implémenter selon votre logique actuelle de recherche
        return new ArrayList<>();
    }
    
    private DivisionDto findByCodeInDatabase(String code) {
        // TODO: Implémenter selon votre logique actuelle
        return null;
    }
    
    // === MÉTHODES UTILITAIRES ===
    
    private List<DivisionDto> convertDivisionsToDto(List<Divisions> divisions) {
        return divisions.stream()
                .map(this::convertDivisionToDto)
                .collect(Collectors.toList());
    }
    
    private DivisionDto convertDivisionToDto(Divisions division) {
        DivisionDto dto = new DivisionDto();
        dto.setId(division.getId());
        dto.setCode(division.getCode());
        dto.setNom(division.getNom());
        dto.setLibelle(division.getNom());
        dto.setType(division.getDivisionType().name());
        
        if (division.getParent() != null) {
            dto.setParentId(division.getParent().getId());
            dto.setParentCode(division.getParent().getCode());
            dto.setParentNom(division.getParent().getNom());
        }
        
        return dto;
    }
    
    private List<DivisionDto> searchViaInstatApi(String query, String type) {
        // Implémentation simplifiée de recherche via API INSTAT
        List<DivisionDto> results = new ArrayList<>();
        
        if (type == null || type.equalsIgnoreCase("REGION")) {
            List<RegionResponse> regions = instatApiService.getAllRegions();
            results.addAll(regions.stream()
                .filter(r -> r.getNom() != null && r.getNom().toLowerCase().contains(query.toLowerCase()))
                .map(mappingService::mapRegionToDto)
                .collect(Collectors.toList()));
        }
        
        return results.stream().limit(20).collect(Collectors.toList());
    }
    
    private DivisionDto findByCodeViaInstatApi(String code) {
        // Recherche par code via API INSTAT
        List<RegionResponse> regions = instatApiService.getAllRegions();
        for (RegionResponse region : regions) {
            if (code.equals(region.getCode())) {
                return mappingService.mapRegionToDto(region);
            }
        }
        return null;
    }
}
