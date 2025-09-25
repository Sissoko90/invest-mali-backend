package abdaty_technologie.API_Invest.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.DivisionType;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import abdaty_technologie.API_Invest.service.IDivisionImportService;


@RestController
@RequestMapping("/divisions")
public class DivisionController {

    @Autowired
    private DivisionsRepository divisionsRepository;

    @Autowired
    private IDivisionImportService divisionImportService;

    /**
     * Import des divisions depuis un fichier Excel
     */
    @PostMapping("/import")
    public ResponseEntity<String> importDivisions(@RequestParam("file") MultipartFile file) {
        try {
            String result = divisionImportService.importDivisionsFromExcel(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Messages.ERROR_PREFIX + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Messages.FILE_PROCESSING_ERROR + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Messages.INTERNAL_ERROR + e.getMessage());
        }
    }

    /**
     * Télécharger le template Excel pour l'import
     */
    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            byte[] template = divisionImportService.generateExcelTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "template_divisions.xlsx");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(template);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer toutes les régions
     */
    @GetMapping("/regions")
    public ResponseEntity<List<Divisions>> getAllRegions() {
        try {
            List<Divisions> regions = divisionsRepository.findByDivisionType(DivisionType.REGION);
            return ResponseEntity.ok(regions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Récupérer les cercles d'une région
     */
    @GetMapping("/regions/{regionId}/cercles")
    public ResponseEntity<List<Divisions>> getCerclesByRegion(@PathVariable String regionId) {
        List<Divisions> cercles = divisionsRepository.findCerclesByRegionId(regionId);
        return ResponseEntity.ok(cercles);
    }

    /**
     * Récupérer les arrondissements d'un cercle
     */
    @GetMapping("/cercles/{cercleId}/arrondissements")
    public ResponseEntity<List<Divisions>> getArrondissementsByCercle(@PathVariable String cercleId) {
        List<Divisions> arrondissements = divisionsRepository.findArrondissementsByCercleId(cercleId);
        return ResponseEntity.ok(arrondissements);
    }

    /**
     * Récupérer les communes d'un arrondissement
     */
    @GetMapping("/arrondissements/{arrondissementId}/communes")
    public ResponseEntity<List<Divisions>> getCommunesByArrondissement(@PathVariable String arrondissementId) {
        List<Divisions> communes = divisionsRepository.findCommunesByArrondissementId(arrondissementId);
        return ResponseEntity.ok(communes);
    }

    /**
     * Récupérer les quartiers d'une commune
     */
    @GetMapping("/communes/{communeId}/quartiers")
    public ResponseEntity<List<Divisions>> getQuartiersByCommune(@PathVariable String communeId) {
        List<Divisions> quartiers = divisionsRepository.findQuartiersByCommuneId(communeId);
        return ResponseEntity.ok(quartiers);
    }

    /**
     * Compter le nombre total de divisions
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countDivisions() {
        long count = divisionsRepository.count();
        return ResponseEntity.ok(count);
    }

    /**
     * Récupérer toutes les divisions (limité à 10 pour éviter les timeouts)
     */
    @GetMapping
    public ResponseEntity<List<Divisions>> getAllDivisions() {
        List<Divisions> divisions = divisionsRepository.findAll().stream().limit(10).toList();
        return ResponseEntity.ok(divisions);
    }

    /**
     * Récupérer une division par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Divisions> getDivisionById(@PathVariable String id) {
        return divisionsRepository.findById(id)
                .map(division -> ResponseEntity.ok(division))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Récupérer une division par son code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<Divisions> getDivisionByCode(@PathVariable String code) {
        return divisionsRepository.findByCode(code)
                .map(division -> ResponseEntity.ok(division))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Récupérer les arrondissements directement depuis une région (pour Bamako District)
     */
    @GetMapping("/regions/{regionId}/arrondissements")
    public ResponseEntity<List<Divisions>> getArrondissementsByRegion(@PathVariable String regionId) {
        System.out.println("[DivisionController] Recherche arrondissements pour regionId: " + regionId);
        List<Divisions> arrondissements = divisionsRepository.findArrondissementsByRegionId(regionId);
        System.out.println("[DivisionController] Arrondissements trouvés: " + arrondissements.size());
        
        // Debug: afficher les arrondissements trouvés
        for (Divisions arr : arrondissements) {
            System.out.println("[DivisionController] - Arrondissement: " + arr.getNom() + " (ID: " + arr.getId() + ")");
        }
        
        return ResponseEntity.ok(arrondissements);
    }
    
    /**
     * Récupérer les quartiers directement depuis un arrondissement (pour Bamako District)
     */
    @GetMapping("/arrondissements/{arrondissementId}/quartiers")
    public ResponseEntity<List<Divisions>> getQuartiersByArrondissement(@PathVariable String arrondissementId) {
        System.out.println("[DivisionController] Recherche quartiers pour arrondissementId: " + arrondissementId);
        
        // Vérifier d'abord que l'arrondissement existe
        Optional<Divisions> arrondissement = divisionsRepository.findById(arrondissementId);
        if (arrondissement.isPresent()) {
            System.out.println("[DivisionController] Arrondissement trouvé: " + arrondissement.get().getNom());
            System.out.println("[DivisionController] Code arrondissement: " + arrondissement.get().getCode());
        } else {
            System.out.println("[DivisionController] ERREUR: Arrondissement non trouvé avec ID: " + arrondissementId);
        }
        
        // Rechercher les quartiers
        List<Divisions> quartiers = divisionsRepository.findQuartiersByArrondissementId(arrondissementId);
        System.out.println("[DivisionController] Quartiers trouvés directement: " + quartiers.size());
        
        // Si aucun quartier direct, essayer de chercher tous les enfants
        if (quartiers.isEmpty()) {
            System.out.println("[DivisionController] Aucun quartier direct, recherche de tous les enfants...");
            List<Divisions> enfants = divisionsRepository.findByParentId(arrondissementId);
            System.out.println("[DivisionController] Enfants trouvés: " + enfants.size());
            
            for (Divisions enfant : enfants) {
                System.out.println("[DivisionController] - Enfant: " + enfant.getNom() + " (Type: " + enfant.getDivisionType() + ", Code: " + enfant.getCode() + ")");
            }
            
            // Retourner tous les enfants comme quartiers
            return ResponseEntity.ok(enfants);
        }
        
        // Debug: afficher les quartiers trouvés
        for (Divisions quartier : quartiers) {
            System.out.println("[DivisionController] - Quartier: " + quartier.getNom() + " (Code: " + quartier.getCode() + ")");
        }
        
        return ResponseEntity.ok(quartiers);
    }
    
    /**
     * Debug: Récupérer toutes les divisions enfants d'une région
     */
    @GetMapping("/debug/regions/{regionId}/children")
    public ResponseEntity<List<Divisions>> getChildrenByRegion(@PathVariable String regionId) {
        System.out.println("[DEBUG] Recherche de tous les enfants pour regionId: " + regionId);
        List<Divisions> children = divisionsRepository.findByParentId(regionId);
        System.out.println("[DEBUG] Enfants trouvés: " + children.size());
        
        for (Divisions child : children) {
            System.out.println("[DEBUG] - Enfant: " + child.getNom() + " (Type: " + child.getDivisionType() + ", ID: " + child.getId() + ")");
        }
        
        return ResponseEntity.ok(children);
    }
    
    /**
     * Debug: Rechercher toutes les divisions contenant "bamako" dans le nom
     */
    @GetMapping("/debug/search/bamako")
    public ResponseEntity<List<Divisions>> searchBamakoDivisions() {
        System.out.println("[DEBUG] Recherche de toutes les divisions contenant 'bamako'");
        List<Divisions> bamakoDivisions = divisionsRepository.findByNomContainingIgnoreCase("bamako");
        System.out.println("[DEBUG] Divisions Bamako trouvées: " + bamakoDivisions.size());
        
        for (Divisions div : bamakoDivisions) {
            String parentInfo = div.getParent() != null ? 
                " (Parent: " + div.getParent().getNom() + ", ID: " + div.getParent().getId() + ")" : " (Pas de parent)";
            System.out.println("[DEBUG] - Division: " + div.getNom() + " (Type: " + div.getDivisionType() + ", ID: " + div.getId() + ")" + parentInfo);
        }
        
        return ResponseEntity.ok(bamakoDivisions);
    }
    
    /**
     * Debug: Rechercher tous les arrondissements dans la base
     */
    @GetMapping("/debug/arrondissements")
    public ResponseEntity<List<Divisions>> getAllArrondissements() {
        System.out.println("[DEBUG] Recherche de tous les arrondissements");
        List<Divisions> arrondissements = divisionsRepository.findByDivisionType(DivisionType.ARRONDISSEMENT);
        System.out.println("[DEBUG] Arrondissements trouvés: " + arrondissements.size());
        
        for (Divisions arr : arrondissements) {
            String parentInfo = arr.getParent() != null ? 
                " (Parent: " + arr.getParent().getNom() + ", Type: " + arr.getParent().getDivisionType() + ")" : " (Pas de parent)";
            System.out.println("[DEBUG] - Arrondissement: " + arr.getNom() + " (ID: " + arr.getId() + ")" + parentInfo);
        }
        
        return ResponseEntity.ok(arrondissements);
    }
    
    /**
     * Debug: Rechercher tous les quartiers dans la base
     */
    @GetMapping("/debug/quartiers")
    public ResponseEntity<List<Divisions>> getAllQuartiers() {
        System.out.println("[DEBUG] Recherche de tous les quartiers");
        List<Divisions> quartiers = divisionsRepository.findByDivisionType(DivisionType.QUARTIER);
        System.out.println("[DEBUG] Quartiers trouvés: " + quartiers.size());
        
        for (Divisions quartier : quartiers) {
            String parentInfo = quartier.getParent() != null ? 
                " (Parent: " + quartier.getParent().getNom() + ", Type: " + quartier.getParent().getDivisionType() + ")" : " (Pas de parent)";
            System.out.println("[DEBUG] - Quartier: " + quartier.getNom() + " (ID: " + quartier.getId() + ")" + parentInfo);
        }
        
        return ResponseEntity.ok(quartiers);
    }
    
    /**
     * Debug: Analyser la structure complète de Bamako
     */
    @GetMapping("/debug/bamako/structure")
    public ResponseEntity<String> analyzeBamakoStructure() {
        System.out.println("[DEBUG] ========== ANALYSE STRUCTURE BAMAKO ==========");
        
        // 1. Trouver Bamako District
        List<Divisions> bamakoRegions = divisionsRepository.findByNomContainingIgnoreCase("bamako");
        System.out.println("[DEBUG] Divisions contenant 'bamako': " + bamakoRegions.size());
        
        Divisions bamakoDistrict = null;
        for (Divisions region : bamakoRegions) {
            System.out.println("[DEBUG] - " + region.getNom() + " (Type: " + region.getDivisionType() + ", Code: " + region.getCode() + ")");
            if (region.getNom().toLowerCase().contains("district")) {
                bamakoDistrict = region;
                System.out.println("[DEBUG] >>> BAMAKO DISTRICT TROUVÉ: " + region.getId());
            }
        }
        
        if (bamakoDistrict == null) {
            return ResponseEntity.ok("Bamako District non trouvé");
        }
        
        // 2. Analyser les arrondissements de Bamako
        List<Divisions> arrondissements = divisionsRepository.findArrondissementsByRegionId(bamakoDistrict.getId());
        System.out.println("[DEBUG] Arrondissements de Bamako trouvés: " + arrondissements.size());
        
        for (Divisions arr : arrondissements) {
            System.out.println("[DEBUG] === ARRONDISSEMENT: " + arr.getNom() + " (ID: " + arr.getId() + ", Code: " + arr.getCode() + ") ===");
            
            // 3. Chercher les quartiers de cet arrondissement
            List<Divisions> quartiersDirects = divisionsRepository.findQuartiersByArrondissementId(arr.getId());
            System.out.println("[DEBUG]   Quartiers directs: " + quartiersDirects.size());
            
            // 4. Chercher tous les enfants de cet arrondissement
            List<Divisions> enfants = divisionsRepository.findByParentId(arr.getId());
            System.out.println("[DEBUG]   Enfants totaux: " + enfants.size());
            
            for (Divisions enfant : enfants) {
                System.out.println("[DEBUG]     - Enfant: " + enfant.getNom() + " (Type: " + enfant.getDivisionType() + ", Code: " + enfant.getCode() + ")");
            }
            
            // 5. Chercher les quartiers par code (basé sur votre capture d'écran)
            String arrCode = arr.getCode();
            if (arrCode != null && arrCode.length() >= 4) {
                String codePrefix = arrCode.substring(0, 4); // Ex: "0003" pour Premier Arrondissement
                List<Divisions> tousQuartiers = divisionsRepository.findByDivisionType(DivisionType.QUARTIER);
                int quartiersParCode = 0;
                
                for (Divisions quartier : tousQuartiers) {
                    if (quartier.getCode() != null && quartier.getCode().startsWith(codePrefix)) {
                        quartiersParCode++;
                        System.out.println("[DEBUG]     * Quartier par code: " + quartier.getNom() + " (Code: " + quartier.getCode() + ", Parent: " + 
                            (quartier.getParent() != null ? quartier.getParent().getNom() : "Aucun") + ")");
                    }
                }
                System.out.println("[DEBUG]   Quartiers trouvés par code " + codePrefix + ": " + quartiersParCode);
            }
        }
        
        return ResponseEntity.ok("Analyse terminée - voir logs console");
    }
    
    /**
     * Récupérer les quartiers par code d'arrondissement (solution de contournement pour Bamako)
     */
    @GetMapping("/arrondissements/{arrondissementId}/quartiers/by-code")
    public ResponseEntity<List<Divisions>> getQuartiersByArrondissementCode(@PathVariable String arrondissementId) {
        System.out.println("[DivisionController] Recherche quartiers par code pour arrondissementId: " + arrondissementId);
        
        // Récupérer l'arrondissement pour obtenir son code
        Optional<Divisions> arrondissement = divisionsRepository.findById(arrondissementId);
        if (!arrondissement.isPresent()) {
            System.out.println("[DivisionController] Arrondissement non trouvé");
            return ResponseEntity.ok(List.of());
        }
        
        String arrCode = arrondissement.get().getCode();
        String arrNom = arrondissement.get().getNom();
        System.out.println("[DivisionController] Arrondissement: " + arrNom + " (Code: " + arrCode + ")");
        
        if (arrCode == null || arrCode.length() < 4) {
            System.out.println("[DivisionController] Code arrondissement invalide");
            return ResponseEntity.ok(List.of());
        }
        
        // Extraire le préfixe du code (ex: "0003" pour Premier Arrondissement)
        String codePrefix = arrCode.substring(0, 4);
        System.out.println("[DivisionController] Recherche quartiers avec préfixe: " + codePrefix);
        
        // Chercher tous les quartiers avec ce préfixe
        List<Divisions> tousQuartiers = divisionsRepository.findByDivisionType(DivisionType.QUARTIER);
        List<Divisions> quartiersCorrespondants = new ArrayList<>();
        
        for (Divisions quartier : tousQuartiers) {
            if (quartier.getCode() != null && quartier.getCode().startsWith(codePrefix)) {
                quartiersCorrespondants.add(quartier);
                System.out.println("[DivisionController] - Quartier trouvé: " + quartier.getNom() + " (Code: " + quartier.getCode() + ")");
            }
        }
        
        System.out.println("[DivisionController] Total quartiers trouvés par code: " + quartiersCorrespondants.size());
        return ResponseEntity.ok(quartiersCorrespondants);
    }
}
