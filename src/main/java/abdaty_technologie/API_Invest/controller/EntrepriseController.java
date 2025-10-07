package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.DivisionType;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.dto.request.EntrepriseRequest;
import abdaty_technologie.API_Invest.dto.response.EntrepriseResponse;
import abdaty_technologie.API_Invest.dto.response.MembreResponse;
import abdaty_technologie.API_Invest.dto.response.UtilisateursResponse;
import abdaty_technologie.API_Invest.dto.request.BanEntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.UpdateEntrepriseRequest;
import abdaty_technologie.API_Invest.service.EntrepriseService;
import abdaty_technologie.API_Invest.service.DocumentsService;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import jakarta.validation.Valid;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import abdaty_technologie.API_Invest.util.JwtUtil;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import org.springframework.web.bind.annotation.PatchMapping;
/**
 * Contrôleur REST pour les opérations sur les entreprises.
 *
 * Expose:
 * Les endpoints sont automatiquement préfixés par /api/v1 via spring.mvc.servlet.path.
 * - POST /entreprises: création d'une entreprise avec génération automatique de la référence
 * - GET  /entreprises: liste paginée (et triable) des entreprises, avec filtre optionnel par divisionCode
 */
@RestController
@RequestMapping("/entreprises")
public class EntrepriseController {

    @Autowired
    private EntrepriseService entrepriseService;

    @Autowired
    private DocumentsService documentsService;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UtilisateursRepository utilisateursRepository;

    /**
     * Crée une entreprise.
     * - Valide la requête (@Valid)
     * - Délègue au service qui génère la référence (CE-YYYY-MM-DD-#####)
     * - Retourne une réponse épurée (EntrepriseResponse)
     */
    @PostMapping
    public ResponseEntity<EntrepriseResponse> Entreprise(@RequestBody @Valid EntrepriseRequest request) {
        Entreprise created = entrepriseService.createEntreprise(request);
        return ResponseEntity.ok(toResponse(created));
    }

    /**
     * Crée une entreprise avec upload des documents.
     * - Traite les données JSON de l'entreprise
     * - Upload et sauvegarde les documents dans la table Documents
     * - Associe les documents aux personnes et à l'entreprise
     */
    @PostMapping("/with-documents")
    public ResponseEntity<EntrepriseResponse> createEntrepriseWithDocuments(
            @RequestParam("entrepriseData") String entrepriseDataJson,
            @RequestParam(value = "statuts", required = false) MultipartFile statuts,
            @RequestParam(value = "registreCommerce", required = false) MultipartFile registreCommerce,
            @RequestParam(value = "certificatResidence", required = false) MultipartFile certificatResidence,
            @RequestParam Map<String, Object> allParams) {
        
        try {
            // Parser les données JSON de l'entreprise
            EntrepriseRequest request = objectMapper.readValue(entrepriseDataJson, EntrepriseRequest.class);
            
            // Créer l'entreprise d'abord
            Entreprise created = entrepriseService.createEntreprise(request);
            
            // Traiter les documents de l'entreprise
            if (statuts != null && !statuts.isEmpty()) {
                // Trouver un fondateur pour associer les statuts
                String founderId = findFounderId(created);
                if (founderId != null) {
                    documentsService.uploadDocument(founderId, created.getId(), 
                        TypeDocuments.STATUS_SOCIETE, "STATUTS-" + created.getReference(), statuts);
                }
            }
            
            if (registreCommerce != null && !registreCommerce.isEmpty()) {
                String founderId = findFounderId(created);
                if (founderId != null) {
                    documentsService.uploadDocument(founderId, created.getId(), 
                        TypeDocuments.REGISTRE_COMMERCE, "RC-" + created.getReference(), registreCommerce);
                }
            }
            
            if (certificatResidence != null && !certificatResidence.isEmpty()) {
                String gerantId = findGerantId(created);
                if (gerantId != null) {
                    documentsService.uploadDocument(gerantId, created.getId(), 
                        TypeDocuments.CERTIFICAT_RESIDENCE, "CR-" + created.getReference(), certificatResidence);
                }
            }
            
            // Traiter les documents des participants
            processParticipantDocuments(allParams, created);
            
            return ResponseEntity.ok(toResponse(created));
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la création de l'entreprise avec documents: " + e.getMessage(), e);
        }
    }

