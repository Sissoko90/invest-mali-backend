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
    private final PasswordEncoder passwordEncoder;

    public PersonSeeder(PersonsRepository personsRepository, 
                        UtilisateursRepository utilisateursRepository,
                        PasswordEncoder passwordEncoder) {
        this.personsRepository = personsRepository;
        this.utilisateursRepository = utilisateursRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Vérifier si un SUPER_ADMIN existe déjà
        boolean superAdminExists = personsRepository.findByRole(Roles.SUPER_ADMIN).stream().findAny().isPresent();
        
        if (superAdminExists) {
            log.info("[PersonSeeder] SUPER_ADMIN existe déjà, pas de création.");
            return;
        }

        log.info("[PersonSeeder] Création d'un SUPER_ADMIN par défaut...");

        // Création d'un SUPER_ADMIN par défaut (compte technique)
        Date dob1985 = new GregorianCalendar(1985, Calendar.JANUARY, 1).getTime();

        Persons admin = new Persons();
        admin.setNom("Admin");
        admin.setPrenom("Super");
        admin.setEmail("admin.akera@apimali.com");
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
        admin.setModification(Instant.now());
        
        // Localisation via API INSTAT
        admin.setLocalite("Bamako Centre");
        admin.setDivision(null); // Pas de division en base
        admin.setDivisionCode("010101010001"); // Code quartier Kayes N'Di de l'API INSTAT
        
        log.info("[PersonSeeder] Configuration admin - Division: NULL (API INSTAT), Code INSTAT: {}, Localité: {}", 
            admin.getDivisionCode(), admin.getLocalite());

        // Sauvegarder la personne
        Persons savedAdmin = personsRepository.save(admin);
        
        // Créer un utilisateur associé
        String username = "admin.akera@apimali.com";
        String rawPassword = "Admin@AKERA2025";
        
        if (!utilisateursRepository.existsByUtilisateur(username)) {
            Utilisateurs utilisateur = new Utilisateurs();
            utilisateur.setUtilisateur(username);
            utilisateur.setMotdepasse(passwordEncoder.encode(rawPassword));
            utilisateur.setPersonne(savedAdmin);
            
            utilisateursRepository.save(utilisateur);
            
            log.info("[PersonSeeder] ✅ SUPER_ADMIN créé avec succès");
            log.info("[PersonSeeder] 📧 Email: {}", username);
            log.warn("[PersonSeeder] 🔑 Mot de passe temporaire: {}", rawPassword);
            log.warn("[PersonSeeder] ⚠️  Veuillez changer ce mot de passe après la première connexion");
        } else {
            log.info("[PersonSeeder] L'utilisateur admin existe déjà");
        }
        
        log.info("[PersonSeeder] ✅ SUPER_ADMIN seedé - ID: {}, Email: {}", savedAdmin.getId(), savedAdmin.getEmail());
    }
}
