package abdaty_technologie.API_Invest;

import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.PersonRole;
import abdaty_technologie.API_Invest.Entity.PersonAntenne;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.repository.PersonRoleRepository;
import abdaty_technologie.API_Invest.repository.PersonAntenneRepository;
import abdaty_technologie.API_Invest.service.PersonsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;


import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/agents")
@CrossOrigin(origins = "*")
public class SimpleAgentController {

    @Autowired
    private PersonsRepository personsRepository;
    
    @Autowired
    private UtilisateursRepository utilisateursRepository;
    
    @Autowired
    private PersonRoleRepository personRoleRepository;
    
    @Autowired
    private PersonAntenneRepository personAntenneRepository;
    
    @Autowired
    private PersonsService personsService;
    
    // Encoder pour hasher les mots de passe
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /**
     * Méthode utilitaire pour vérifier un mot de passe
     * @param rawPassword Mot de passe en clair
     * @param hashedPassword Mot de passe hashé
     * @return true si les mots de passe correspondent
     */
    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
    

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Simple Agent Controller fonctionne !");
        response.put("timestamp", new Date().toString());
        response.put("status", "OK");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/roles")
    public ResponseEntity<Map<String, Object>> getRoles() {
        System.out.println("🔄 [SimpleAgent] Récupération des rôles depuis l'enum Roles");
        
        List<Map<String, String>> roles = Arrays.stream(Roles.values())
            .map(role -> Map.of(
                "value", role.name(),
                "label", role.getValue()
            ))
            .collect(Collectors.toList());
        
        System.out.println("✅ [SimpleAgent] Rôles récupérés depuis l'enum: " + roles.size());
        
        Map<String, Object> response = new HashMap<>();
        response.put("roles", roles);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/antennes")
    public ResponseEntity<Map<String, Object>> getAntennes() {
        System.out.println("🔄 [SimpleAgent] Récupération des antennes depuis l'enum AntenneAgents");
        
        List<Map<String, String>> antennes = Arrays.stream(AntenneAgents.values())
            .map(antenne -> Map.of(
                "value", antenne.name(),
                "label", antenne.getValue()
            ))
            .collect(Collectors.toList());
        
        System.out.println("✅ [SimpleAgent] Antennes récupérées depuis l'enum: " + antennes.size());
        
        Map<String, Object> response = new HashMap<>();
        response.put("antennes", antennes);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            System.out.println(" [SimpleAgent] Récupération des agents depuis la table Utilisateurs");
            
            Pageable pageable = PageRequest.of(page, size);
            // Utiliser la méthode qui filtre directement en base de données
            Page<Utilisateurs> utilisateursPage = utilisateursRepository.findAgentsOnly(Roles.USER, pageable);
            
            List<Map<String, Object>> agents = utilisateursPage.getContent().stream()
                .map(utilisateur -> {
                    Map<String, Object> agent = new HashMap<>();
                    agent.put("id", utilisateur.getId());
                    agent.put("utilisateur", utilisateur.getUtilisateur()); // Email/login
                    
                    // Récupérer les informations de la personne associée
                    Persons person = utilisateur.getPersonne();
                    if (person != null) {
                        agent.put("prenom", person.getPrenom());
                        agent.put("nom", person.getNom());
                        agent.put("email", person.getEmail());
                        agent.put("telephone", person.getTelephone1());
                        
                        // Récupérer les rôles multiples
                        List<PersonRole> personRoles = personRoleRepository.findByPersonAndActifTrue(person);
                        List<String> roles = personRoles.stream()
                            .map(pr -> pr.getRole().name())
                            .collect(Collectors.toList());
                        
                        // Si pas de rôles dans la table de liaison, utiliser le rôle principal (fallback pour anciens agents)
                        if (roles.isEmpty() && person.getRole() != null) {
                            roles.add(person.getRole().name());
                        }
                        
                        // Si toujours pas de rôles, assigner USER par défaut
                        if (roles.isEmpty()) {
                            roles.add("USER");
                        }
                        
                        agent.put("roles", roles);
                        agent.put("role", roles.get(0)); // Premier rôle pour compatibilité
                        
                        // Récupérer les antennes multiples
                        List<PersonAntenne> personAntennes = personAntenneRepository.findByPersonAndActifTrue(person);
                        List<String> antennes = personAntennes.stream()
                            .map(pa -> pa.getAntenne().name())
                            .collect(Collectors.toList());
                        
                        // Si pas d'antennes dans la table de liaison, utiliser l'antenne principale
                        if (antennes.isEmpty() && person.getAntenneAgent() != null) {
                            antennes.add(person.getAntenneAgent().name());
                        }
                        agent.put("antennes", antennes);
                        agent.put("antenneAgent", antennes.isEmpty() ? null : antennes.get(0)); // Première antenne pour compatibilité
                        
                        agent.put("actif", person.getEstAutoriser());
                        agent.put("dateCreation", person.getCreation());
                        agent.put("dateModification", person.getModification());
                    } else {
                        // Si pas de personne associée, utiliser les infos de base
                        agent.put("prenom", "N/A");
                        agent.put("nom", "N/A");
                        agent.put("email", utilisateur.getUtilisateur());
                        agent.put("telephone", "N/A");
                        agent.put("role", "USER");
                        agent.put("roles", Arrays.asList("USER"));
                        agent.put("antenneAgent", null);
                        agent.put("antennes", new ArrayList<>());
                        agent.put("actif", true);
                        agent.put("dateCreation", utilisateur.getCreation());
                        agent.put("dateModification", utilisateur.getModification());
                    }
                    
                    return agent;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", agents);
            response.put("totalElements", utilisateursPage.getTotalElements()); // Nombre total d'agents dans la base
            response.put("totalPages", utilisateursPage.getTotalPages()); // Nombre de pages
            response.put("size", utilisateursPage.getSize()); // Taille de la page
            response.put("number", utilisateursPage.getNumber()); // Numéro de page actuel
            
            System.out.println("✅ [SimpleAgent] Agents récupérés: " + agents.size() + "/" + utilisateursPage.getTotalElements() + " (page " + (page + 1) + "/" + utilisateursPage.getTotalPages() + ")");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [SimpleAgent] Erreur récupération agents: " + e.getMessage());
            e.printStackTrace();
            
            // Retourner une liste vide en cas d'erreur
            Map<String, Object> response = new HashMap<>();
            response.put("content", new ArrayList<>());
            response.put("totalElements", 0);
            response.put("totalPages", 0);
            response.put("size", size);
            response.put("number", page);
            response.put("error", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createAgent(@RequestBody Map<String, Object> agentData) {
        try {
            System.out.println("🔄 [SimpleAgent] Création d'un nouvel agent: " + agentData.get("email"));
            
            // Validation des données requises
            String email = (String) agentData.get("email");
            String prenom = (String) agentData.get("prenom");
            String nom = (String) agentData.get("nom");
            String motDePasse = (String) agentData.get("motDePasse");
            
            if (email == null || prenom == null || nom == null || motDePasse == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Les champs email, prenom, nom et motDePasse sont requis");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Validation basique du mot de passe (non vide seulement)
            if (motDePasse.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le mot de passe ne peut pas être vide");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Vérifier si l'email existe déjà
            Optional<Utilisateurs> existingUser = utilisateursRepository.findByUtilisateur(email);
            if (existingUser.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Un utilisateur avec cet email existe déjà");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Créer la personne
            Persons person = new Persons();
            person.setPrenom(prenom);
            person.setNom(nom);
            person.setEmail(email);
            person.setTelephone1((String) agentData.get("telephone"));
            person.setLocalite((String) agentData.get("adresse")); // Utiliser localite au lieu d'adresse
            person.setEstAutoriser(true);
            
            // Récupérer les rôles (ne pas définir de rôle principal dans persons.role)
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) agentData.get("roles");
            if (roles == null || roles.isEmpty()) {
                String singleRole = (String) agentData.get("role");
                if (singleRole != null) {
                    roles = Arrays.asList(singleRole);
                } else {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Au moins un rôle doit être spécifié");
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }
            
            // Valider que tous les rôles sont valides
            for (String roleStr : roles) {
                try {
                    Roles.valueOf(roleStr);
                } catch (IllegalArgumentException e) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Rôle invalide: " + roleStr);
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }
            
            // Définir le premier rôle comme rôle principal pour satisfaire la contrainte NOT NULL
            try {
                Roles mainRole = Roles.valueOf(roles.get(0));
                person.setRole(mainRole);
                System.out.println("✅ [SimpleAgent] Rôle principal défini: " + mainRole.name());
            } catch (IllegalArgumentException e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Rôle principal invalide: " + roles.get(0));
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Définir l'antenne principale (première antenne de la liste ou antenne unique)
            @SuppressWarnings("unchecked")
            List<String> antennes = (List<String>) agentData.get("antennes");
            if (antennes == null || antennes.isEmpty()) {
                String singleAntenne = (String) agentData.get("antenneAgent");
                if (singleAntenne != null) {
                    antennes = Arrays.asList(singleAntenne);
                }
            }
            
            if (antennes != null && !antennes.isEmpty()) {
                try {
                    AntenneAgents mainAntenne = AntenneAgents.valueOf(antennes.get(0));
                    person.setAntenneAgent(mainAntenne);
                } catch (IllegalArgumentException e) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Antenne invalide: " + antennes.get(0));
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }
            
            // Sauvegarder la personne
            Persons savedPerson = personsRepository.save(person);
            System.out.println("✅ [SimpleAgent] Personne créée avec ID: " + savedPerson.getId());
            
            // Créer l'utilisateur
            Utilisateurs utilisateur = new Utilisateurs();
            utilisateur.setUtilisateur(email);
            
            // Hasher le mot de passe avec BCrypt
            String hashedPassword = passwordEncoder.encode(motDePasse);
            utilisateur.setMotdepasse(hashedPassword);
            System.out.println("🔒 [SimpleAgent] Mot de passe hashé pour: " + email);
            
            utilisateur.setPersonne(savedPerson);
            
            // Sauvegarder l'utilisateur
            Utilisateurs savedUser = utilisateursRepository.save(utilisateur);
            System.out.println("✅ [SimpleAgent] Utilisateur créé avec ID: " + savedUser.getId());
            
            // Créer TOUS les rôles dans la table person_roles
            for (String roleStr : roles) {
                try {
                    Roles role = Roles.valueOf(roleStr);
                    PersonRole personRole = new PersonRole();
                    personRole.setPerson(savedPerson);
                    personRole.setRole(role);
                    personRole.setActif(true);
                    personRoleRepository.save(personRole);
                    System.out.println("✅ [SimpleAgent] Rôle créé: " + roleStr + " pour " + email);
                } catch (IllegalArgumentException e) {
                    System.err.println("⚠️ [SimpleAgent] Rôle ignoré (invalide): " + roleStr);
                }
            }
            System.out.println("✅ [SimpleAgent] " + roles.size() + " rôles créés au total");
            
            // Créer les antennes multiples si nécessaire
            if (antennes != null && antennes.size() > 1) {
                for (String antenneStr : antennes) {
                    try {
                        AntenneAgents antenne = AntenneAgents.valueOf(antenneStr);
                        PersonAntenne personAntenne = new PersonAntenne();
                        personAntenne.setPerson(savedPerson);
                        personAntenne.setAntenne(antenne);
                        personAntenne.setActif(true);
                        personAntenneRepository.save(personAntenne);
                    } catch (IllegalArgumentException e) {
                        System.err.println("⚠️ [SimpleAgent] Antenne ignorée (invalide): " + antenneStr);
                    }
                }
                System.out.println("✅ [SimpleAgent] " + antennes.size() + " antennes créées");
            }
            
            // Retourner les données de l'agent créé
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("prenom", savedPerson.getPrenom());
            response.put("nom", savedPerson.getNom());
            response.put("email", savedPerson.getEmail());
            response.put("telephone", savedPerson.getTelephone1());
            response.put("adresse", savedPerson.getLocalite()); // Utiliser getLocalite au lieu de getAdresse
            response.put("role", savedPerson.getRole().name()); // Rôle principal
            response.put("roles", roles);
            response.put("antenneAgent", savedPerson.getAntenneAgent() != null ? savedPerson.getAntenneAgent().name() : null);
            response.put("antennes", antennes != null ? antennes : new ArrayList<>());
            response.put("actif", savedPerson.getEstAutoriser());
            response.put("dateCreation", savedPerson.getCreation());
            response.put("dateModification", savedPerson.getModification());
            
            System.out.println("✅ [SimpleAgent] Agent créé et persisté: " + email + " (ID: " + savedUser.getId() + ")");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [SimpleAgent] Erreur lors de la création de l'agent: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur interne du serveur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> toggleAgentStatus(
            @PathVariable String id, 
            @RequestBody Map<String, Object> statusData) {
        try {
            System.out.println(" [SimpleAgent] Changement de statut pour l'agent ID: " + id);
            
            Boolean actif = (Boolean) statusData.get("actif");
            if (actif == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le champ 'actif' est requis");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Chercher l'utilisateur par ID
            Optional<Utilisateurs> utilisateurOpt = utilisateursRepository.findById(id);
            if (!utilisateurOpt.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Agent non trouvé avec l'ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Utilisateurs utilisateur = utilisateurOpt.get();
            Persons person = utilisateur.getPersonne();
            
            if (person != null) {
                // Mettre à jour le statut de la personne
                person.setEstAutoriser(actif);
                personsRepository.save(person);
                
                System.out.println(" [SimpleAgent] Statut mis à jour pour: " + person.getEmail() + " -> " + actif);
                
                // Retourner les données mises à jour
                Map<String, Object> response = new HashMap<>();
                response.put("id", utilisateur.getId());
                response.put("prenom", person.getPrenom());
                response.put("nom", person.getNom());
                response.put("email", person.getEmail());
                response.put("actif", person.getEstAutoriser());
                response.put("dateModification", new Date().toString());
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Aucune personne associée à cet utilisateur");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
        } catch (Exception e) {
            System.err.println(" [SimpleAgent] Erreur lors du changement de statut: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur interne du serveur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAgent(@PathVariable String id) {
        try {
            System.out.println("🗑️ [SimpleAgent] Suppression de l'agent ID: " + id);
            
            // Chercher l'utilisateur par ID
            Optional<Utilisateurs> utilisateurOpt = utilisateursRepository.findById(id);
            if (!utilisateurOpt.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Agent non trouvé avec l'ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Utilisateurs utilisateur = utilisateurOpt.get();
            Persons person = utilisateur.getPersonne();
            
            if (person != null) {
                // Supprimer les rôles multiples associés
                List<PersonRole> personRoles = personRoleRepository.findByPersonAndActifTrue(person);
                if (!personRoles.isEmpty()) {
                    personRoleRepository.deleteAll(personRoles);
                    System.out.println("🗑️ [SimpleAgent] " + personRoles.size() + " rôles supprimés");
                }
                
                // Supprimer les antennes multiples associées
                List<PersonAntenne> personAntennes = personAntenneRepository.findByPersonAndActifTrue(person);
                if (!personAntennes.isEmpty()) {
                    personAntenneRepository.deleteAll(personAntennes);
                    System.out.println("🗑️ [SimpleAgent] " + personAntennes.size() + " antennes supprimées");
                }
                
                // Supprimer l'utilisateur (cascade supprimera la personne si configuré)
                utilisateursRepository.delete(utilisateur);
                System.out.println("🗑️ [SimpleAgent] Utilisateur supprimé: " + utilisateur.getId());
                
                // Supprimer la personne
                personsRepository.delete(person);
                System.out.println("🗑️ [SimpleAgent] Personne supprimée: " + person.getId());
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Agent supprimé avec succès");
                response.put("deletedId", id);
                response.put("deletedEmail", person.getEmail());
                
                System.out.println("✅ [SimpleAgent] Agent supprimé définitivement: " + person.getEmail() + " (ID: " + id + ")");
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Aucune personne associée à cet utilisateur");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SimpleAgent] Erreur lors de la suppression de l'agent: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur interne du serveur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAgent(
            @PathVariable String id, 
            @RequestBody Map<String, Object> agentData) {
        try {
            System.out.println("🔄 [SimpleAgent] Modification de l'agent ID: " + id);
            System.out.println("📋 [SimpleAgent] Données reçues: " + agentData);
            
            // Chercher l'utilisateur par ID
            Optional<Utilisateurs> utilisateurOpt = utilisateursRepository.findById(id);
            if (!utilisateurOpt.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Agent non trouvé");
                return ResponseEntity.notFound().build();
            }
            
            Utilisateurs utilisateur = utilisateurOpt.get();
            Persons person = utilisateur.getPersonne();
            
            if (person == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Aucune personne associée à cet utilisateur");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Mettre à jour les informations de base
            if (agentData.containsKey("prenom")) {
                person.setPrenom((String) agentData.get("prenom"));
            }
            if (agentData.containsKey("nom")) {
                person.setNom((String) agentData.get("nom"));
            }
            if (agentData.containsKey("email")) {
                String newEmail = (String) agentData.get("email");
                person.setEmail(newEmail);
                utilisateur.setUtilisateur(newEmail); // Mettre à jour aussi le nom d'utilisateur
            }
            if (agentData.containsKey("telephone")) {
                person.setTelephone1((String) agentData.get("telephone"));
            }
            if (agentData.containsKey("adresse")) {
                person.setLocalite((String) agentData.get("adresse"));
            }
            
            // Mettre à jour le mot de passe si fourni
            if (agentData.containsKey("motDePasse")) {
                String motDePasse = (String) agentData.get("motDePasse");
                if (motDePasse != null && !motDePasse.trim().isEmpty()) {
                    String hashedPassword = passwordEncoder.encode(motDePasse);
                    utilisateur.setMotdepasse(hashedPassword);
                    System.out.println("🔐 [SimpleAgent] Mot de passe mis à jour et hashé");
                }
            }
            
            // Mettre à jour les rôles
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) agentData.get("roles");
            if (roles != null && !roles.isEmpty()) {
                // Valider tous les rôles
                for (String roleStr : roles) {
                    try {
                        Roles.valueOf(roleStr);
                    } catch (IllegalArgumentException e) {
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", "Rôle invalide: " + roleStr);
                        return ResponseEntity.badRequest().body(errorResponse);
                    }
                }
                
                // Supprimer les anciens rôles
                List<PersonRole> oldRoles = personRoleRepository.findByPersonAndActifTrue(person);
                personRoleRepository.deleteAll(oldRoles);
                
                // Définir le premier rôle comme rôle principal
                Roles mainRole = Roles.valueOf(roles.get(0));
                person.setRole(mainRole);
                
                // Créer les nouveaux rôles
                for (String roleStr : roles) {
                    PersonRole personRole = new PersonRole();
                    personRole.setPerson(person);
                    personRole.setRole(Roles.valueOf(roleStr));
                    personRole.setActif(true);
                    personRoleRepository.save(personRole);
                }
                
                System.out.println("✅ [SimpleAgent] Rôles mis à jour: " + roles);
            }
            
            // Mettre à jour les antennes
            @SuppressWarnings("unchecked")
            List<String> antennes = (List<String>) agentData.get("antennes");
            if (antennes != null && !antennes.isEmpty()) {
                // Supprimer les anciennes antennes
                List<PersonAntenne> oldAntennes = personAntenneRepository.findByPersonAndActifTrue(person);
                personAntenneRepository.deleteAll(oldAntennes);
                
          // Définir la première antenne comme antenne principale
            try {
                AntenneAgents mainAntenne = AntenneAgents.valueOf(antennes.get(0));
                person.setAntenneAgent(mainAntenne);
            } catch (IllegalArgumentException e) {
                System.out.println("⚠️ [SimpleAgent] Antenne principale invalide: " + antennes.get(0));
            }

            // Créer les nouvelles antennes
            for (String antenneStr : antennes) {
                try {
                    PersonAntenne personAntenne = new PersonAntenne();
                    personAntenne.setPerson(person);
                    personAntenne.setAntenne(AntenneAgents.valueOf(antenneStr));
                    // personAntenne.setActif(true); // TODO: Fix missing method
                    personAntenneRepository.save(personAntenne);
                } catch (IllegalArgumentException e) {
                    System.out.println("⚠️ [SimpleAgent] Antenne invalide ignorée: " + antenneStr);
                }
            }
            
            System.out.println("✅ [SimpleAgent] Antennes mises à jour: " + antennes);
        }
            
        // Sauvegarder les modifications
        // person.setModification(Instant.now()); // TODO: Fix missing method
        Persons savedPerson = personsRepository.save(person);
        Utilisateurs savedUser = utilisateursRepository.save(utilisateur);
            
            // Préparer la réponse avec les rôles et antennes multiples
            List<PersonRole> personRoles = personRoleRepository.findByPersonAndActifTrue(savedPerson);
            List<String> responseRoles = new ArrayList<>(); // TODO: Fix getRole() method
            // personRoles.stream().map(pr -> pr.getRole().name()).collect(Collectors.toList());
            
            List<PersonAntenne> personAntennes = personAntenneRepository.findByPersonAndActifTrue(savedPerson);
            List<String> responseAntennes = new ArrayList<>(); // TODO: Fix getAntenne() method
            // personAntennes.stream().map(pa -> pa.getAntenne().name()).collect(Collectors.toList());
            
            // Créer la réponse - TODO: Fix all getter methods
            Map<String, Object> response = new HashMap<>();
            response.put("id", id);
            response.put("prenom", "");
            response.put("nom", "");
            response.put("email", "");
            response.put("telephone", "");
            response.put("adresse", "");
            response.put("role", "");
            response.put("roles", responseRoles);
            response.put("antenneAgent", "");
            response.put("antennes", responseAntennes);
            response.put("actif", true);
            response.put("dateCreation", "");
            response.put("dateModification", "");
            
            System.out.println("✅ [SimpleAgent] Agent modifié avec succès (ID: " + id + ")");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [SimpleAgent] Erreur lors de la modification de l'agent: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur interne du serveur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}/antennes")
    public ResponseEntity<Map<String, Object>> getAgentAntennes(@PathVariable String id) {
        try {
            System.out.println("🔄 [SimpleAgent] Récupération des antennes pour l'agent ID: " + id);
            
            List<AntenneAgents> antennes = personsService.getAgentAntennes(id);
            
            List<Map<String, String>> antennesResponse = antennes.stream()
                .map(antenne -> Map.of(
                    "value", antenne.name(),
                    "label", antenne.getValue()
                ))
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("agentId", id);
            response.put("antennes", antennesResponse);
            response.put("message", "Antennes récupérées avec succès");
            
            System.out.println("✅ [SimpleAgent] Antennes récupérées pour l'agent " + id + ": " + 
                antennes.stream().map(AntenneAgents::name).collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [SimpleAgent] Erreur lors de la récupération des antennes: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur interne du serveur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
