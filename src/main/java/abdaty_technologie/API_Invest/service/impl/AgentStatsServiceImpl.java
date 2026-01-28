package abdaty_technologie.API_Invest.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import abdaty_technologie.API_Invest.service.IAgentStatsService;
import abdaty_technologie.API_Invest.dto.responses.AgentStatsResponse;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import org.springframework.data.domain.PageRequest;

@Service
public class AgentStatsServiceImpl implements IAgentStatsService {

    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private PersonsRepository personsRepository;

    @Override
    public AgentStatsResponse getAgentStats(String agentEmail) {
        try {
            System.out.println("📊 [AgentStatsService] Calcul des statistiques pour: " + agentEmail);
            
            // Récupérer l'agent par email
            var person = personsRepository.findByEmail(agentEmail);
            if (person.isEmpty()) {
                System.out.println("⚠️ [AgentStatsService] Agent non trouvé: " + agentEmail);
                return new AgentStatsResponse(0, 0, 0, 0, 0);
            }
            
            String agentId = person.get().getId();
            System.out.println("📊 [AgentStatsService] Agent ID: " + agentId);
            
            // Compter toutes les entreprises (pour l'instant, on compte toutes les entreprises)
            // TODO: Filtrer selon le rôle de l'agent ou l'étape de validation
            
            // Méthode 1: Compter les entreprises assignées à cet agent
            var assignedEntreprises = entrepriseRepository.findByAssignedToId(agentId, PageRequest.of(0, 1000));
            
            // Méthode 2: Si pas d'entreprises assignées, compter toutes les entreprises
            var allEntreprises = assignedEntreprises.getTotalElements() > 0 ? 
                assignedEntreprises : 
                entrepriseRepository.findAll(PageRequest.of(0, 1000));
                
            System.out.println("📊 [AgentStatsService] Entreprises assignées: " + assignedEntreprises.getTotalElements());
            System.out.println("📊 [AgentStatsService] Utilisation de toutes les entreprises: " + (assignedEntreprises.getTotalElements() == 0));
            
            System.out.println("📊 [AgentStatsService] Entreprises trouvées: " + allEntreprises.getTotalElements());
            
            // Compter par statut de création
            int enCours = 0;
            int valides = 0;
            int enAttente = 0;
            
            for (var entreprise : allEntreprises.getContent()) {
                StatutCreation statut = entreprise.getStatutCreation();
                System.out.println("📊 [AgentStatsService] Entreprise: " + entreprise.getNom() + " - Statut: " + statut);
                
                if (statut != null) {
                    switch (statut) {
                        case EN_COURS:
                            enCours++;
                            break;
                        case VALIDEE:
                            valides++;
                            break;
                        case EN_ATTENTE:
                        case REFUSEE:
                            enAttente++;
                            break;
                        default:
                            // Autres statuts considérés comme en cours
                            enCours++;
                            break;
                    }
                } else {
                    // Si pas de statut défini, considérer comme en cours
                    enCours++;
                }
            }
            
            System.out.println("📊 [AgentStatsService] Statistiques calculées - En cours: " + enCours + 
                             ", Validés: " + valides + ", En attente: " + enAttente);
            
            return new AgentStatsResponse(enCours, valides, enAttente);
            
        } catch (Exception e) {
            System.err.println("❌ [AgentStatsService] Erreur lors du calcul des statistiques: " + e.getMessage());
            e.printStackTrace();
            return new AgentStatsResponse(0, 0, 0, 0, 0);
        }
    }
}
