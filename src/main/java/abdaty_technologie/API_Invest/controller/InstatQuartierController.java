package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.instat.QuartierResponse;
import abdaty_technologie.API_Invest.service.InstatApiService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour résoudre les quartiers par divisionCode complet
 * Endpoint: /api/v1/instat/quartier/{divisionCode}
 */
@RestController
@RequestMapping("/api/v1/instat")
@CrossOrigin(origins = "*")
public class InstatQuartierController {
    
    @Autowired
    private InstatApiService instatApiService;
    
    /**
     * Résoudre un quartier par son divisionCode complet (12 caractères)
     * GET /api/v1/instat/quartier/{divisionCode}
     * 
     * @param divisionCode Code division complet (ex: 900107010001)
     * @return Nom du quartier ou erreur
     */
    @GetMapping("/quartier/{divisionCode}")
    public ResponseEntity<String> getQuartierByDivisionCode(@PathVariable String divisionCode) {
        try {
            System.out.println("[InstatQuartierController] Résolution quartier pour divisionCode: " + divisionCode);
            
            if (divisionCode == null || divisionCode.trim().isEmpty()) {
                System.err.println("[InstatQuartierController] DivisionCode manquant");
                return ResponseEntity.badRequest().body("DivisionCode manquant");
            }
            
            if (divisionCode.length() != 12) {
                System.err.println("[InstatQuartierController] DivisionCode invalide (doit faire 12 caractères): " + divisionCode);
                return ResponseEntity.badRequest().body("DivisionCode invalide (doit faire 12 caractères)");
            }
            
            // Extraire les codes selon le format INSTAT
            String regionCode = divisionCode.substring(0, 2);
            String cercleCode = divisionCode.substring(2, 4);
            String communeCode = divisionCode.substring(0, 8); // Format: RRCCCCCC
            String vfqCode = divisionCode.substring(8);
            
            System.out.println("[InstatQuartierController] Codes extraits - région: " + regionCode + ", cercle: " + cercleCode + ", commune: " + communeCode + ", vfq: " + vfqCode);
            System.out.println("[InstatQuartierController] [INSTAT] Région: " + regionCode + ", Cercle: " + regionCode + cercleCode + ", Commune: " + communeCode + ", Quartier: " + divisionCode);
            
            // Récupérer les quartiers de la commune
            List<QuartierResponse> quartiers = instatApiService.getQuartiersByCommune(communeCode);
            System.out.println("[InstatQuartierController] " + quartiers.size() + " quartiers récupérés pour commune " + communeCode);
            
            // Chercher le quartier correspondant au divisionCode complet
            for (QuartierResponse quartier : quartiers) {
                String quartierCode = String.valueOf(quartier.getCode());
                String quartierNom = quartier.getNom();
                
                System.out.println("[InstatQuartierController] Quartier: " + quartierCode + " -> " + quartierNom);
                
                if (divisionCode.equals(quartierCode)) {
                    System.out.println("[InstatQuartierController] ✅ Quartier trouvé: " + divisionCode + " -> " + quartierNom);
                    return ResponseEntity.ok(quartierNom);
                }
            }
            
            System.out.println("[InstatQuartierController] ❌ Quartier " + divisionCode + " non trouvé dans la liste");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Quartier non trouvé pour le code: " + divisionCode);
            
        } catch (Exception e) {
            System.err.println("[InstatQuartierController] Erreur lors de la résolution du quartier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur interne: " + e.getMessage());
        }
    }
}