    /**
     * Liste paginée des entreprises.
     * - Paramètres Spring Data: page, size, sort
     * - Filtre optionnel par code de division (divisionCode)
     */
    @GetMapping
    public ResponseEntity<Page<EntrepriseResponse>> listEntreprises(
            @RequestParam(value = "divisionCode", required = false) String divisionCode,
            Pageable pageable) {
        Page<Entreprise> page = entrepriseService.listEntreprises(divisionCode, pageable);
        // Récupérer les IDs des entreprises de la page
        List<Entreprise> entreprises = page.getContent();
        List<String> ids = entreprises.stream().map(Entreprise::getId).toList();
        // Batch fetch des membres + personne pour éviter N+1 et lazy
        Map<String, List<EntrepriseMembre>> membresByEntreprise = ids.isEmpty() ? Map.of() :
                entrepriseMembreRepository.findByEntrepriseIdsWithPersonne(ids)
                    .stream()
                    .collect(Collectors.groupingBy(em -> em.getEntreprise().getId()));

        Page<EntrepriseResponse> mapped = page.map(e -> {
            EntrepriseResponse r = toResponseShallow(e);
            List<EntrepriseMembre> ems = membresByEntreprise.get(e.getId());
            if (ems != null) {
                r.membres = ems.stream().map(this::mapMembre).toList();
            }
            return r;
        });
        return ResponseEntity.ok(mapped);
    }

    /**
     * Liste paginée des entreprises bannies.
     */
    @GetMapping("/bannis")
    public ResponseEntity<Page<EntrepriseResponse>> listEntreprisesBannies(Pageable pageable) {
        Page<Entreprise> page = entrepriseService.listBanned(pageable);
        // on inclut les membres comme pour la liste standard
        List<Entreprise> entreprises = page.getContent();
        List<String> ids = entreprises.stream().map(Entreprise::getId).toList();
        Map<String, List<EntrepriseMembre>> membresByEntreprise = ids.isEmpty() ? Map.of() :
                entrepriseMembreRepository.findByEntrepriseIdsWithPersonne(ids)
                    .stream()
                    .collect(Collectors.groupingBy(em -> em.getEntreprise().getId()));
        Page<EntrepriseResponse> mapped = page.map(e -> {
            EntrepriseResponse r = toResponseShallow(e);
            List<EntrepriseMembre> ems = membresByEntreprise.get(e.getId());
            if (ems != null) {
                r.membres = ems.stream().map(this::mapMembre).toList();
            }
            return r;
        });
        return ResponseEntity.ok(mapped);
    }

    /**
     * Récupère une entreprise par son identifiant.
     */
    @GetMapping("/{id}")
    public ResponseEntity<EntrepriseResponse> getEntrepriseById(@PathVariable String id) {
        // Charger avec fetch join pour inclure membres et personnes
        Entreprise e = entrepriseRepository.findByIdWithMembres(id)
            .orElseThrow(() -> new NotFoundException("Entreprise introuvable: " + id));
        return ResponseEntity.ok(toResponse(e));
    }

    /**
     * Bannir une entreprise (avec motif obligatoire).
     */
    @PostMapping("/{id}/ban")
    public ResponseEntity<EntrepriseResponse> ban(@PathVariable String id, @RequestBody @Valid BanEntrepriseRequest req) {
        Entreprise e = entrepriseService.ban(id, req);
        return ResponseEntity.ok(toResponseShallow(e));
    }

    /**
     * Dé-bannir une entreprise.
     */
    @PostMapping("/{id}/unban")
    public ResponseEntity<EntrepriseResponse> unban(@PathVariable String id) {
        Entreprise e = entrepriseService.unban(id);
        return ResponseEntity.ok(toResponseShallow(e));
    }

    /**
     * Test endpoint pour vérifier l'assignation
     */
    @GetMapping("/{id}/test-assign")
    public ResponseEntity<Map<String, Object>> testAssign(@PathVariable String id, HttpServletRequest httpRequest) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Vérifier si l'entreprise existe
            Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(id);
            result.put("entrepriseExists", entrepriseOpt.isPresent());
            
