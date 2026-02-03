package abdaty_technologie.API_Invest.config;
import java.time.Instant;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import jakarta.transaction.Transactional;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.Nationalites;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales;
import abdaty_technologie.API_Invest.repository.PersonsRepository;

@Component
@Profile({"default","dev","prod"})
@Order(1)
@Transactional
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
        // Vérifier si le numéro de téléphone existe déjà
        String adminPhone = "+22370000000";
        var existingPersonByPhone = personsRepository.findByTelephone1(adminPhone);
        
        if (existingPersonByPhone.isPresent()) {
            log.info("[PersonSeeder] Une personne avec le téléphone {} existe déjà, pas de création.", adminPhone);
            return;
        }
        
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
                
                // Si pas de division, on met à jour (même si localité existe)
                if (existingAdmin.getDivision() == null) {
                    log.info("[PersonSeeder] Admin existant n'a pas de division, mise à jour nécessaire...");
                    // Continuer avec la logique de recherche de division
                } else {
                    log.info("[PersonSeeder] Admin existant a déjà une division, pas de mise à jour.");
                    log.info("[PersonSeeder] Division existante: {}, Localité existante: {}", 
                        existingAdmin.getDivision() != null ? existingAdmin.getDivision().getId() : "NULL",
                        existingAdmin.getLocalite());
                    return;
                }
            } else {
                return;
            }
        }

        // Création d'un SUPER_ADMIN par défaut (compte technique)
        Date dob1985 = new GregorianCalendar(1985, Calendar.JANUARY, 1).getTime();

        // NOUVELLE APPROCHE : Utiliser directement l'API INSTAT
        // Plus besoin de chercher en base, on utilise l'API INSTAT pour la localisation
        log.info("[PersonSeeder] Utilisation de l'API INSTAT pour la localisation - plus de division en base nécessaire");

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
        
        // Mettre à jour les champs localisation SEULEMENT si c'est une création ou si les valeurs sont nulles
        if (!isUpdate || admin.getLocalite() == null || admin.getLocalite().isBlank()) {
            admin.setLocalite("Bamako Centre");
            log.info("[PersonSeeder] Localité définie sur: Bamako Centre");
        } else {
            log.info("[PersonSeeder] Localité existante conservée: {}", admin.getLocalite());
        }
        
        // NOUVELLE APPROCHE : Utiliser divisionCode INSTAT au lieu de division_id
        // Division en base = NULL, mais on stocke le code INSTAT
        admin.setDivision(null);
        
        // Définir le code de division INSTAT pour la localisation
        if (!isUpdate || admin.getDivisionCode() == null || admin.getDivisionCode().isBlank()) {
            admin.setDivisionCode("010101010001"); // Code quartier Kayes N'Di de l'API INSTAT
            log.info("[PersonSeeder] Code division INSTAT défini: 010101010001 (Kayes N'Di)");
        } else {
            log.info("[PersonSeeder] Code division INSTAT existant conservé: {}", admin.getDivisionCode());
        }
        
        log.info("[PersonSeeder] Division en base = NULL, Code INSTAT = {}", admin.getDivisionCode());
        
        admin.setModification(Instant.now());
        
        log.info("[PersonSeeder] Configuration admin AVANT sauvegarde - Division: NULL (API INSTAT), Localité: {}", 
            admin.getLocalite());

        // Sauvegarder la personne
        Persons savedAdmin = personsRepository.save(admin);
        
        // Créer un utilisateur associé
        String username = "admin.akera@apimali.com";
        String rawPassword = "Admin@AKERA2025"; // Mot de passe fort à changer en production
        
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
        log.info("[PersonSeeder] Division en base: AUCUNE (migration vers API INSTAT)");
        log.info("[PersonSeeder] Code division INSTAT: {}", savedAdmin.getDivisionCode());
        log.info("[PersonSeeder] Localité: {}", savedAdmin.getLocalite());
    }
}
