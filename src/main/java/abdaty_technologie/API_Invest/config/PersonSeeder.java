package abdaty_technologie.API_Invest.config;
import java.time.Instant;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.Nationalites;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales;
import abdaty_technologie.API_Invest.repository.PersonsRepository;

@Component
@Profile({"default","dev"})
public class PersonSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(PersonSeeder.class);

    private final PersonsRepository personsRepository;
    private final UtilisateursRepository utilisateursRepository;
    private final DivisionsRepository divisionsRepository;
    private final PasswordEncoder passwordEncoder;

    public PersonSeeder(PersonsRepository personsRepository, 
                       UtilisateursRepository utilisateursRepository,
                       DivisionsRepository divisionsRepository,
                       PasswordEncoder passwordEncoder) {
        this.personsRepository = personsRepository;
        this.utilisateursRepository = utilisateursRepository;
        this.divisionsRepository = divisionsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Ne pas reseeder si un SUPER_ADMIN existe déjà
        boolean superAdminExists = personsRepository.findByRole(Roles.SUPER_ADMIN).stream().findAny().isPresent();
        if (superAdminExists) {
            log.info("[PersonSeeder] SUPER_ADMIN existe déjà, vérification de la division...");
            
            // Vérifier si l'admin existant a une division
            var existingAdmin = personsRepository.findByRole(Roles.SUPER_ADMIN).stream().findFirst().orElse(null);
            if (existingAdmin != null) {
                log.info("[PersonSeeder] Admin existant - Division: {}, Localité: {}", 
                    existingAdmin.getDivision() != null ? existingAdmin.getDivision().getId() : "NULL",
                    existingAdmin.getLocalite());
                
                // Si pas de division, on met à jour
                if (existingAdmin.getDivision() == null) {
                    log.info("[PersonSeeder] Mise à jour de l'admin existant avec division...");
                    // Continuer avec la logique de recherche de division
                } else {
                    log.info("[PersonSeeder] Admin existant a déjà une division, pas de mise à jour.");
                    return;
                }
            } else {
                return;
            }
        }

        // Création d'un SUPER_ADMIN par défaut (compte technique)
        Date dob1985 = new GregorianCalendar(1985, Calendar.JANUARY, 1).getTime();

        // Récupérer la division par défaut (Bamako)
        Divisions defaultDivision = null;
        try {
            log.info("[PersonSeeder] Recherche de division en cours...");
            
            // Lister toutes les divisions disponibles pour debug
            long totalDivisions = divisionsRepository.count();
            log.info("[PersonSeeder] Nombre total de divisions en base: {}", totalDivisions);
            
            if (totalDivisions > 0) {
                // Afficher quelques divisions pour debug
                var allDivisions = divisionsRepository.findAll();
                log.info("[PersonSeeder] Premières divisions disponibles:");
                allDivisions.stream().limit(5).forEach(d -> 
                    log.info("  - Code: {}, Nom: {}, ID: {}", d.getCode(), d.getNom(), d.getId()));
            }
            
            // Vérifier d'abord par code "010101010001" (code fourni)
            log.info("[PersonSeeder] Recherche par code: 010101010001");
            defaultDivision = divisionsRepository.findByCode("010101010001").orElse(null);
            if (defaultDivision != null) {
                log.info("[PersonSeeder] Division trouvée par code 010101010001: {} - {} (ID: {})", 
                    defaultDivision.getCode(), defaultDivision.getNom(), defaultDivision.getId());
            } else {
                log.warn("[PersonSeeder] Code 010101010001 non trouvé");
                
                // Fallback sur l'ID fourni
                log.info("[PersonSeeder] Recherche par ID: 637abad2-9d85-4450-8a20-4e8d0f26e228");
                defaultDivision = divisionsRepository.findById("637abad2-9d85-4450-8a20-4e8d0f26e228")
                        .orElse(null);
                if (defaultDivision != null) {
                    log.info("[PersonSeeder] Division trouvée par ID: {} - {} (Code: {})", 
                        defaultDivision.getId(), defaultDivision.getNom(), defaultDivision.getCode());
                } else {
                    log.warn("[PersonSeeder] ID 637abad2-9d85-4450-8a20-4e8d0f26e228 non trouvé");
                    
                    // Essayer de récupérer n'importe quelle division comme fallback
                    log.info("[PersonSeeder] Recherche de n'importe quelle division...");
                    defaultDivision = divisionsRepository.findAll().stream().findFirst().orElse(null);
                    if (defaultDivision != null) {
                        log.info("[PersonSeeder] Division fallback trouvée: {} - {} (ID: {})", 
                            defaultDivision.getCode(), defaultDivision.getNom(), defaultDivision.getId());
                    } else {
                        log.error("[PersonSeeder] AUCUNE division trouvée en base !");
                    }
                }
            }
        } catch (Exception e) {
            log.error("[PersonSeeder] Erreur lors de la récupération de la division: {}", e.getMessage(), e);
        }

        Persons admin;
        boolean isUpdate = superAdminExists;
        
        if (isUpdate) {
            // Mettre à jour l'admin existant
            admin = personsRepository.findByRole(Roles.SUPER_ADMIN).stream().findFirst().get();
            log.info("[PersonSeeder] Mise à jour de l'admin existant ID: {}", admin.getId());
        } else {
            // Créer un nouvel admin
            admin = new Persons();
            admin.setNom("Admin");
            admin.setPrenom("Super");
            admin.setEmail("admin@example.com");
            admin.setTelephone1("+22370000000");
            admin.setTelephone2(null);
            admin.setDateNaissance(dob1985);
            admin.setLieuNaissance("Bamako");
            admin.setEstAutoriser(true);
            admin.setNationalite(Nationalites.MALIENNE);
            admin.setEntrepriseRole(null);
            admin.setAntenneAgent(AntenneAgents.BAMAKO);
            admin.setSexe(Sexes.MASCULIN);
            admin.setSituationMatrimoniale(SituationMatrimoniales.CELIBATAIRE);
            admin.setCivilite(Civilites.MONSIEUR);
            admin.setRole(Roles.SUPER_ADMIN);
            admin.setCreation(Instant.now());
        }
        
        // Mettre à jour les champs division et localité (nouveau ou existant)
        admin.setLocalite("Bamako Centre");
        admin.setDivision(defaultDivision);
        admin.setModification(Instant.now());
        
        log.info("[PersonSeeder] Division assignée à admin AVANT sauvegarde: {}", 
            defaultDivision != null ? defaultDivision.getId() + " (" + defaultDivision.getCode() + ")" : "NULL");

        // Sauvegarder la personne
        Persons savedAdmin = personsRepository.save(admin);
        
        // Créer un utilisateur associé
        String username = "admin@example.com";
        String rawPassword = "Admin@123"; // Mot de passe fort à changer en production
        
        // Vérifier si l'utilisateur existe déjà
        if (!utilisateursRepository.existsByUtilisateur(username)) {
            Utilisateurs utilisateur = new Utilisateurs();
            utilisateur.setUtilisateur(username);
            utilisateur.setMotdepasse(passwordEncoder.encode(rawPassword));
            utilisateur.setPersonne(savedAdmin);
            
            utilisateursRepository.save(utilisateur);
            
            log.info("[PersonSeeder] SUPER_ADMIN créé avec succès");
            log.info("Identifiants de connexion - Email: {}", username);
            log.warn("Mot de passe temporaire: {}", rawPassword);
            log.warn("Veuillez changer ce mot de passe après la première connexion");
        } else {
            log.info("[PersonSeeder] L'utilisateur admin existe déjà");
        }
        
        log.info("[PersonSeeder] SUPER_ADMIN seedé: email={} id={}", admin.getEmail(), admin.getId());
        log.info("[PersonSeeder] Division associée: {}", savedAdmin.getDivision() != null ? 
            savedAdmin.getDivision().getId() + " (" + savedAdmin.getDivision().getCode() + ")" : "AUCUNE");
        log.info("[PersonSeeder] Localité: {}", savedAdmin.getLocalite());
    }
}
