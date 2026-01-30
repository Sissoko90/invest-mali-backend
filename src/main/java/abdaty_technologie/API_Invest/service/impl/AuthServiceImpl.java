package abdaty_technologie.API_Invest.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Date;
import java.util.Calendar;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.PasswordResetToken;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.dto.requests.LoginRequest;
import abdaty_technologie.API_Invest.dto.requests.RegisterRequest;
import abdaty_technologie.API_Invest.dto.requests.ForgotPasswordRequest;
import abdaty_technologie.API_Invest.dto.requests.ResetPasswordRequest;
import abdaty_technologie.API_Invest.dto.responses.LoginResponse;
import abdaty_technologie.API_Invest.dto.responses.UserAuthResponse;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.PasswordResetTokenRepository;
import abdaty_technologie.API_Invest.repository.PersonRoleRepository;
import abdaty_technologie.API_Invest.Entity.PersonRole;
import abdaty_technologie.API_Invest.service.IAuthService;
import abdaty_technologie.API_Invest.util.JwtUtil;

@Service
public class AuthServiceImpl implements IAuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private UtilisateursRepository utilisateursRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PersonRoleRepository personRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse authenticate(LoginRequest loginRequest) {
        String identifiant = loginRequest.getEmail();
        log.info("Tentative de connexion avec l'identifiant: {}", identifiant);
        
        // Rechercher l'utilisateur par nom d'utilisateur, email ou téléphone
        Optional<Utilisateurs> userOpt = utilisateursRepository.findByUtilisateur(identifiant);
        
        // Si non trouvé par nom d'utilisateur, chercher par email
        if (!userOpt.isPresent()) {
            log.info("Utilisateur non trouvé par nom d'utilisateur, recherche par email...");
            userOpt = utilisateursRepository.findByPersonneEmail(identifiant);
        }
        
        // Si non trouvé par email, chercher par téléphone avec différentes variantes
        if (!userOpt.isPresent()) {
            log.info("Utilisateur non trouvé par email, recherche par téléphone...");
            
            // Essayer avec l'identifiant tel quel
            userOpt = utilisateursRepository.findByPersonneTelephone(identifiant);
            
            // Si pas trouvé et que l'identifiant ressemble à un numéro (commence par + ou contient que des chiffres)
            if (!userOpt.isPresent() && (identifiant.startsWith("+") || identifiant.matches("\\d+"))) {
                // Essayer avec +223 si pas déjà présent (SANS espace d'abord)
                if (!identifiant.startsWith("+")) {
                    String withPrefixNoSpace = "+223" + identifiant;
                    log.info("Tentative avec indicatif sans espace: {}", withPrefixNoSpace);
                    userOpt = utilisateursRepository.findByPersonneTelephone(withPrefixNoSpace);
                    
                    // Si pas trouvé, essayer avec espace
                    if (!userOpt.isPresent()) {
                        String withPrefixSpace = "+223 " + identifiant;
                        log.info("Tentative avec indicatif et espace: {}", withPrefixSpace);
                        userOpt = utilisateursRepository.findByPersonneTelephone(withPrefixSpace);
                    }
                }
                
                // Essayer sans espaces
                if (!userOpt.isPresent()) {
                    String noSpaces = identifiant.replaceAll("\\s+", "");
                    log.info("Tentative sans espaces: {}", noSpaces);
                    userOpt = utilisateursRepository.findByPersonneTelephone(noSpaces);
                }
                
                // Essayer avec espaces après l'indicatif
                if (!userOpt.isPresent() && identifiant.startsWith("+223") && !identifiant.contains(" ")) {
                    String withSpace = identifiant.substring(0, 4) + " " + identifiant.substring(4);
                    log.info("Tentative avec espace après indicatif: {}", withSpace);
                    userOpt = utilisateursRepository.findByPersonneTelephone(withSpace);
                }
            }
        }
        
        if (!userOpt.isPresent()) {
            log.error("Aucun utilisateur trouvé avec l'identifiant: {}", identifiant);
            throw new BadCredentialsException(Messages.UTILISATEUR_NON_TROUVE);
        }
        
        Utilisateurs utilisateur = userOpt.get();
        log.info("Utilisateur trouvé: {}", utilisateur.getUtilisateur());
                
        // Récupérer les informations de la personne associée
        Persons person = utilisateur.getPersonne();
        if (person == null) {
            log.error("Aucune personne associée à l'utilisateur: {}", utilisateur.getUtilisateur());
            throw new BadCredentialsException(Messages.PERSONNE_NON_TROUVE);
        }
        
        log.info("Personne associée trouvée: {} {}", person.getPrenom(), person.getNom());

