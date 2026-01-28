package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class TestStatsController {

    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private PersonsRepository personsRepository;

    @GetMapping("/stats-debug")
    public ResponseEntity<Map<String, Object>> debugStats() {
        Map<String, Object> debug = new HashMap<>();
        
        try {
            // Compter toutes les entreprises
            long totalEntreprises = entrepriseRepository.count();
            debug.put("totalEntreprises", totalEntreprises);
            
            // Lister quelques entreprises pour debug
            var entreprises = entrepriseRepository.findAll();
            debug.put("entreprisesCount", entreprises.size());
            
            // Détails des premières entreprises
            var premieres = entreprises.stream().limit(5).map(e -> {
                Map<String, Object> info = new HashMap<>();
                info.put("nom", e.getNom());
                info.put("statut", e.getStatutCreation());
                info.put("assignedTo", e.getAssignedTo() != null ? e.getAssignedTo().getId() : null);
                return info;
            }).toList();
            debug.put("premieresEntreprises", premieres);
            
            // Compter les personnes
            long totalPersons = personsRepository.count();
            debug.put("totalPersons", totalPersons);
            
            return ResponseEntity.ok(debug);
            
        } catch (Exception e) {
            debug.put("error", e.getMessage());
            return ResponseEntity.ok(debug);
        }
    }
}
