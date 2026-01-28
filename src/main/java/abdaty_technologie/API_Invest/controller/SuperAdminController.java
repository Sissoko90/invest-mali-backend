package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.service.PersonsService;
import abdaty_technologie.API_Invest.dto.requests.CreateAgentRequest;
import abdaty_technologie.API_Invest.dto.response.AgentResponse;

import jakarta.validation.Valid;
import java.util.*;

@RestController
@RequestMapping("/api/v1/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    @Autowired
    private PersonsService personsService;

    /**
     * Créer un nouvel agent avec rôle et antenne
     */
    @PostMapping("/agents")
    public ResponseEntity<AgentResponse> createAgent(@RequestBody @Valid CreateAgentRequest request) {
        try {
            Persons agent = personsService.createAgent(request);
            
            AgentResponse response = new AgentResponse();
            response.setId(agent.getId());
            response.setNom(agent.getNom());
            response.setPrenom(agent.getPrenom());
            response.setEmail(agent.getEmail());
            response.setTelephone1(agent.getTelephone1());
            response.setRole(agent.getRole());
            response.setAntenneAgent(agent.getAntenneAgent());
            response.setEstAutoriser(agent.getEstAutoriser());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la création de l'agent: " + e.getMessage());
        }
    }

    /**
     * Lister tous les agents avec pagination
     */
    @GetMapping("/agents")
    public ResponseEntity<Map<String, Object>> getAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String antenne,
            @RequestParam(required = false) String role) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? 
                Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<Persons> agentsPage = personsService.getAgentsByFilters(pageable, antenne, role);
            
            List<AgentResponse> agents = new ArrayList<>();
            for (Persons agent : agentsPage.getContent()) {
                AgentResponse response = new AgentResponse();
                response.setId(agent.getId());
                response.setNom(agent.getNom());
                response.setPrenom(agent.getPrenom());
                response.setEmail(agent.getEmail());
                response.setTelephone1(agent.getTelephone1());
                response.setRole(agent.getRole());
                response.setAntenneAgent(agent.getAntenneAgent());
                response.setEstAutoriser(agent.getEstAutoriser());
                response.setCreation(agent.getCreation());
                agents.add(response);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("agents", agents);
            result.put("totalElements", agentsPage.getTotalElements());
            result.put("totalPages", agentsPage.getTotalPages());
            result.put("currentPage", page);
            result.put("size", size);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération des agents: " + e.getMessage());
        }
    }

    /**
     * Mettre à jour un agent
     */
    @PutMapping("/agents/{id}")
    public ResponseEntity<AgentResponse> updateAgent(
            @PathVariable String id, 
            @RequestBody @Valid CreateAgentRequest request) {
        
        try {
            Persons agent = personsService.updateAgent(id, request);
            
            AgentResponse response = new AgentResponse();
            response.setId(agent.getId());
            response.setNom(agent.getNom());
            response.setPrenom(agent.getPrenom());
            response.setEmail(agent.getEmail());
            response.setTelephone1(agent.getTelephone1());
            response.setRole(agent.getRole());
            response.setAntenneAgent(agent.getAntenneAgent());
            response.setEstAutoriser(agent.getEstAutoriser());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la mise à jour de l'agent: " + e.getMessage());
        }
    }

    /**
     * Activer/Désactiver un agent
     */
    @PatchMapping("/agents/{id}/status")
    public ResponseEntity<Map<String, Object>> toggleAgentStatus(@PathVariable String id) {
        try {
            Persons agent = personsService.toggleAgentStatus(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statut de l'agent mis à jour");
            response.put("agentId", id);
            response.put("newStatus", agent.getEstAutoriser());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la mise à jour du statut: " + e.getMessage());
        }
    }

    /**
     * Supprimer un agent
     */
    @DeleteMapping("/agents/{id}")
    public ResponseEntity<Map<String, Object>> deleteAgent(@PathVariable String id) {
        try {
            personsService.deleteAgent(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Agent supprimé avec succès");
            response.put("agentId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la suppression de l'agent: " + e.getMessage());
        }
    }

    /**
     * Obtenir les statistiques des agents
     */
    @GetMapping("/agents/stats")
    public ResponseEntity<Map<String, Object>> getAgentsStats() {
        try {
            Map<String, Object> stats = personsService.getAgentsStatistics();
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération des statistiques: " + e.getMessage());
        }
    }

    /**
     * Obtenir la liste des antennes disponibles
     */
    @GetMapping("/antennes")
    public ResponseEntity<List<Map<String, String>>> getAntennes() {
        List<Map<String, String>> antennes = new ArrayList<>();
        
        for (AntenneAgents antenne : AntenneAgents.values()) {
            Map<String, String> antenneMap = new HashMap<>();
            antenneMap.put("code", antenne.name());
            antenneMap.put("nom", antenne.getValue());
            antennes.add(antenneMap);
        }
        
        return ResponseEntity.ok(antennes);
    }

    /**
     * Obtenir la liste des rôles d'agents disponibles
     */
    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, String>>> getRoles() {
        List<Map<String, String>> roles = new ArrayList<>();
        
        // Filtrer pour ne montrer que les rôles d'agents (pas USER ni SUPER_ADMIN)
        for (Roles role : Roles.values()) {
            if (role.name().startsWith("AGENT_")) {
                Map<String, String> roleMap = new HashMap<>();
                roleMap.put("code", role.name());
                roleMap.put("nom", role.getValue());
                roles.add(roleMap);
            }
        }
        
        return ResponseEntity.ok(roles);
    }
}