        // Vérifier le mot de passe (hash) avec auto-migration legacy si en clair
        if (!passwordEncoder.matches(loginRequest.getMotdepasse(), utilisateur.getMotdepasse())) {
            // Cas legacy: ancien mot de passe stocké en clair
            if (loginRequest.getMotdepasse().equals(utilisateur.getMotdepasse())) {
                utilisateur.setMotdepasse(passwordEncoder.encode(loginRequest.getMotdepasse()));
                utilisateursRepository.save(utilisateur);
            } else {
                throw new BadCredentialsException(Messages.MOT_DE_PASSE_INCORRECT);
            }
        }

        // Récupérer tous les rôles de l'utilisateur
        List<PersonRole> personRoles = personRoleRepository.findByPersonAndActifTrue(person);
        List<String> allRoles = personRoles.stream()
            .map(pr -> pr.getRole().name())
            .collect(Collectors.toList());
        
        // Si pas de rôles dans la table de liaison, utiliser le rôle principal (fallback pour anciens agents)
        if (allRoles.isEmpty() && person.getRole() != null) {
            allRoles.add(person.getRole().name());
        }
        
        // Si toujours pas de rôles, assigner USER par défaut
        if (allRoles.isEmpty()) {
            allRoles.add("USER");
        }
        
        // Déterminer le rôle principal pour le token (le plus élevé en priorité)
        String mainRole = "USER";
        if (!allRoles.isEmpty()) {
            // Priorité: SUPER_ADMIN > ADMIN > AGENT_*
            if (allRoles.contains("SUPER_ADMIN")) {
                mainRole = "SUPER_ADMIN";
            } else if (allRoles.contains("ADMIN")) {
                mainRole = "ADMIN";
            } else {
                // Prendre le premier rôle agent trouvé
                mainRole = allRoles.stream()
                    .filter(role -> role.startsWith("AGENT_"))
                    .findFirst()
                    .orElse(allRoles.get(0));
            }
        }
        
        // Générer le token avec le rôle principal et tous les rôles
        String token = jwtUtil.generateTokenWithRoles(utilisateur.getUtilisateur(), mainRole, allRoles);
        
        // Générer le refresh token
        String refreshToken = jwtUtil.generateRefreshToken(utilisateur.getUtilisateur());

        // Récupérer la civilité depuis la table persons - si null, utiliser le sexe comme fallback
        System.out.println("DEBUG - Person object: " + person);
        System.out.println("DEBUG - Person civilité: " + person.getCivilite());
        System.out.println("DEBUG - Person sexe: " + person.getSexe());
        
        String civiliteStr = null;
        if (person.getCivilite() != null) {
            // Vérifier la cohérence entre sexe et civilité
            String sexe = person.getSexe() != null ? person.getSexe().toString() : null;
            String civilite = person.getCivilite().toString();
            
            // Contrainte: MASCULIN → MONSIEUR, FEMININ → MADAME ou MADEMOISELLE
            if (sexe != null) {
                if (sexe.equals("MASCULIN") && !civilite.equals("MONSIEUR")) {
                    System.out.println("WARN - Incohérence: sexe=" + sexe + " mais civilité=" + civilite + ". Correction appliquée.");
                    civiliteStr = "MONSIEUR";
                } else if (sexe.equals("FEMININ") && !civilite.equals("MADAME") && !civilite.equals("MADEMOISELLE")) {
                    System.out.println("WARN - Incohérence: sexe=" + sexe + " mais civilité=" + civilite + ". Correction appliquée.");
                    civiliteStr = "MADAME";
                } else {
                    civiliteStr = civilite;
                }
            } else {
                civiliteStr = civilite;
            }
        } else if (person.getSexe() != null) {
            // Fallback: utiliser le sexe pour déterminer la civilité
            civiliteStr = person.getSexe().toString().equals("MASCULIN") ? "MONSIEUR" : 
                         person.getSexe().toString().equals("FEMININ") ? "MADAME" : null;
        } else {
            // Valeur par défaut si aucune info disponible
            civiliteStr = "MONSIEUR";
        }
        
        System.out.println("DEBUG - Civilité finale: " + civiliteStr);
        
