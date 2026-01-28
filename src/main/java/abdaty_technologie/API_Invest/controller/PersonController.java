package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.request.PersonCreateRequest;
import abdaty_technologie.API_Invest.dto.request.PersonUpdateRequest;
import abdaty_technologie.API_Invest.dto.response.PersonResponse;
import abdaty_technologie.API_Invest.service.PersonService;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/persons")
public class PersonController {

    @Autowired
    private PersonService personService;

    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PersonResponse> create(@Valid @RequestBody PersonCreateRequest req) {
        return ResponseEntity.ok(personService.create(req));
    }

    @GetMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PersonResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(personService.getById(id));
        
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<PersonResponse>> list() {
        return ResponseEntity.ok(personService.list());
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PersonResponse> update(@PathVariable String id, @Valid @RequestBody PersonUpdateRequest req) {
        // 🔍 DEBUG: Logs pour tracer la réception du champ 'porte' dans le contrôleur
        System.out.println("🔍 [PersonController] PUT /persons/" + id);
        System.out.println("🔍 [PersonController] localite reçu: " + req.localite);
        System.out.println("🔍 [PersonController] porte reçu: " + req.porte);
        
        return ResponseEntity.ok(personService.update(id, req));
    }

    @DeleteMapping(path = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        personService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(path = "/{id}/can-be-manager", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> canBeManager(@PathVariable String id) {
        // Vérifier si la personne est déjà gérant d'une entreprise
        var existingManagerRoles = entrepriseMembreRepository.findByPersonneIdAndRole(id, EntrepriseRole.GERANT);
        
        boolean canBeManager = existingManagerRoles.isEmpty();
        String message = canBeManager ? 
            "Cette personne peut être gérant d'une entreprise" : 
            "Cette personne est déjà gérant d'une autre entreprise";
            
        return ResponseEntity.ok(Map.of(
            "canBeManager", canBeManager,
            "message", message,
            "existingCompanies", existingManagerRoles.size()
        ));
    }
}
