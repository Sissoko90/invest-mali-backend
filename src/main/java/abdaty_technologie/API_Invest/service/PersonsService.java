package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.dto.requests.CreateAgentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;

public interface PersonsService {
    
    /**
     * Créer un nouvel agent
     */
    Persons createAgent(CreateAgentRequest request);
    
    /**
     * Mettre à jour un agent existant
     */
    Persons updateAgent(String id, CreateAgentRequest request);
    
    /**
     * Obtenir les agents avec filtres
     */
    Page<Persons> getAgentsByFilters(Pageable pageable, String antenne, String role);
    
    /**
     * Activer/Désactiver un agent
     */
    Persons toggleAgentStatus(String id);
    
    /**
     * Supprimer un agent
     */
    void deleteAgent(String id);
    
    /**
     * Obtenir les statistiques des agents
     */
    Map<String, Object> getAgentsStatistics();
    
    /**
     * Vérifier si un agent peut voir une entreprise selon son antenne
     */
    boolean canAgentViewEntreprise(String agentId, String entrepriseId);
    
    /**
     * Obtenir un agent par son ID
     */
    Persons getAgentById(String id);
    
    /**
     * Récupérer toutes les antennes assignées à un agent
     */
    List<AntenneAgents> getAgentAntennes(String agentId);
}
