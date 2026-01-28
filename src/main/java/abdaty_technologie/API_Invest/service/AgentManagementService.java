package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.dto.AgentCreationRequest;
import abdaty_technologie.API_Invest.dto.AgentResponse;
import abdaty_technologie.API_Invest.dto.AgentUpdateRequest;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AgentManagementService {

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private UtilisateursRepository utilisateursRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Créer un nouvel agent avec son utilisateur
     */
    public AgentResponse createAgent(AgentCreationRequest request) {
        // Vérifier si l'email existe déjà
        if (personsRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Un agent avec cet email existe déjà");
        }

        // Créer la personne
        Persons agent = new Persons();
        agent.setId(UUID.randomUUID().toString());
        agent.setPrenom(request.getPrenom());
        agent.setNom(request.getNom());
        agent.setEmail(request.getEmail());
        agent.setRole(request.getRole());
        agent.setAntenneAgent(request.getAntenneAgent());
        agent.setTelephone1(request.getTelephone() != null ? request.getTelephone() : "");
        agent.setLocalite(request.getAdresse());
        agent.setEstAutoriser(true);
        agent.setCreation(Instant.now());
        agent.setModification(Instant.now());

        // Sauvegarder la personne
        Persons savedAgent = personsRepository.save(agent);

        // Créer l'utilisateur associé
        Utilisateurs utilisateur = new Utilisateurs();
        utilisateur.setId(UUID.randomUUID().toString());
        utilisateur.setUtilisateur(request.getEmail());
        utilisateur.setMotdepasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setPersonne(savedAgent);
        utilisateur.setCreation(Instant.now());
        utilisateur.setModification(Instant.now());

        utilisateursRepository.save(utilisateur);

        System.out.println("✅ [AgentManagement] Agent créé: " + savedAgent.getEmail() + 
                         " - Rôle: " + savedAgent.getRole() + 
                         " - Antenne: " + savedAgent.getAntenneAgent());

        return convertToResponse(savedAgent);
    }

    /**
     * Lister les agents avec pagination et filtres
     */
    public Page<AgentResponse> listAgents(Pageable pageable, String role, String antenne) {
        Page<Persons> agentsPage;

        if (role != null && antenne != null) {
            Roles roleEnum = Roles.valueOf(role.toUpperCase());
            AntenneAgents antenneEnum = AntenneAgents.valueOf(antenne.toUpperCase());
            agentsPage = personsRepository.findByRoleAndAntenneAgent(roleEnum, antenneEnum, pageable);
        } else if (role != null) {
            Roles roleEnum = Roles.valueOf(role.toUpperCase());
            agentsPage = personsRepository.findByRole(roleEnum, pageable);
        } else if (antenne != null) {
            AntenneAgents antenneEnum = AntenneAgents.valueOf(antenne.toUpperCase());
            agentsPage = personsRepository.findByAntenneAgent(antenneEnum, pageable);
        } else {
            agentsPage = personsRepository.findAll(pageable);
        }

        return agentsPage.map(this::convertToResponse);
    }

    /**
     * Obtenir un agent par ID
     */
    public Optional<AgentResponse> getAgent(String agentId) {
        return personsRepository.findById(agentId)
                .map(this::convertToResponse);
    }

    /**
     * Mettre à jour un agent
     */
    public AgentResponse updateAgent(String agentId, AgentUpdateRequest request) {
        Optional<Persons> agentOpt = personsRepository.findById(agentId);
        if (!agentOpt.isPresent()) {
            throw new RuntimeException("Agent non trouvé");
        }

        Persons agent = agentOpt.get();

        // Mettre à jour les champs si fournis
        if (request.getPrenom() != null) {
            agent.setPrenom(request.getPrenom());
        }
        if (request.getNom() != null) {
            agent.setNom(request.getNom());
        }
        if (request.getEmail() != null) {
            // Vérifier que l'email n'est pas déjà utilisé
            Optional<Persons> existingAgent = personsRepository.findByEmail(request.getEmail());
            if (existingAgent.isPresent() && !existingAgent.get().getId().equals(agentId)) {
                throw new RuntimeException("Cet email est déjà utilisé par un autre agent");
            }
            agent.setEmail(request.getEmail());
            
            // Mettre à jour l'utilisateur associé
            if (agent.getUtilisateur() != null) {
                agent.getUtilisateur().setUtilisateur(request.getEmail());
                utilisateursRepository.save(agent.getUtilisateur());
            }
        }
        if (request.getRole() != null) {
            agent.setRole(request.getRole());
        }
        if (request.getAntenneAgent() != null) {
            agent.setAntenneAgent(request.getAntenneAgent());
        }
        if (request.getTelephone() != null) {
            agent.setTelephone1(request.getTelephone());
        }
        if (request.getAdresse() != null) {
            agent.setLocalite(request.getAdresse());
        }
        if (request.getActif() != null) {
            agent.setEstAutoriser(request.getActif());
        }

        // Mettre à jour le mot de passe si fourni
        if (request.getMotDePasse() != null && agent.getUtilisateur() != null) {
            agent.getUtilisateur().setMotdepasse(passwordEncoder.encode(request.getMotDePasse()));
            utilisateursRepository.save(agent.getUtilisateur());
        }

        agent.setModification(Instant.now());
        Persons updatedAgent = personsRepository.save(agent);

        System.out.println("✅ [AgentManagement] Agent mis à jour: " + updatedAgent.getEmail());

        return convertToResponse(updatedAgent);
    }

    /**
     * Activer/Désactiver un agent
     */
    public AgentResponse toggleAgentStatus(String agentId, Boolean newStatus) {
        Optional<Persons> agentOpt = personsRepository.findById(agentId);
        if (!agentOpt.isPresent()) {
            throw new RuntimeException("Agent non trouvé");
        }

        Persons agent = agentOpt.get();
        agent.setEstAutoriser(newStatus);
        agent.setModification(Instant.now());

        Persons updatedAgent = personsRepository.save(agent);

        System.out.println("✅ [AgentManagement] Statut agent modifié: " + 
                         updatedAgent.getEmail() + " - Actif: " + newStatus);

        return convertToResponse(updatedAgent);
    }

    /**
     * Convertir une entité Persons en AgentResponse
     */
    private AgentResponse convertToResponse(Persons agent) {
        AgentResponse response = new AgentResponse();
        response.setId(agent.getId());
        response.setPrenom(agent.getPrenom());
        response.setNom(agent.getNom());
        response.setEmail(agent.getEmail());
        response.setRole(agent.getRole());
        response.setAntenneAgent(agent.getAntenneAgent());
        response.setTelephone(agent.getTelephone1());
        response.setAdresse(agent.getLocalite());
        response.setActif(agent.getEstAutoriser());
        
        // Convertir Instant en LocalDateTime
        if (agent.getCreation() != null) {
            response.setDateCreation(LocalDateTime.ofInstant(agent.getCreation(), ZoneId.systemDefault()));
        }
        if (agent.getModification() != null) {
            response.setDateModification(LocalDateTime.ofInstant(agent.getModification(), ZoneId.systemDefault()));
        }
        
        return response;
    }
}