        LoginResponse response = new LoginResponse(token, utilisateur.getUtilisateur(), mainRole, person.getNom(), person.getPrenom(), person.getEmail(), person.getId(), civiliteStr, person.getTelephone1());
        response.setRefreshToken(refreshToken);
        return response;
    }

    @Override
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        // Vérification des doublons
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (personsRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Cette adresse email est déjà utilisée");
            }
        }
        if (personsRepository.existsByTelephone1(request.getTelephone1())) {
            throw new RuntimeException("Ce numéro de téléphone est déjà utilisé");
        }

        // Création de la personne avec uniquement les champs fournis
        Persons person = new Persons();
        person.setNom(request.getNom());
        person.setPrenom(request.getPrenom());
        person.setCivilite(request.getCivilite());
        person.setSexe(request.getSexe());
        person.setEmail(request.getEmail());
        person.setTelephone1(request.getTelephone1());
        
        // Rôle par défaut
        person.setRole(Roles.USER);
        

        // Création du compte utilisateur avec mot de passe haché
        // Utiliser l'email si fourni, sinon le téléphone comme identifiant
        String identifiant = (request.getEmail() != null && !request.getEmail().trim().isEmpty()) 
            ? request.getEmail() 
            : request.getTelephone1();
        
        Utilisateurs utilisateur = new Utilisateurs();
        utilisateur.setUtilisateur(identifiant);
        utilisateur.setMotdepasse(passwordEncoder.encode(request.getMotdepasse()));
        utilisateur.setPersonne(person);
        
        // Sauvegarde de la personne et de l'utilisateur
        Persons savedPerson = personsRepository.save(person);
        utilisateursRepository.save(utilisateur);
        
        // Génération du token JWT
        String token = jwtUtil.generateToken(utilisateur.getUtilisateur(), "USER");
        
        // Création de la réponse avec uniquement les champs de base
        return new LoginResponse(
            token, 
            utilisateur.getUtilisateur(), 
            "USER", 
            savedPerson.getNom(), 
            savedPerson.getPrenom(), 
            savedPerson.getEmail(),
            savedPerson.getId(),
            savedPerson.getCivilite() != null ? savedPerson.getCivilite().toString() : null
        );
    }

    @Override
    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request) {
        // Trouver la personne par email
        Persons person = personsRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email non trouvé"));

        Utilisateurs utilisateur = utilisateursRepository.findByPersonneId(person.getId())
                .orElseThrow(() -> new BadCredentialsException(Messages.UTILISATEUR_NON_TROUVE));

        // Générer un token unique avec expiration
        String token = UUID.randomUUID().toString();
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MINUTE, 30); // valide 30 minutes
        Date expiresAt = cal.getTime();

        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(token);
        prt.setExpiresAt(expiresAt);
        prt.setUtilisateur(utilisateur);
        passwordResetTokenRepository.save(prt);

        // En production, on enverrait un email avec ce token. Ici on le retourne.
        return token;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadCredentialsException("Token de réinitialisation invalide"));

        // Vérifier expiration
        if (prt.getExpiresAt().before(new Date())) {
            passwordResetTokenRepository.deleteByToken(request.getToken());
            throw new BadCredentialsException("Token de réinitialisation expiré");
        }

        Utilisateurs utilisateur = prt.getUtilisateur();
        utilisateur.setMotdepasse(passwordEncoder.encode(request.getNouveauMotdepasse()));
        utilisateursRepository.save(utilisateur);

        // Invalider le token après usage
        passwordResetTokenRepository.deleteByToken(request.getToken());
    }

    @Override
    public UserAuthResponse getUserAuthInfo(String userId) {
        Utilisateurs utilisateur = utilisateursRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(Messages.UTILISATEUR_NON_TROUVE));
        
        return createUserAuthResponse(utilisateur);
    }

    @Override
    public List<UserAuthResponse> getAllUsersInfo() {
        return utilisateursRepository.findAll().stream()
                .map(this::createUserAuthResponse)
                .collect(Collectors.toList());
    }
    
    private UserAuthResponse createUserAuthResponse(Utilisateurs utilisateur) {
        UserAuthResponse response = new UserAuthResponse();
        response.setUserId(utilisateur.getId());
        response.setUtilisateur(utilisateur.getUtilisateur());
        
        if (utilisateur.getPersonne() != null) {
            response.setNom(utilisateur.getPersonne().getNom());
            response.setPrenom(utilisateur.getPersonne().getPrenom());
            response.setEmail(utilisateur.getPersonne().getEmail());
            response.setEstAutoriser(utilisateur.getPersonne().getEstAutoriser());
            response.setRole("USER");
            
            // Informations de division si disponibles
            if (utilisateur.getPersonne().getDivision() != null) {
                response.setDivisionNom(utilisateur.getPersonne().getDivision().getNom());
                response.setDivisionType(utilisateur.getPersonne().getDivision().getDivisionType().toString());
            }
        } else {
            response.setRole("ADMIN");
            response.setEstAutoriser(true);
        }
        
        return response;
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        // TODO: Implémenter complètement le refresh token
        // Pour l'instant, augmentation de la durée du JWT à 24h
        throw new RuntimeException("Fonctionnalité refresh token en cours d'implémentation");
    }
}