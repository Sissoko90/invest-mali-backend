package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.PersonAntenne;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.dto.requests.CreateAgentRequest;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.PersonAntenneRepository;
import abdaty_technologie.API_Invest.service.PersonsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.*;

@Service
@Transactional
public class PersonsServiceImpl implements PersonsService {

    @Autowired
    private PersonsRepository personsRepository;
    
    @Autowired
    private PersonAntenneRepository personAntenneRepository;
    

    @Override
    public Persons createAgent(CreateAgentRequest request) {
        // Vérifier que l'email n'existe pas déjà
        if (request.getEmail() != null && personsRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un agent avec cet email existe déjà");
        }
        
        // Vérifier que le téléphone n'existe pas déjà
        if (personsRepository.existsByTelephone1(request.getTelephone1())) {
            throw new RuntimeException("Un agent avec ce numéro de téléphone existe déjà");
        }
        
        // Vérifier que le rôle est bien un rôle d'agent
        if (!request.getRole().name().startsWith("AGENT_") && request.getRole() != Roles.SUPER_ADMIN) {
            throw new RuntimeException("Le rôle spécifié n'est pas un rôle d'agent valide");
        }
        
        Persons agent = new Persons();
        agent.setNom(request.getNom());
        agent.setPrenom(request.getPrenom());
        agent.setEmail(request.getEmail());
        agent.setTelephone1(request.getTelephone1());
        agent.setTelephone2(request.getTelephone2());
        agent.setRole(request.getRole());
        agent.setAntenneAgent(request.getAntenneAgent());
        agent.setDateNaissance(request.getDateNaissance());
        agent.setLieuNaissance(request.getLieuNaissance());
        agent.setLocalite(request.getLocalite());
        agent.setCivilite(request.getCivilite());
        agent.setSexe(request.getSexe());
        agent.setNationalite(request.getNationalite());
        agent.setEstAutoriser(request.getEstAutoriser());
        
        return personsRepository.save(agent);
    }

    @Override
    public Persons updateAgent(String id, CreateAgentRequest request) {
        Persons agent = personsRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé avec l'ID: " + id));
        
        // Vérifier que l'email n'existe pas déjà (sauf pour cet agent)
        if (request.getEmail() != null && 
            personsRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new RuntimeException("Un autre agent avec cet email existe déjà");
        }
        
        // Vérifier que le téléphone n'existe pas déjà (sauf pour cet agent)
        if (personsRepository.existsByTelephone1AndIdNot(request.getTelephone1(), id)) {
            throw new RuntimeException("Un autre agent avec ce numéro de téléphone existe déjà");
        }
        
        agent.setNom(request.getNom());
        agent.setPrenom(request.getPrenom());
        agent.setEmail(request.getEmail());
        agent.setTelephone1(request.getTelephone1());
        agent.setTelephone2(request.getTelephone2());
        agent.setRole(request.getRole());
        agent.setAntenneAgent(request.getAntenneAgent());
        agent.setDateNaissance(request.getDateNaissance());
        agent.setLieuNaissance(request.getLieuNaissance());
        agent.setLocalite(request.getLocalite());
        agent.setCivilite(request.getCivilite());
        agent.setSexe(request.getSexe());
        agent.setNationalite(request.getNationalite());
        agent.setEstAutoriser(request.getEstAutoriser());
        
        return personsRepository.save(agent);
    }