            if (entrepriseOpt.isPresent()) {
                Entreprise e = entrepriseOpt.get();
                result.put("entrepriseName", e.getNom());
                result.put("etapeValidation", e.getEtapeValidation() != null ? e.getEtapeValidation().name() : "NULL");
                result.put("currentAssignedTo", e.getAssignedTo() != null ? e.getAssignedTo().getId() : null);
            }
            
            // Vérifier le token
            String token = httpRequest.getHeader("Authorization");
            result.put("tokenPresent", token != null);
            
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                try {
                    String username = jwtUtil.getUsernameFromToken(token);
                    result.put("username", username);
                    
                    Optional<Utilisateurs> userOpt = utilisateursRepository.findByUtilisateur(username);
                    result.put("userExists", userOpt.isPresent());
                    
                    if (userOpt.isPresent()) {
                        Utilisateurs user = userOpt.get();
                        result.put("userId", user.getId());
                        result.put("userPersonne", user.getPersonne() != null ? "EXISTS" : "NULL");
                        if (user.getPersonne() != null) {
                            result.put("userRole", user.getPersonne().getRole() != null ? user.getPersonne().getRole().name() : "NO_ROLE");
                        }
                    }
                } catch (Exception e) {
                    result.put("tokenError", e.getMessage());
                }
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * Assigner une entreprise à un agent.
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<EntrepriseResponse> assignToAgent(
            @PathVariable String id, 
            @RequestBody(required = false) Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        System.out.println("🔍 [ASSIGN] Début assignation entreprise ID: " + id);
        System.out.println("🔍 [ASSIGN] Request body: " + request);
        
        // Récupérer l'agent connecté depuis le token JWT
        String token = httpRequest.getHeader("Authorization");
        System.out.println("🔍 [ASSIGN] Token présent: " + (token != null));
        
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        String agentUsername = jwtUtil.getUsernameFromToken(token);
        Utilisateurs agent = utilisateursRepository.findByUtilisateur(agentUsername)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
        
        // Assigner l'entreprise à l'agent connecté ou à un agent spécifique
        String targetAgentId = (request != null) ? request.get("agentId") : null;
        Utilisateurs targetAgent = agent; // Par défaut, s'assigner à soi-même
        
        System.out.println("🔍 [ASSIGN] Agent connecté: " + agent.getUtilisateur());
        System.out.println("🔍 [ASSIGN] Target agent ID: " + targetAgentId);
        
        if (targetAgentId != null && !targetAgentId.isEmpty()) {
            System.out.println("🔍 [ASSIGN] Recherche agent par ID: " + targetAgentId);
            
            // Essayer d'abord par ID utilisateur
            Optional<Utilisateurs> userById = utilisateursRepository.findById(targetAgentId);
            if (userById.isPresent()) {
                System.out.println("✅ [ASSIGN] Agent trouvé par ID utilisateur");
                targetAgent = userById.get();
            } else {
                // Fallback: chercher par personne_id
                System.out.println("🔍 [ASSIGN] Agent non trouvé par ID utilisateur, recherche par personne_id");
                Optional<Utilisateurs> userByPersonId = utilisateursRepository.findByPersonneId(targetAgentId);
                if (userByPersonId.isPresent()) {
                    System.out.println("✅ [ASSIGN] Agent trouvé par personne_id");
                    targetAgent = userByPersonId.get();
                } else {
                    System.err.println("❌ [ASSIGN] Agent non trouvé ni par ID utilisateur ni par personne_id: " + targetAgentId);
                    throw new RuntimeException("Agent cible non trouvé pour ID: " + targetAgentId);
                }
            }
        }
        
        try {
            Entreprise entreprise = entrepriseService.assignToAgent(id, targetAgent);
            System.out.println("✅ [ASSIGN] Assignation réussie pour entreprise: " + id);
            return ResponseEntity.ok(toResponseShallow(entreprise));
        } catch (Exception e) {
            System.err.println("❌ [ASSIGN] Erreur lors de l'assignation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Désassigner une entreprise (la remettre dans la liste commune).
     */
    @PatchMapping("/{id}/unassign")
    public ResponseEntity<EntrepriseResponse> unassignFromAgent(@PathVariable String id) {
        Entreprise entreprise = entrepriseService.unassignFromAgent(id);
        return ResponseEntity.ok(toResponseShallow(entreprise));
    }

    /**
     * Récupérer les entreprises NON ASSIGNÉES pour éviter les conflits entre agents.
     */
    @GetMapping("/unassigned")
    public ResponseEntity<Page<EntrepriseResponse>> getUnassignedEntreprises(
            @RequestParam(value = "etape", defaultValue = "ACCUEIL") String etape,
            Pageable pageable) {
        
        System.out.println("🔍 [UNASSIGNED] Récupération des entreprises non assignées pour l'étape: " + etape);
        
        try {
            EtapeValidation etapeValidation = EtapeValidation.valueOf(etape.toUpperCase());
            Page<Entreprise> page = entrepriseRepository.findByEtapeValidationAndAssignedToIsNull(etapeValidation, pageable);
            
            System.out.println("✅ [UNASSIGNED] Trouvé " + page.getTotalElements() + " entreprises non assignées");
            
            // Récupérer les IDs des entreprises de la page
            List<Entreprise> entreprises = page.getContent();
            List<String> ids = entreprises.stream().map(Entreprise::getId).toList();
            
            // Batch fetch des membres + personne pour éviter N+1 et lazy
            Map<String, List<EntrepriseMembre>> membresByEntreprise = ids.isEmpty() ? Map.of() :
                    entrepriseMembreRepository.findByEntrepriseIdsWithPersonne(ids)
                        .stream()
                        .collect(Collectors.groupingBy(em -> em.getEntreprise().getId()));

            Page<EntrepriseResponse> mapped = page.map(e -> {
                EntrepriseResponse r = toResponseShallow(e);
                List<EntrepriseMembre> ems = membresByEntreprise.get(e.getId());
                if (ems != null) {
                    r.membres = ems.stream().map(em -> {
                        MembreResponse mr = new MembreResponse();
                        if (em.getPersonne() != null) {
                            mr.personId = em.getPersonne().getId();
                            mr.nom = em.getPersonne().getNom();
                            mr.prenom = em.getPersonne().getPrenom();
                        }
                        mr.role = em.getRole();
                        mr.pourcentageParts = em.getPourcentageParts();
                        mr.dateDebut = em.getDateDebut();
                        mr.dateFin = em.getDateFin();
                        return mr;
                    }).toList();
                }
                return r;
            });
            
            return ResponseEntity.ok(mapped);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ [UNASSIGNED] Étape invalide: " + etape);
            throw new RuntimeException("Étape de validation invalide: " + etape);
        }
    }

    /**
     * Récupérer les entreprises assignées à l'agent connecté.
     */
    @GetMapping("/assigned-to-me")
    public ResponseEntity<Page<EntrepriseResponse>> getAssignedToMe(
            Pageable pageable,
            HttpServletRequest httpRequest) {
        
        try {
            System.out.println("🔍 [ASSIGNED-TO-ME] Début de la requête");
            
            // Récupérer l'agent connecté
            String token = httpRequest.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            String agentUsername = jwtUtil.getUsernameFromToken(token);
            System.out.println("🔍 [ASSIGNED-TO-ME] Agent username: " + agentUsername);
            
            Utilisateurs agent = utilisateursRepository.findByUtilisateur(agentUsername)
                .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
            
            System.out.println("🔍 [ASSIGNED-TO-ME] Agent ID: " + agent.getId());
            
            Page<Entreprise> page = entrepriseService.getAssignedToAgent(agent.getId(), pageable);
            System.out.println("🔍 [ASSIGNED-TO-ME] Nombre d'entreprises assignées: " + page.getTotalElements());
            
            // Récupérer les IDs et batch fetch des membres
            List<Entreprise> entreprises = page.getContent();
            List<String> ids = entreprises.stream().map(Entreprise::getId).toList();
            Map<String, List<EntrepriseMembre>> membresByEntreprise = ids.isEmpty() ? Map.of() :
                    entrepriseMembreRepository.findByEntrepriseIdsWithPersonne(ids)
                        .stream()
                        .collect(Collectors.groupingBy(em -> em.getEntreprise().getId()));

            Page<EntrepriseResponse> mapped = page.map(e -> {
                EntrepriseResponse r = toResponseShallow(e);
                List<EntrepriseMembre> ems = membresByEntreprise.get(e.getId());
                if (ems != null) {
                    r.membres = ems.stream().map(em -> {
                        MembreResponse mr = new MembreResponse();
                        if (em.getPersonne() != null) {
                            mr.personId = em.getPersonne().getId();
                            mr.nom = em.getPersonne().getNom();
                            mr.prenom = em.getPersonne().getPrenom();
                        }
                        mr.role = em.getRole();
                        mr.pourcentageParts = em.getPourcentageParts();
                        mr.dateDebut = em.getDateDebut();
                        mr.dateFin = em.getDateFin();
                        return mr;
                    }).collect(Collectors.toList());
                }
                return r;
            });
            
            System.out.println("✅ [ASSIGNED-TO-ME] Succès");
            return ResponseEntity.ok(mapped);
            
        } catch (Exception e) {
            System.err.println("❌ [ASSIGNED-TO-ME] Erreur: " + e.getMessage());
            e.printStackTrace();
            
            // Retourner une page vide en cas d'erreur pour éviter le crash du frontend
            Page<EntrepriseResponse> emptyPage = Page.empty(pageable);
            return ResponseEntity.ok(emptyPage);
        }
    }

    /**
     * Mise à jour partielle d'une entreprise.
     */
    @PutMapping("/{id}")
    public ResponseEntity<EntrepriseResponse> update(@PathVariable String id, @RequestBody @Valid UpdateEntrepriseRequest req) {
        Entreprise e = entrepriseService.updateEntreprise(id, req);
        return ResponseEntity.ok(toResponseShallow(e));
    }

    /**
     * Récupère les entreprises de l'utilisateur connecté.
     */
    @GetMapping("/my-applications")
    public ResponseEntity<List<EntrepriseResponse>> getMyApplications(HttpServletRequest request) {
        System.out.println("🔍 DEBUG - Appel de /my-applications");
        
        try {
            // Récupérer l'utilisateur connecté depuis le token JWT
            String currentUserId = getCurrentUserId(request);
            System.out.println("🔍 DEBUG - currentUserId: " + currentUserId);
            
            if (currentUserId == null) {
                System.out.println("❌ DEBUG - Utilisateur non authentifié ou pas de personne associée");
                // Retourner une liste vide au lieu de lever une exception
                return ResponseEntity.ok(List.of());
            }
            
            // Récupérer les entreprises où l'utilisateur est membre
            List<EntrepriseMembre> memberships = entrepriseMembreRepository.findByPersonne_Id(currentUserId);
            System.out.println("🔍 DEBUG - Nombre de memberships trouvés: " + memberships.size());
            
            // Extraire les entreprises et les mapper
            List<EntrepriseResponse> applications = memberships.stream()
                .map(em -> {
                    Entreprise entreprise = em.getEntreprise();
                    System.out.println("🔍 DEBUG - Entreprise trouvée: " + entreprise.getNom());
                    System.out.println("🔍 DEBUG - Type entreprise: " + entreprise.getTypeEntreprise());
                    System.out.println("🔍 DEBUG - Forme juridique: " + entreprise.getFormeJuridique());
                    System.out.println("🔍 DEBUG - Référence: " + entreprise.getReference());
                    return entreprise;
                })
                .distinct()
                .map(this::toResponseShallow)
                .collect(Collectors.toList());
                
            System.out.println("🔍 DEBUG - Nombre d'applications retournées: " + applications.size());
            return ResponseEntity.ok(applications);
            
        } catch (Exception e) {
            System.err.println("❌ DEBUG - Erreur dans /my-applications: " + e.getMessage());
            e.printStackTrace();
            // Retourner une liste vide en cas d'erreur pour éviter le crash du frontend
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Récupère les membres (personnes liées) d'une entreprise.
     */
    @GetMapping("/{id}/membres")
    public ResponseEntity<List<MembreResponse>> getMembres(@PathVariable String id) {
        // Vérifier l'existence pour un 404 propre
        if (!entrepriseRepository.existsById(id)) {
            throw new NotFoundException("Entreprise introuvable: " + id);
        }
        // Charger avec fetch join la personne pour éviter les proxies
        List<EntrepriseMembre> membres = entrepriseMembreRepository.findByEntrepriseIdWithPersonne(id);
        List<MembreResponse> out = membres.stream().map(em -> {
            MembreResponse mr = new MembreResponse();
            if (em.getPersonne() != null) {
                mr.personId = em.getPersonne().getId();
                mr.nom = em.getPersonne().getNom();
                mr.prenom = em.getPersonne().getPrenom();
            }
            mr.role = em.getRole();
            mr.pourcentageParts = em.getPourcentageParts();
            mr.dateDebut = em.getDateDebut();
            mr.dateFin = em.getDateFin();
            return mr;
        }).toList();
        return ResponseEntity.ok(out);
    }

    /**
     * Mappe une entité Entreprise vers une réponse API minimale.
     * - Projette les informations de base
     * - Remonte la hiérarchie de Divisions (QUARTIER -> ... -> REGION) via le parent
     */
    private EntrepriseResponse toResponse(Entreprise e) {
        EntrepriseResponse r = new EntrepriseResponse();
        r.id = e.getId();
        r.reference = e.getReference();
        r.nom = e.getNom();
        r.sigle = e.getSigle();
        r.capitale = e.getCapitale();
        r.activiteSecondaire = e.getActiviteSecondaire();
        r.typeEntreprise = e.getTypeEntreprise();
        r.statutCreation = e.getStatutCreation();
        r.etapeValidation = e.getEtapeValidation();
        r.formeJuridique = e.getFormeJuridique();
        r.domaineActivite = e.getDomaineActivite();
        r.statutSociete = e.getStatutSociete();

        Divisions d = e.getDivision();
        if (d != null) {
            r.divisionCode = d.getCode();
            r.divisionNom = d.getNom();

            // Remonter la hiérarchie parentale jusqu'à la racine (REGION)
            Divisions cursor = d;
            while (cursor != null) {
                DivisionType type = cursor.getDivisionType();
                if (type != null) {
                    switch (type) {
                        case REGION -> { 
                            // Division de type REGION
                            r.regionCode = cursor.getCode(); 
                            r.regionNom = cursor.getNom(); 
                        }
                        case CERCLE -> { 
                            // Division de type CERCLE
                            r.cercleCode = cursor.getCode(); 
                            r.cercleNom = cursor.getNom(); 
                        }
                        case ARRONDISSEMENT -> { 
                            // Division de type ARRONDISSEMENT
                            r.arrondissementCode = cursor.getCode(); 
                            r.arrondissementNom = cursor.getNom(); 
                        }
                        case COMMUNE -> { 
                            // Division de type COMMUNE
                            r.communeCode = cursor.getCode(); 
                            r.communeNom = cursor.getNom(); 
                        }
                        case QUARTIER -> { 
                            // Division de type QUARTIER
                            r.quartierCode = cursor.getCode(); 
                            r.quartierNom = cursor.getNom(); 
                        }
                        default -> {}
                    }
                }
                cursor = cursor.getParent();
            }
        }

        r.creation = e.getCreation();
        r.modification = e.getModification();
        r.banni = e.getBanni();
        r.motifBannissement = e.getMotifBannissement();
        r.dateBannissement = e.getDateBannissement();
        r.totalAmount = e.getTotalAmount();

        // Map des membres (personnes liées) avec rôle et parts
        if (e.getMembres() != null) {
            r.membres = e.getMembres().stream().map(this::mapMembre).toList();
        }
        return r;
    }

    // Méthode utilitaire pour mapper un membre
    private MembreResponse mapMembre(EntrepriseMembre em) {
        MembreResponse mr = new MembreResponse();
        if (em.getPersonne() != null) {
            mr.personId = em.getPersonne().getId();
            mr.nom = em.getPersonne().getNom();
            mr.prenom = em.getPersonne().getPrenom();
            mr.email = em.getPersonne().getEmail();
            mr.telephone = em.getPersonne().getTelephone1(); // Correction: telephone1
            // Conversion Date vers LocalDate
            if (em.getPersonne().getDateNaissance() != null) {
                mr.dateNaissance = em.getPersonne().getDateNaissance().toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            }
            // Conversion enum vers Boolean (true = marié, false = célibataire/autre)
            if (em.getPersonne().getSituationMatrimoniale() != null) {
                mr.situationMatrimoniale = em.getPersonne().getSituationMatrimoniale() == 
                    abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales.MARIE;
            }
        }
        mr.role = em.getRole();
        mr.pourcentageParts = em.getPourcentageParts();
        mr.dateDebut = em.getDateDebut();
        mr.dateFin = em.getDateFin();
        return mr;
    }

    // Mapping léger sans membres (utilisé pour la liste paginée)
    private EntrepriseResponse toResponseShallow(Entreprise e) {
        EntrepriseResponse r = new EntrepriseResponse();
        r.id = e.getId();
        r.reference = e.getReference();
        r.nom = e.getNom();
        r.sigle = e.getSigle();
        r.capitale = e.getCapitale();
        r.activiteSecondaire = e.getActiviteSecondaire();
        r.typeEntreprise = e.getTypeEntreprise();
        r.statutCreation = e.getStatutCreation();
        r.etapeValidation = e.getEtapeValidation();
        r.formeJuridique = e.getFormeJuridique();
        r.domaineActivite = e.getDomaineActivite();

        Divisions d = e.getDivision();
        if (d != null) {
            r.divisionCode = d.getCode();
            r.divisionNom = d.getNom();

            Divisions cursor = d;
            while (cursor != null) {
                DivisionType type = cursor.getDivisionType();
                if (type != null) {
                    switch (type) {
                        case REGION -> { r.regionCode = cursor.getCode(); r.regionNom = cursor.getNom(); }
                        case CERCLE -> { r.cercleCode = cursor.getCode(); r.cercleNom = cursor.getNom(); }
                        case ARRONDISSEMENT -> { r.arrondissementCode = cursor.getCode(); r.arrondissementNom = cursor.getNom(); }
                        case COMMUNE -> { r.communeCode = cursor.getCode(); r.communeNom = cursor.getNom(); }
                        case QUARTIER -> { r.quartierCode = cursor.getCode(); r.quartierNom = cursor.getNom(); }
                        default -> {}
                    }
                }
                cursor = cursor.getParent();
            }
        }
        r.creation = e.getCreation();
        r.modification = e.getModification();
        r.banni = e.getBanni();
        r.motifBannissement = e.getMotifBannissement();
        r.dateBannissement = e.getDateBannissement();
        r.totalAmount = e.getTotalAmount();
        
        // Mapper l'agent assigné
        if (e.getAssignedTo() != null) {
            r.assignedTo = new UtilisateursResponse();
            r.assignedTo.id = e.getAssignedTo().getId();
            r.assignedTo.utilisateur = e.getAssignedTo().getUtilisateur();
            if (e.getAssignedTo().getPersonne() != null) {
                r.assignedTo.email = e.getAssignedTo().getPersonne().getEmail();
                r.assignedTo.nom = e.getAssignedTo().getPersonne().getNom();
                r.assignedTo.prenom = e.getAssignedTo().getPersonne().getPrenom();
            }
        }
        
        return r;
    }

    /**
     * Méthodes utilitaires pour le traitement des documents
     */
    private String findFounderId(Entreprise entreprise) {
        return entrepriseMembreRepository.findByEntreprise_IdAndRole(entreprise.getId(), 
            abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole.DIRIGEANT)
            .stream()
            .findFirst()
            .map(em -> em.getPersonne() != null ? em.getPersonne().getId() : null)
            .orElse(null);
    }

    private String findGerantId(Entreprise entreprise) {
        return entrepriseMembreRepository.findByEntreprise_IdAndRole(entreprise.getId(), 
            abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole.GERANT)
            .stream()
            .findFirst()
            .map(em -> em.getPersonne() != null ? em.getPersonne().getId() : null)
            .orElse(null);
    }

    private void processParticipantDocuments(Map<String, Object> allParams, Entreprise entreprise) {
        // Traiter les documents des participants (pièces d'identité, casier judiciaire, acte de mariage)
        System.out.println("🔍 DEBUG - Tous les paramètres reçus:");
        allParams.forEach((k, v) -> {
            if (k.startsWith("participant_")) {
                System.out.println("  " + k + " = " + (v instanceof MultipartFile ? "FILE: " + ((MultipartFile)v).getOriginalFilename() : "'" + v + "'"));
            }
        });
        
        allParams.forEach((key, value) -> {
            try {
                if (key.startsWith("participant_") && key.endsWith("_document") && value instanceof MultipartFile) {
                    MultipartFile file = (MultipartFile) value;
                    if (!file.isEmpty()) {
                        // Extraire l'index du participant
                        String indexStr = key.substring("participant_".length(), key.indexOf("_document"));
                        
                        // Récupérer les métadonnées associées
                        String personId = (String) allParams.get("participant_" + indexStr + "_personId");
                        String typePieceStr = (String) allParams.get("participant_" + indexStr + "_typePiece");
                        String numeroPiece = (String) allParams.get("participant_" + indexStr + "_numeroPiece");
                        
                        // Debug: afficher les valeurs récupérées
                        System.out.println("🔍 DEBUG Document participant " + indexStr + ":");
                        System.out.println("  - personId: '" + personId + "'");
                        System.out.println("  - typePieceStr: '" + typePieceStr + "'");
                        System.out.println("  - numeroPiece: '" + numeroPiece + "'");
                        
                        if (personId != null && !personId.isEmpty() && 
                            typePieceStr != null && !typePieceStr.isEmpty() && 
                            numeroPiece != null && !numeroPiece.isEmpty()) {
                            TypePieces typePiece = TypePieces.valueOf(typePieceStr);
                            // Date d'expiration par défaut (5 ans)
                            java.time.LocalDate dateExpiration = java.time.LocalDate.now().plusYears(5);
                            
                            System.out.println("  ✅ Appel uploadPiece avec numeroPiece: '" + numeroPiece + "'");
                            documentsService.uploadPiece(personId, entreprise.getId(), 
                                typePiece, numeroPiece, dateExpiration, file);
                        } else {
                            System.out.println("  ❌ Paramètres manquants pour le document participant " + indexStr);
                        }
                    }
                } else if (key.startsWith("participant_") && key.endsWith("_casierJudiciaire") && value instanceof MultipartFile) {
                    MultipartFile file = (MultipartFile) value;
                    if (!file.isEmpty()) {
                        String indexStr = key.substring("participant_".length(), key.indexOf("_casierJudiciaire"));
                        String personId = (String) allParams.get("participant_" + indexStr + "_personId_casier");
                        
                        if (personId != null) {
                            documentsService.uploadDocument(personId, entreprise.getId(), 
                                TypeDocuments.CASIER_JUDICIAIRE, "CJ-" + entreprise.getReference() + "-" + indexStr, file);
                        }
                    }
                } else if (key.startsWith("participant_") && key.endsWith("_acteMariage") && value instanceof MultipartFile) {
                    MultipartFile file = (MultipartFile) value;
                    if (!file.isEmpty()) {
                        String indexStr = key.substring("participant_".length(), key.indexOf("_acteMariage"));
                        String personId = (String) allParams.get("participant_" + indexStr + "_personId_mariage");
                        
                        if (personId != null) {
                            documentsService.uploadDocument(personId, entreprise.getId(), 
                                TypeDocuments.ACTE_MARIAGE, "AM-" + entreprise.getReference() + "-" + indexStr, file);
                        }
                    }
                }
            } catch (Exception e) {
                // Log l'erreur mais ne pas faire échouer toute la création
                System.err.println("Erreur lors du traitement du document " + key + ": " + e.getMessage());
            }
        });
    }

    /**
     * Récupère l'ID de l'utilisateur connecté depuis le token JWT.
     */
    private String getCurrentUserId(HttpServletRequest request) {
        try {
            // Récupérer le token depuis l'en-tête Authorization
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("🔍 DEBUG - Pas de token Authorization ou format incorrect");
                return null;
            }
            
            String token = authHeader.substring(7);
            String email = jwtUtil.getUsernameFromToken(token);
            System.out.println("🔍 DEBUG - Email extrait du token: " + email);
            
            if (email == null) {
                System.out.println("❌ DEBUG - Impossible d'extraire l'email du token");
                return null;
            }
            
            // Trouver l'utilisateur par email et récupérer l'ID de la personne
            return utilisateursRepository.findByUtilisateur(email)
                .map(user -> {
                    System.out.println("🔍 DEBUG - Utilisateur trouvé: " + user.getUtilisateur());
                    if (user.getPersonne() != null) {
                        System.out.println("🔍 DEBUG - Personne associée ID: " + user.getPersonne().getId());
                        return user.getPersonne().getId();
                    } else {
                        System.out.println("❌ DEBUG - Utilisateur trouvé mais pas de personne associée");
                        return null;
                    }
                })
                .orElse(null);
                
        } catch (Exception e) {
            System.err.println("❌ DEBUG - Erreur lors de la récupération de l'utilisateur connecté: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}