    @Override
    public Page<Persons> getAgentsByFilters(Pageable pageable, String antenne, String role) {
        Specification<Persons> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filtrer seulement les agents (pas les utilisateurs normaux)
            Predicate agentRolePredicate = criteriaBuilder.or(
                criteriaBuilder.like(root.get("role").as(String.class), "AGENT_%"),
                criteriaBuilder.equal(root.get("role"), Roles.SUPER_ADMIN)
            );
            predicates.add(agentRolePredicate);
            
            // Filtre par antenne
            if (antenne != null && !antenne.isEmpty()) {
                try {
                    AntenneAgents antenneEnum = AntenneAgents.valueOf(antenne);
                    predicates.add(criteriaBuilder.equal(root.get("antenneAgent"), antenneEnum));
                } catch (IllegalArgumentException e) {
                    // Antenne invalide, ignorer le filtre
                }
            }
            
            // Filtre par rôle
            if (role != null && !role.isEmpty()) {
                try {
                    Roles roleEnum = Roles.valueOf(role);
                    predicates.add(criteriaBuilder.equal(root.get("role"), roleEnum));
                } catch (IllegalArgumentException e) {
                    // Rôle invalide, ignorer le filtre
                }
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        return personsRepository.findAll(spec, pageable);
    }

    @Override
    public Persons toggleAgentStatus(String id) {
        Persons agent = personsRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé avec l'ID: " + id));
        
        agent.setEstAutoriser(!agent.getEstAutoriser());
        return personsRepository.save(agent);
    }

    @Override
    public void deleteAgent(String id) {
        Persons agent = personsRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé avec l'ID: " + id));
        
        // Vérifier qu'on ne supprime pas le dernier super admin
        if (agent.getRole() == Roles.SUPER_ADMIN) {
            long superAdminCount = personsRepository.countByRole(Roles.SUPER_ADMIN);
            if (superAdminCount <= 1) {
                throw new RuntimeException("Impossible de supprimer le dernier super administrateur");
            }
        }
        
        personsRepository.delete(agent);
    }

    @Override
    public Map<String, Object> getAgentsStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Nombre total d'agents
        long totalAgents = personsRepository.countByRoleStartingWith("AGENT_");
        stats.put("totalAgents", totalAgents);
        
        // Nombre d'agents actifs
        long activeAgents = personsRepository.countByRoleStartingWithAndEstAutoriser("AGENT_", true);
        stats.put("activeAgents", activeAgents);
        
        // Nombre d'agents inactifs
        long inactiveAgents = totalAgents - activeAgents;
        stats.put("inactiveAgents", inactiveAgents);
        
        // Répartition par antenne
        Map<String, Long> agentsByAntenne = new HashMap<>();
        for (AntenneAgents antenne : AntenneAgents.values()) {
            long count = personsRepository.countByAntenneAgent(antenne);
            agentsByAntenne.put(antenne.getValue(), count);
        }
        stats.put("agentsByAntenne", agentsByAntenne);
        
        // Répartition par rôle
        Map<String, Long> agentsByRole = new HashMap<>();
        for (Roles role : Roles.values()) {
            if (role.name().startsWith("AGENT_") || role == Roles.SUPER_ADMIN) {
                long count = personsRepository.countByRole(role);
                agentsByRole.put(role.getValue(), count);
            }
        }
        stats.put("agentsByRole", agentsByRole);
        
        return stats;
    }

    @Override
    public boolean canAgentViewEntreprise(String agentId, String entrepriseId) {
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
        
        // Les super admins peuvent voir toutes les entreprises
        if (agent.getRole() == Roles.SUPER_ADMIN) {
            return true;
        }
        
        // Récupérer toutes les antennes de l'agent
        List<PersonAntenne> agentAntennes = personAntenneRepository.findByPersonAndActifTrue(agent);
        
        // Si l'agent n'a pas d'antennes assignées, utiliser l'antenne principale
        if (agentAntennes.isEmpty() && agent.getAntenneAgent() != null) {
            // Logique basée sur l'antenne principale
            // TODO: Comparer avec la localisation de l'entreprise
            System.out.println("🔍 [PersonsService] Agent " + agentId + " utilise antenne principale: " + agent.getAntenneAgent().name());
            return true; // Temporaire - à implémenter selon la logique métier
        }
        
        // Vérifier si l'entreprise correspond à une des antennes de l'agent
        for (PersonAntenne agentAntenne : agentAntennes) {
            AntenneAgents antenne = agentAntenne.getAntenne();
            System.out.println("🔍 [PersonsService] Agent " + agentId + " a accès à l'antenne: " + antenne.name());
            
            // TODO: Comparer avec la localisation de l'entreprise
            // Par exemple, si l'entreprise a un champ 'localisation' ou 'antenne'
            // if (entreprise.getLocalisation().equals(antenne.getValue())) {
            //     return true;
            // }
        }
        
        System.out.println("✅ [PersonsService] Agent " + agentId + " peut voir l'entreprise " + entrepriseId + " (antennes multiples)");
        return true; // Temporaire - autoriser l'accès pour toutes les antennes de l'agent
    }

    @Override
    public Persons getAgentById(String id) {
        return personsRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé avec l'ID: " + id));
    }
    
    @Override
    public List<AntenneAgents> getAgentAntennes(String agentId) {
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé avec l'ID: " + agentId));
        
        // Récupérer toutes les antennes assignées à l'agent
        List<PersonAntenne> personAntennes = personAntenneRepository.findByPersonAndActifTrue(agent);
        
        List<AntenneAgents> antennes = new ArrayList<>();
        
        // Ajouter toutes les antennes multiples
        for (PersonAntenne personAntenne : personAntennes) {
            antennes.add(personAntenne.getAntenne());
        }
        
        // Si aucune antenne multiple n'est trouvée, utiliser l'antenne principale
        if (antennes.isEmpty() && agent.getAntenneAgent() != null) {
            antennes.add(agent.getAntenneAgent());
        }
        
        System.out.println("🔍 [PersonsService] Agent " + agentId + " a accès aux antennes: " + 
            antennes.stream().map(AntenneAgents::name).toList());
        
        return antennes;
    }
}
