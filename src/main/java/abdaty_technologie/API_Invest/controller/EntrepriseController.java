package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.DivisionType;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.service.InvestmentAgreementService;
import abdaty_technologie.API_Invest.service.AgrementWorkflowService;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.dto.request.EntrepriseRequest;
import abdaty_technologie.API_Invest.dto.response.EntrepriseResponse;
import abdaty_technologie.API_Invest.dto.response.MembreResponse;
import abdaty_technologie.API_Invest.dto.response.UtilisateursResponse;
import abdaty_technologie.API_Invest.dto.response.CreateurResponse;
import abdaty_technologie.API_Invest.dto.request.BanEntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.UpdateEntrepriseRequest;
import abdaty_technologie.API_Invest.service.EntrepriseService;
import abdaty_technologie.API_Invest.service.DocumentsService;
import abdaty_technologie.API_Invest.service.PersonsService;
import abdaty_technologie.API_Invest.service.InstatApiService;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import jakarta.validation.Valid;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import com.fasterxml.jackson.databind.ObjectMapper;
import abdaty_technologie.API_Invest.util.JwtUtil;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import org.springframework.web.bind.annotation.PatchMapping;
import abdaty_technologie.API_Invest.service.AgrementService;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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

    @Autowired
    private PersonsRepository personsRepository;
    
    @Autowired
    private PersonsService personsService;
    
    @Autowired
    private InvestmentAgreementService investmentAgreementService;
    
    @Autowired
    private AgrementWorkflowService agrementWorkflowService;
    
    @Autowired
    private AgrementService agrementService;
    
    @Autowired
    private DivisionsRepository divisionsRepository;
    
    @Autowired
    private InstatApiService instatApiService;

    /**
     * Crée une entreprise.
     * - Valide la requête (@Valid)
     * - Délègue au service qui génère la référence (CE-YYYY-MM-DD-#####)
     * - Retourne une réponse épurée (EntrepriseResponse)
     */
    @PostMapping
    public ResponseEntity<EntrepriseResponse> Entreprise(@RequestBody @Valid EntrepriseRequest request, HttpServletRequest httpRequest) {
        // Log pour débugger les participants reçus
        System.out.println("🔍 [EntrepriseController] Participants reçus:");
        if (request.participants != null) {
            for (int i = 0; i < request.participants.size(); i++) {
                var p = request.participants.get(i);
                System.out.println("  Participant " + (i+1) + ": " + p.personId + " - Rôle: " + p.role + " - Parts: " + p.pourcentageParts);
            }
        }
        
        // Récupérer l'utilisateur connecté
        String currentUserEmail = getCurrentUserEmail(httpRequest);
        Utilisateurs currentUser = utilisateursRepository.findByUtilisateur(currentUserEmail)
            .orElseThrow(() -> new BadRequestException("Utilisateur connecté introuvable"));
            
        try {
            System.out.println("🏢 [EntrepriseController] Appel createEntreprise avec divisionCode: " + request.divisionCode);
            Entreprise created = entrepriseService.createEntreprise(request, currentUser);
            System.out.println("✅ [EntrepriseController] Entreprise créée avec succès: " + created.getId());
            return ResponseEntity.ok(toResponse(created));
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] Erreur création entreprise: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-lancer l'exception pour que Spring la gère
        }
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
            @RequestParam Map<String, Object> allParams,
            HttpServletRequest httpRequest) {
        
        try {
            // Parser les données JSON de l'entreprise
            EntrepriseRequest request = objectMapper.readValue(entrepriseDataJson, EntrepriseRequest.class);
            
            // Récupérer l'utilisateur connecté
            String currentUserEmail = getCurrentUserEmail(httpRequest);
            Utilisateurs currentUser = utilisateursRepository.findByUtilisateur(currentUserEmail)
                .orElseThrow(() -> new BadRequestException("Utilisateur connecté introuvable"));
            
            // Créer l'entreprise d'abord
            Entreprise created = entrepriseService.createEntreprise(request, currentUser);
            
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
     * - Filtres optionnels: divisionCode, etapeValidation, nom, reference, statut
     */
    @GetMapping
    public ResponseEntity<Page<EntrepriseResponse>> listEntreprises(
            @RequestParam(value = "divisionCode", required = false) String divisionCode,
            @RequestParam(value = "etapeValidation", required = false) String etapeValidation,
            @RequestParam(value = "nom", required = false) String nom,
            @RequestParam(value = "reference", required = false) String reference,
            @RequestParam(value = "statut", required = false) String statut,
            Pageable pageable,
            HttpServletRequest httpRequest) {
        
        try {
            System.out.println("🔍 [EntrepriseController] Début listEntreprises - divisionCode: " + divisionCode + ", etapeValidation: " + etapeValidation + ", nom: " + nom + ", reference: " + reference + ", statut: " + statut);
            Page<Entreprise> page = entrepriseService.listEntreprises(divisionCode, etapeValidation, nom, reference, statut, pageable);
            System.out.println("✅ [EntrepriseController] Entreprises chargées: " + page.getTotalElements());
            
            // Appliquer le filtrage par antenne de l'agent
            page = filterByAgentAntenne(page, httpRequest, pageable);
            System.out.println("🚨 [EntrepriseController] APRÈS FILTRAGE ANTENNE - " + page.getContent().size() + " entreprises restantes");
            
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
            
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] ERREUR dans listEntreprises: " + e.getMessage());
            e.printStackTrace();
            // Retourner une page vide en cas d'erreur pour éviter le crash
            return ResponseEntity.ok(Page.empty(pageable));
        }
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
        // Charger avec fetch join pour inclure membres, personnes ET paiement
        Entreprise e = entrepriseRepository.findByIdWithMembresAndPaiement(id)
            .orElseThrow(() -> new NotFoundException("Entreprise introuvable: " + id));
        
        // LOG DE DEBUG POUR DIAGNOSTIQUER LE PROBLÈME
        System.out.println("🔍 [DEBUG] Entreprise chargée: " + e.getNom());
        System.out.println("🔍 [DEBUG] Paiement associé: " + (e.getPaiement() != null ? "OUI" : "NON"));
        if (e.getPaiement() != null) {
            System.out.println("🔍 [DEBUG] Statut paiement: " + e.getPaiement().getStatut());
            System.out.println("🔍 [DEBUG] Montant paiement: " + e.getPaiement().getMontant());
            System.out.println("🔍 [DEBUG] Référence paiement: " + e.getPaiement().getReferenceTransaction());
        }
        
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
     * Met à jour les informations d'une entreprise existante.
     */
    @PutMapping("/{id}")
    public ResponseEntity<EntrepriseResponse> updateEntreprise(
            @PathVariable String id,
            @RequestBody UpdateEntrepriseRequest request) {

        Entreprise updated = entrepriseService.updateEntreprise(id, request);
        return ResponseEntity.ok(toResponse(updated));
    }

    /**
     * Test endpoint pour vérifier le filtrage par antenne
     */
    @GetMapping("/test-filtering")
    public ResponseEntity<Map<String, Object>> testFiltering(HttpServletRequest httpRequest) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Récupérer toutes les entreprises
            Page<Entreprise> allEntreprises = entrepriseRepository.findAll(PageRequest.of(0, 10));
            result.put("totalEntreprises", allEntreprises.getContent().size());
            
            // Appliquer le filtrage
            Page<Entreprise> filtered = filterByAgentAntenne(allEntreprises, httpRequest, PageRequest.of(0, 10));
            result.put("filteredEntreprises", filtered.getContent().size());
            
            // Détails des entreprises avec division_id ET divisionCode
            List<Map<String, Object>> details = new ArrayList<>();
            for (Entreprise e : allEntreprises.getContent()) {
                Map<String, Object> detail = new HashMap<>();
                detail.put("nom", e.getNom());
                detail.put("divisionCode", e.getDivisionCode());
                detail.put("division_id", e.getDivision() != null ? e.getDivision().getId() : null);
                detail.put("division_nom", e.getDivision() != null ? e.getDivision().getNom() : null);
                detail.put("regionCode", e.getDivisionCode() != null && e.getDivisionCode().length() >= 2 ? 
                    e.getDivisionCode().substring(0, 2) : "N/A");
                detail.put("hasNewCode", e.getDivisionCode() != null && !e.getDivisionCode().isBlank());
                detail.put("hasOldDivision", e.getDivision() != null && e.getDivision().getId() != null);
                details.add(detail);
            }
            result.put("entrepriseDetails", details);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * Endpoint de migration pour mettre à jour les divisionCode manquants
     */
    @GetMapping("/migrate-division-codes")
    public ResponseEntity<Map<String, Object>> migrateDivisionCodes() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Récupérer toutes les entreprises sans divisionCode mais avec division
            List<Entreprise> entreprisesToMigrate = entrepriseRepository.findAll().stream()
                .filter(e -> (e.getDivisionCode() == null || e.getDivisionCode().isBlank()) 
                          && e.getDivision() != null 
                          && e.getDivision().getCode() != null)
                .collect(Collectors.toList());
            
            result.put("entreprisesToMigrate", entreprisesToMigrate.size());
            
            List<Map<String, Object>> migrationDetails = new ArrayList<>();
            int migrated = 0;
            
            for (Entreprise entreprise : entreprisesToMigrate) {
                try {
                    String oldDivisionCode = entreprise.getDivisionCode();
                    String newDivisionCode = entreprise.getDivision().getCode();
                    
                    // Mettre à jour le divisionCode
                    entreprise.setDivisionCode(newDivisionCode);
                    entrepriseRepository.save(entreprise);
                    
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("nom", entreprise.getNom());
                    detail.put("id", entreprise.getId());
                    detail.put("oldDivisionCode", oldDivisionCode);
                    detail.put("newDivisionCode", newDivisionCode);
                    detail.put("divisionNom", entreprise.getDivision().getNom());
                    detail.put("status", "SUCCESS");
                    migrationDetails.add(detail);
                    
                    migrated++;
                    
                } catch (Exception e) {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("nom", entreprise.getNom());
                    detail.put("id", entreprise.getId());
                    detail.put("error", e.getMessage());
                    detail.put("status", "ERROR");
                    migrationDetails.add(detail);
                }
            }
            
            result.put("migratedCount", migrated);
            result.put("migrationDetails", migrationDetails);
            result.put("success", true);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("success", false);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * Endpoint de diagnostic pour tester getAgentAntennes
     */
    @GetMapping("/test-agent-antennes")
    public ResponseEntity<Map<String, Object>> testAgentAntennes(HttpServletRequest httpRequest) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Extraire le token JWT
            String token = httpRequest.getHeader("Authorization");
            result.put("hasToken", token != null);
            
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                result.put("tokenExtracted", true);
                
                // Récupérer l'email de l'agent depuis le token
                String agentEmail = jwtUtil.getUsernameFromToken(token);
                result.put("agentEmail", agentEmail);
                
                // Récupérer l'agent depuis la table Persons
                Optional<Persons> agentOpt = personsRepository.findByEmail(agentEmail);
                result.put("agentFound", agentOpt.isPresent());
                
                if (agentOpt.isPresent()) {
                    Persons agent = agentOpt.get();
                    result.put("agentId", agent.getId());
                    result.put("agentRole", agent.getRole());
                    result.put("antenneAgent", agent.getAntenneAgent());
                    
                    // Tester getAgentAntennes
                    List<AntenneAgents> agentAntennes = personsService.getAgentAntennes(agent.getId());
                    result.put("antennes", agentAntennes.stream().map(AntenneAgents::name).toList());
                    result.put("antennesCount", agentAntennes.size());
                    result.put("antennesEmpty", agentAntennes.isEmpty());
                }
            } else {
                result.put("tokenExtracted", false);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("stackTrace", e.getStackTrace());
            return ResponseEntity.status(500).body(result);
        }
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

        String token = httpRequest.getHeader("Authorization");
        System.out.println("🔍 [ASSIGN] Token présent: " + (token != null));
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        String agentUsername = jwtUtil.getUsernameFromToken(token);
        Utilisateurs agent = utilisateursRepository.findByUtilisateur(agentUsername)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé"));

        String targetAgentId = request != null ? request.get("agentId") : null;
        Utilisateurs targetAgent = agent;

        if (targetAgentId != null && !targetAgentId.isBlank()) {
            Optional<Utilisateurs> userById = utilisateursRepository.findById(targetAgentId);
            if (userById.isPresent()) {
                targetAgent = userById.get();
            } else {
                Optional<Utilisateurs> userByPersonId = utilisateursRepository.findByPersonneId(targetAgentId);
                if (userByPersonId.isPresent()) {
                    targetAgent = userByPersonId.get();
                } else {
                    throw new RuntimeException("Agent cible non trouvé pour ID: " + targetAgentId);
                }
            }
        }

        try {
            Entreprise entreprise = entrepriseService.assignToAgent(id, targetAgent);
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
     * Sauvegarder le numéro RCCM pour les sociétés
     */
    @PostMapping("/{id}/rccm")
    public ResponseEntity<Map<String, Object>> saveRccmNumber(
            @PathVariable String id,
            @RequestBody Map<String, Object> rccmData) {
        
        try {
            System.out.println("🔄 [EntrepriseController] Sauvegarde RCCM pour société ID: " + id);
            System.out.println("📋 [EntrepriseController] Données RCCM reçues: " + rccmData);
            
            // Récupérer l'entreprise
            Entreprise entreprise = entrepriseService.findById(id);
            if (entreprise == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Entreprise non trouvée");
                return ResponseEntity.notFound().build();
            }
            
            // Extraire le numéro RCCM
            String numeroRccm = (String) rccmData.get("numeroRccm");
            if (numeroRccm == null || numeroRccm.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Numéro RCCM requis");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Mettre à jour le numéro RCCM
            entreprise.setNumeroRccm(numeroRccm.trim());
            entreprise.setModification(Instant.now());
            
            // Sauvegarder
            entreprise = entrepriseService.save(entreprise);
            
            System.out.println("✅ [EntrepriseController] Numéro RCCM sauvegardé: " + numeroRccm);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Numéro RCCM sauvegardé avec succès");
            response.put("id", id);
            response.put("numeroRccm", numeroRccm);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] Erreur sauvegarde RCCM: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la sauvegarde du numéro RCCM: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Mettre à jour le statut et l'étape d'une entreprise
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> statusData) {
        
        try {
            String newStatus = (String) statusData.get("status");
            String note = (String) statusData.get("note");
            
            // Récupérer l'entreprise
            Entreprise entreprise = entrepriseService.findById(id);
            if (entreprise == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Entreprise non trouvée");
                return ResponseEntity.notFound().build();
            }
            
            // Déterminer la nouvelle étape basée sur le statut
            EtapeValidation nouvelleEtape = determinerEtapeDepuisStatut(newStatus);
            
            // Mettre à jour le statut de création
            if ("VALIDE".equals(newStatus)) {
                entreprise.setStatutCreation(StatutCreation.VALIDEE);
            } else if ("REJETE".equals(newStatus)) {
                entreprise.setStatutCreation(StatutCreation.REFUSEE);
            } else if ("INCOMPLET".equals(newStatus)) {
                entreprise.setStatutCreation(StatutCreation.EN_COURS);
            } else if ("PAIEMENT".equals(newStatus)) {
                entreprise.setStatutCreation(StatutCreation.EN_COURS);
            } else if ("PAIEMENT_VALIDE".equals(newStatus)) {
                entreprise.setStatutCreation(StatutCreation.EN_COURS);
            }
            
            // Mettre à jour l'étape
            if (nouvelleEtape != null) {
                entreprise.setEtapeValidation(nouvelleEtape);
                
                // Désassigner automatiquement si passage en REVISION
                desassignerSiRevision(entreprise, nouvelleEtape, "Paiement validé");
            }
            
            // Sauvegarder
            entreprise = entrepriseService.save(entreprise);
            
            // Ajouter une note dans l'historique si fournie
            if (note != null && !note.trim().isEmpty()) {
                // TODO: Ajouter la note à l'historique des modifications
                System.out.println("📝 Note ajoutée: " + note);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statut mis à jour avec succès");
            response.put("id", id);
            response.put("newStatus", newStatus);
            response.put("newEtape", nouvelleEtape != null ? nouvelleEtape.getValue() : null);
            
            System.out.println("✅ Statut mis à jour: " + id + " -> " + newStatus + " (étape: " + nouvelleEtape + ")");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la mise à jour du statut: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la mise à jour du statut: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Déterminer l'étape de validation basée sur le statut
     */
    private EtapeValidation determinerEtapeDepuisStatut(String status) {
        switch (status) {
            case "VALIDE":
                return EtapeValidation.REGISSEUR;
            case "PAIEMENT":
                return EtapeValidation.PAIEMENT_AGENT;
            case "PAIEMENT_VALIDE":
                return EtapeValidation.REVISION;
            case "REJETE":
            case "INCOMPLET":
            default:
                return EtapeValidation.ACCUEIL;
        }
    }
    
    /**
     * Désassigne automatiquement une entreprise de l'agent d'accueil 
     * quand elle passe à l'étape REVISION
     */
    private void desassignerSiRevision(Entreprise entreprise, EtapeValidation nouvelleEtape, String contexte) {
        if (nouvelleEtape == EtapeValidation.REVISION && entreprise.getAssignedTo() != null) {
            System.out.println("🔄 [EntrepriseController] Désassignation automatique - " + contexte + " - Entreprise: " + entreprise.getId());
            entreprise.setAssignedTo(null);
        }
    }

    /**
     * Récupérer les entreprises NON ASSIGNÉES pour éviter les conflits entre agents.
     * Filtrées par antenne de l'agent connecté.
     */
    @GetMapping("/unassigned")
    public ResponseEntity<Page<EntrepriseResponse>> getUnassignedEntreprises(
            @RequestParam(value = "etape", defaultValue = "ACCUEIL") String etape,
            Pageable pageable,
            HttpServletRequest httpRequest) {

        System.out.println("🚨🚨🚨 [EntrepriseController] ENDPOINT /unassigned APPELÉ - DÉBUT 🚨🚨🚨");
        System.out.println("🔍 [EntrepriseController] Paramètre etape: " + etape);
        System.out.println("🔍 [EntrepriseController] Pageable: " + pageable);
        
        try {
            EtapeValidation etapeValidation = EtapeValidation.valueOf(etape.toUpperCase());
            
            // Inclure toutes les demandes à l'étape ACCUEIL, y compris celles validées qui y ont été remises
            List<StatutCreation> statutsAccueil = List.of(
                StatutCreation.EN_COURS,
                StatutCreation.EN_ATTENTE,
                StatutCreation.REFUSEE,
                StatutCreation.VALIDEE
            );
            
            Page<Entreprise> page = entrepriseRepository.findByEtapeValidationAndAssignedToIsNullAndStatutCreationIn(
                etapeValidation, statutsAccueil, pageable);

            System.out.println("🚨 [EntrepriseController] ENDPOINT /unassigned APPELÉ - " + page.getContent().size() + " entreprises trouvées");
            
            // Appliquer le filtrage par antenne de l'agent
            page = filterByAgentAntenne(page, httpRequest, pageable);
            
            System.out.println("🚨 [EntrepriseController] APRÈS FILTRAGE - " + page.getContent().size() + " entreprises restantes");

            List<Entreprise> entreprises = page.getContent();
            List<String> ids = entreprises.stream().map(Entreprise::getId).toList();
            Map<String, List<EntrepriseMembre>> membresByEntreprise = ids.isEmpty() ? Map.of()
                    : entrepriseMembreRepository.findByEntrepriseIdsWithPersonne(ids)
                        .stream()
                        .collect(Collectors.groupingBy(em -> em.getEntreprise().getId()));

            Page<EntrepriseResponse> mapped = page.map(ent -> {
                EntrepriseResponse response = toResponseShallow(ent);
                List<EntrepriseMembre> ems = membresByEntreprise.get(ent.getId());
                if (ems != null) {
                    response.membres = ems.stream().map(this::mapMembre).toList();
                }
                return response;
            });

            return ResponseEntity.ok(mapped);
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Étape de validation invalide: " + etape, ex);
        }
    }

    /**
     * Récupérer les entreprises assignées à l'agent connecté.
     * Filtrées par antenne de l'agent connecté.
     */
    @GetMapping("/assigned-to-me")
    public ResponseEntity<Page<EntrepriseResponse>> getAssignedToMe(
            Pageable pageable,
            HttpServletRequest httpRequest) {

        try {
            String token = httpRequest.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            String agentUsername = jwtUtil.getUsernameFromToken(token);
            Utilisateurs agent = utilisateursRepository.findByUtilisateur(agentUsername)
                .orElseThrow(() -> new RuntimeException("Agent non trouvé"));

            Page<Entreprise> page = entrepriseService.getAssignedToAgent(agent.getId(), pageable);

            // Appliquer le filtrage par antenne de l'agent
            page = filterByAgentAntenne(page, httpRequest, pageable);

            List<Entreprise> entreprises = page.getContent();
            List<String> ids = entreprises.stream().map(Entreprise::getId).toList();
            Map<String, List<EntrepriseMembre>> membresByEntreprise = ids.isEmpty() ? Map.of()
                    : entrepriseMembreRepository.findByEntrepriseIdsWithPersonne(ids)
                        .stream()
                        .collect(Collectors.groupingBy(em -> em.getEntreprise().getId()));

            Page<EntrepriseResponse> mapped = page.map(ent -> {
                EntrepriseResponse response = toResponseShallow(ent);
                List<EntrepriseMembre> ems = membresByEntreprise.get(ent.getId());
                if (ems != null) {
                    response.membres = ems.stream().map(this::mapMembre).toList();
                }
                return response;
            });

            return ResponseEntity.ok(mapped);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Page.empty(pageable));
        }
    }

    /**
     * Récupère UNIQUEMENT les entreprises normales créées par l'utilisateur courant.
     * Les demandes d'agrément sont maintenant dans un endpoint séparé.
     */
    @GetMapping("/my-applications")
    public ResponseEntity<List<EntrepriseResponse>> getMyApplications(HttpServletRequest request) {
        System.out.println("🔍 [MY-APPLICATIONS] Appel" );

        try {
            String currentUserEmail = getCurrentUserEmail(request);
            // Récupérer le personne_id pour la logique métier
            String currentUserId = utilisateursRepository.findByUtilisateur(currentUserEmail)
                .map(user -> user.getPersonne() != null ? user.getPersonne().getId() : null)
                .orElse(null);
            System.out.println("🔍 [MY-APPLICATIONS] currentUserId=" + currentUserId);

            if (currentUserId == null || currentUserId.isBlank()) {
                return ResponseEntity.ok(List.of());
            }

            // Récupérer les entreprises normales
            List<Entreprise> created = entrepriseRepository.findByCreatedByPersonOrUser(currentUserId, currentUserId);
            System.out.println("🔍 [MY-APPLICATIONS] entreprises créées trouvé via personId/userId=" + created.size());

            List<EntrepriseMembre> memberships = entrepriseMembreRepository.findByPersonne_Id(currentUserId);
            System.out.println("🔍 [MY-APPLICATIONS] memberships trouvés=" + memberships.size());

            Set<String> seenIds = new HashSet<>();
            List<Entreprise> combined = new ArrayList<>();

            created.forEach(ent -> {
                if (ent != null && seenIds.add(ent.getId())) {
                    combined.add(ent);
                }
            });

            memberships.forEach(em -> {
                Entreprise ent = em.getEntreprise();
                if (ent != null && seenIds.add(ent.getId())) {
                    combined.add(ent);
                }
            });

            System.out.println("🔍 [MY-APPLICATIONS] total demandes uniques=" + combined.size());

            List<EntrepriseResponse> responses = combined.stream()
                .map(this::toResponseShallow)
                .collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            System.err.println("❌ [MY-APPLICATIONS] Erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Récupère UNIQUEMENT les demandes d'agrément (investissement) de l'utilisateur courant.
     * Endpoint séparé pour éviter la confusion avec les entreprises normales.
     */
    @GetMapping("/my-investment-applications")
    public ResponseEntity<List<EntrepriseResponse>> getMyInvestmentApplications(HttpServletRequest request) {
        System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] Appel" );

        try {
            String currentUserEmail = getCurrentUserEmail(request);
            // Récupérer le personne_id pour la logique métier
            String currentUserId = utilisateursRepository.findByUtilisateur(currentUserEmail)
                .map(user -> user.getPersonne() != null ? user.getPersonne().getId() : null)
                .orElse(null);
            System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] currentUserId=" + currentUserId);

            if (currentUserId == null || currentUserId.isBlank()) {
                return ResponseEntity.ok(List.of());
            }

            // Récupérer les demandes d'investissement de l'utilisateur
            List<InvestmentAgreement> investmentAgreements = investmentAgreementService.getUserInvestmentAgreements(currentUserId);
            System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] demandes d'investissement trouvées=" + investmentAgreements.size());

            List<Entreprise> combined = new ArrayList<>();

            // Convertir les demandes d'investissement en EntrepriseResponse pour l'affichage
            for (InvestmentAgreement investment : investmentAgreements) {
                // Créer une entreprise fictive pour l'affichage dans le suivi
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId("INV-" + investment.getId());
                entrepriseFictive.setNom(investment.getIdentification() != null ? 
                    investment.getIdentification().getNomRaisonSociale() : "Demande d'investissement");
                entrepriseFictive.setStatutCreation(investment.getStatut());
                
                // Récupérer le régime depuis la base de données investment_agreements.regime_sollicite
                String regimeSollicite = investment.getRegimeSollicite();
                if (regimeSollicite != null) {
                    try {
                        // Mapper les valeurs de la base vers l'enum
                        abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement regime;
                        switch (regimeSollicite) {
                            case "A" -> regime = abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_A;
                            case "B" -> regime = abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_B;
                            case "C" -> regime = abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_C;
                            case "D" -> regime = abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_D;
                            case "ZONES_ECONOMIQUES" -> regime = abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_D; // 600k comme Régime D
                            default -> {
                                System.err.println("⚠️ [MY-INVESTMENT-APPLICATIONS] Régime invalide pour " + investment.getId() + ": " + regimeSollicite);
                                regime = abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_A; // Par défaut
                            }
                        }
                        entrepriseFictive.setRegimeInvestissement(regime);
                        System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] Régime assigné pour " + entrepriseFictive.getNom() + ": " + regimeSollicite + " -> " + regime);
                    } catch (Exception e) {
                        System.err.println("⚠️ [MY-INVESTMENT-APPLICATIONS] Erreur lors de l'assignation du régime pour " + investment.getId() + ": " + e.getMessage());
                        entrepriseFictive.setRegimeInvestissement(abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_A); // Par défaut
                    }
                } else {
                    System.err.println("⚠️ [MY-INVESTMENT-APPLICATIONS] Aucun régime défini pour " + investment.getId());
                    entrepriseFictive.setRegimeInvestissement(abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.REGIME_A); // Par défaut
                }
                
                // Les dates seront gérées automatiquement par l'entité Entreprise
                if (investment.getCreatedAt() != null) {
                    entrepriseFictive.setCreation(java.time.Instant.from(investment.getCreatedAt().atZone(java.time.ZoneId.systemDefault())));
                }
                if (investment.getUpdatedAt() != null) {
                    entrepriseFictive.setModification(java.time.Instant.from(investment.getUpdatedAt().atZone(java.time.ZoneId.systemDefault())));
                }
                
                // Récupérer l'étape actuelle depuis le workflow d'agrément
                try {
                    // Utiliser l'ID avec préfixe INV- pour chercher dans agrement_assignments
                    String entrepriseIdAvecPrefixe = "INV-" + investment.getId();
                    AgrementAssignment assignation = agrementWorkflowService.getAssignationActuelle(entrepriseIdAvecPrefixe);
                    if (assignation != null && assignation.getEtape() != null) {
                        EtapeValidation etapeActuelle = assignation.getEtape();
                        // Utiliser directement l'étape récupérée
                        entrepriseFictive.setEtapeValidation(etapeActuelle);
                        System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] Étape assignée pour " + entrepriseFictive.getNom() + ": " + etapeActuelle);
                    } else {
                        entrepriseFictive.setEtapeValidation(EtapeValidation.ACCUEIL);
                        System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] Aucune étape trouvée pour " + entrepriseIdAvecPrefixe + ", utilisation de ACCUEIL par défaut");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ [MY-INVESTMENT-APPLICATIONS] Erreur lors de la récupération de l'étape pour " + investment.getId() + ": " + e.getMessage());
                    entrepriseFictive.setEtapeValidation(EtapeValidation.ACCUEIL); // Par défaut
                }
                
                combined.add(entrepriseFictive);
            }

            System.out.println("🔍 [MY-INVESTMENT-APPLICATIONS] total demandes d'agrément=" + combined.size());

            List<EntrepriseResponse> responses = combined.stream()
                .map(this::toResponseShallow)
                .collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            System.err.println("❌ [MY-INVESTMENT-APPLICATIONS] Erreur: " + e.getMessage());
            e.printStackTrace();
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
     * Met à jour un membre d'une entreprise.
     */
    @PutMapping("/{entrepriseId}/membres/{membreId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<MembreResponse> updateMembre(
            @PathVariable String entrepriseId,
            @PathVariable String membreId,
            @RequestBody Map<String, Object> membreData) {
        
        System.out.println("🔧 [UPDATE-MEMBRE] Mise à jour membre " + membreId + " de l'entreprise " + entrepriseId);
        System.out.println("📝 [UPDATE-MEMBRE] Données reçues: " + membreData);
        
        try {
            // Vérifier que l'entreprise existe
            if (!entrepriseRepository.existsById(entrepriseId)) {
                throw new NotFoundException("Entreprise introuvable: " + entrepriseId);
            }
            
            // Trouver le membre à mettre à jour avec une session active
            EntrepriseMembre membre = entrepriseMembreRepository
                .findByEntrepriseIdAndPersonneId(entrepriseId, membreId)
                .orElseThrow(() -> new NotFoundException("Membre introuvable: " + membreId + " dans l'entreprise " + entrepriseId));
            
            System.out.println("✅ [UPDATE-MEMBRE] Membre trouvé: " + membre.getId());
            
            // Mettre à jour les données du membre dans EntrepriseMembre
            if (membreData.containsKey("role")) {
                String roleStr = (String) membreData.get("role");
                if (roleStr != null && !roleStr.isEmpty()) {
                    try {
                        abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole role = 
                            abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole.valueOf(roleStr);
                        membre.setRole(role);
                        System.out.println("✅ [UPDATE-MEMBRE] Rôle mis à jour: " + role);
                    } catch (IllegalArgumentException e) {
                        System.err.println("❌ [UPDATE-MEMBRE] Rôle invalide: " + roleStr);
                    }
                }
            }
            
            if (membreData.containsKey("pourcentageParts")) {
                Object partsObj = membreData.get("pourcentageParts");
                if (partsObj != null) {
                    java.math.BigDecimal parts = null;
                    if (partsObj instanceof Number) {
                        parts = java.math.BigDecimal.valueOf(((Number) partsObj).doubleValue());
                    } else if (partsObj instanceof String) {
                        try {
                            parts = new java.math.BigDecimal((String) partsObj);
                        } catch (NumberFormatException e) {
                            System.err.println("❌ [UPDATE-MEMBRE] Pourcentage invalide: " + partsObj);
                        }
                    }
                    if (parts != null) {
                        membre.setPourcentageParts(parts);
                        System.out.println("✅ [UPDATE-MEMBRE] Parts mises à jour: " + parts + "%");
                    }
                }
            }
            
            // Mettre à jour les données personnelles si présentes
            if (membre.getPersonne() != null) {
                if (membreData.containsKey("prenom")) {
                    String prenom = (String) membreData.get("prenom");
                    if (prenom != null) {
                        membre.getPersonne().setPrenom(prenom);
                        System.out.println("✅ [UPDATE-MEMBRE] Prénom mis à jour: " + prenom);
                    }
                }
                
                if (membreData.containsKey("nom")) {
                    String nom = (String) membreData.get("nom");
                    if (nom != null) {
                        membre.getPersonne().setNom(nom);
                        System.out.println("✅ [UPDATE-MEMBRE] Nom mis à jour: " + nom);
                    }
                }
                
                if (membreData.containsKey("telephone")) {
                    String telephone = (String) membreData.get("telephone");
                    if (telephone != null) {
                        membre.getPersonne().setTelephone1(telephone);
                        System.out.println("✅ [UPDATE-MEMBRE] Téléphone mis à jour: " + telephone);
                    }
                }
                
                if (membreData.containsKey("email")) {
                    String email = (String) membreData.get("email");
                    if (email != null) {
                        membre.getPersonne().setEmail(email);
                        System.out.println("✅ [UPDATE-MEMBRE] Email mis à jour: " + email);
                    }
                }
                
                if (membreData.containsKey("situationMatrimoniale")) {
                    Boolean situationMatrimoniale = (Boolean) membreData.get("situationMatrimoniale");
                    if (situationMatrimoniale != null) {
                        abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales situation = 
                            situationMatrimoniale ? 
                            abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales.MARIE :
                            abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales.CELIBATAIRE;
                        membre.getPersonne().setSituationMatrimoniale(situation);
                        System.out.println("✅ [UPDATE-MEMBRE] Situation matrimoniale mise à jour: " + situation);
                    }
                }
            }
            
            // Mettre à jour les champs spécifiques aux personnes morales
            // Les champs paysEmissionRccm et denominationEntreprise sont maintenant dans la table persons
            
            // Sauvegarder les modifications avec flush pour forcer la synchronisation
            EntrepriseMembre membreSauvegarde = entrepriseMembreRepository.saveAndFlush(membre);
            System.out.println("✅ [UPDATE-MEMBRE] Membre sauvegardé avec succès: " + membreSauvegarde.getId());
            
            // Recharger l'entité avec toutes ses relations pour la réponse
            EntrepriseMembre membreRecharge = entrepriseMembreRepository
                .findByEntrepriseIdAndPersonneId(entrepriseId, membreId)
                .orElse(membreSauvegarde);
            
            // Retourner la réponse
            MembreResponse response = mapMembre(membreRecharge);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [UPDATE-MEMBRE] Erreur lors de la mise à jour: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la mise à jour du membre: " + e.getMessage());
        }
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
        r.domaineActiviteNr = e.getDomaineActiviteNr();
        
        // Ajouter le libellé du domaine d'activité
        if (e.getDomaineActiviteNr() != null) {
            r.domaineActiviteLabel = e.getDomaineActiviteNr().getLabel();
        }
        
        r.statutSociete = e.getStatutSociete();

        // NOUVELLE APPROCHE: Utiliser divisionCode INSTAT directement
        if (e.getDivisionCode() != null && !e.getDivisionCode().isBlank()) {
            r.divisionCode = e.getDivisionCode();
            
            // Essayer de récupérer le nom réel via l'API INSTAT
            try {
                String nomReel = resolveDivisionNameFromInstat(e.getDivisionCode());
                r.divisionNom = nomReel != null ? nomReel : ("Division " + e.getDivisionCode());
            } catch (Exception ex) {
                System.err.println("❌ [INSTAT] Erreur résolution division " + e.getDivisionCode() + ": " + ex.getMessage());
                r.divisionNom = "Division " + e.getDivisionCode(); // Fallback sûr
            }
            
            System.out.println("🔧 [INSTAT] Division code: " + e.getDivisionCode() + " -> Nom: " + r.divisionNom);
        } else {
            // Fallback vers l'ancien système si divisionCode n'est pas défini
            Divisions d = e.getDivision();
            if (d != null) {
                r.divisionCode = d.getCode();
                r.divisionNom = d.getNom();
                System.out.println("🔧 [LEGACY] Division legacy trouvée: " + d.getCode());
            } else {
                System.out.println("⚠️ [WARNING] Aucune division trouvée pour l'entreprise: " + e.getId());
            }
        }
        
        // Pour l'instant, on ne remonte plus la hiérarchie car on utilise l'API INSTAT
        // TODO: Implémenter la résolution via API INSTAT si nécessaire
        Divisions d = e.getDivision();
        if (d != null) {

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
        
        // Ajouter le motif de rejet
        r.motifRejet = e.getMotifRejet();
        
        // Numéros d'identification
        r.numeroNina = e.getNumeroNina();
        r.numeroRccm = e.getNumeroRccm();

        // Map des membres (personnes liées) avec rôle et parts
        if (e.getMembres() != null) {
            System.out.println("🔍 [MAPPING DEBUG] Nombre de membres à mapper: " + e.getMembres().size());
            r.membres = e.getMembres().stream().map(this::mapMembre).toList();
            System.out.println("🔍 [MAPPING DEBUG] Membres mappés: " + r.membres.size());
            if (!r.membres.isEmpty()) {
                System.out.println("🔍 [MAPPING DEBUG] Premier membre mappé: " + r.membres.get(0));
                
                // Mapper la situation matrimoniale du premier membre pour l'entreprise
                if (e.getMembres().get(0).getPersonne() != null && 
                    e.getMembres().get(0).getPersonne().getSituationMatrimoniale() != null) {
                    r.situationMatrimoniale = e.getMembres().get(0).getPersonne().getSituationMatrimoniale().toString();
                    System.out.println("🔍 [SITUATION DEBUG] Situation matrimoniale mappée: " + r.situationMatrimoniale);
                } else {
                    System.out.println("⚠️ [SITUATION DEBUG] Situation matrimoniale null pour le premier membre");
                }
            }
        }

        // Ajouter les informations du créateur
        if (e.getCreatedBy() != null) {
            r.createdBy = mapCreateur(e.getCreatedBy());
        }
        
        // Mapper l'agent assigné
        System.out.println("🔧 [MAPPING] Vérification assignedTo pour " + e.getNom() + ": " + (e.getAssignedTo() != null ? "présent" : "null"));
        if (e.getAssignedTo() != null) {
            System.out.println("🔧 [MAPPING] Début mapping assignedTo pour " + e.getNom());
            System.out.println("🔧 [MAPPING] assignedTo.getId(): " + e.getAssignedTo().getId());
            System.out.println("🔧 [MAPPING] assignedTo.getUtilisateur(): " + e.getAssignedTo().getUtilisateur());
            System.out.println("🔧 [MAPPING] assignedTo.getPersonne(): " + (e.getAssignedTo().getPersonne() != null ? "présent" : "null"));
            
            r.assignedTo = new UtilisateursResponse();
            r.assignedTo.id = e.getAssignedTo().getId();
            r.assignedTo.utilisateur = e.getAssignedTo().getUtilisateur();
            if (e.getAssignedTo().getPersonne() != null) {
                r.assignedTo.email = e.getAssignedTo().getPersonne().getEmail();
                r.assignedTo.nom = e.getAssignedTo().getPersonne().getNom();
                r.assignedTo.prenom = e.getAssignedTo().getPersonne().getPrenom();
                System.out.println("🔧 [MAPPING] Personne mappée: " + r.assignedTo.nom + " " + r.assignedTo.prenom + " (" + r.assignedTo.email + ")");
            } else {
                System.out.println("⚠️ [MAPPING] Personne null - mapping partiel seulement");
            }
            System.out.println("🔧 [MAPPING] Fin mapping assignedTo - objet créé: " + (r.assignedTo != null ? "oui" : "non"));
        } else {
            System.out.println("⚠️ [MAPPING] assignedTo est null pour " + e.getNom());
        }
        
        // === INFORMATIONS AGRÉMENT ===
        r.numeroAutorisation = e.getNumeroAutorisation();
        r.dateAutorisation = e.getDateAutorisation();
        r.agrementSignePath = e.getAgrementSignePath();
        r.telechargementAutorise = e.getTelechargementAutorise() != null ? e.getTelechargementAutorise() : false;
        
        return r;
    }

    // Méthode utilitaire pour mapper un membre
    private MembreResponse mapMembre(EntrepriseMembre em) {
        System.out.println("🔍 [MAPMEMBRE DEBUG] Début mapping membre: " + (em.getPersonne() != null ? em.getPersonne().getNom() : "null"));
        MembreResponse mr = new MembreResponse();
        if (em.getPersonne() != null) {
            mr.personId = em.getPersonne().getId();
            mr.nom = em.getPersonne().getNom();
            mr.prenom = em.getPersonne().getPrenom();
            mr.email = em.getPersonne().getEmail();
            mr.telephone = em.getPersonne().getTelephone1(); // Correction: telephone1
            mr.telephone2 = em.getPersonne().getTelephone2(); // Ajout: telephone2
            // Conversion Date vers LocalDate
            if (em.getPersonne().getDateNaissance() != null) {
                mr.dateNaissance = em.getPersonne().getDateNaissance().toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            }
            // Situation matrimoniale - garder la valeur string pour RCCM
            if (em.getPersonne().getSituationMatrimoniale() != null) {
                mr.situationMatrimonialeStr = em.getPersonne().getSituationMatrimoniale().toString();
            }
            // Ajouter le sexe
            if (em.getPersonne().getSexe() != null) {
                mr.sexe = em.getPersonne().getSexe().toString();
            }
            // Ajouter la nationalité
            if (em.getPersonne().getNationalite() != null) {
                mr.nationalite = em.getPersonne().getNationalite().toString();
            }
            // Ajouter lieu de naissance, localité et civilité
            mr.lieuNaissance = em.getPersonne().getLieuNaissance();
            mr.localite = em.getPersonne().getLocalite();
            if (em.getPersonne().getCivilite() != null) {
                mr.civilite = em.getPersonne().getCivilite().toString();
                System.out.println("🔍 [DEBUG CIVILITE] Mapping civilite pour " + mr.nom + ": " + mr.civilite);
            } else {
                System.out.println("⚠️ [DEBUG CIVILITE] Civilite null pour " + mr.nom);
                mr.civilite = "MONSIEUR"; // Fallback temporaire pour debug
            }
        }
        mr.role = em.getRole();
        mr.pourcentageParts = em.getPourcentageParts();
        mr.dateDebut = em.getDateDebut();
        mr.dateFin = em.getDateFin();
        
        System.out.println("🔍 [MAPMEMBRE DEBUG] Fin mapping membre - civilite: " + mr.civilite + ", nom: " + mr.nom);
        
        // Champs spécifiques aux personnes morales (maintenant dans persons)
        if (em.getPersonne() != null) {
            mr.paysEmissionRccm = em.getPersonne().getPaysEmissionRccm();
            mr.denominationEntreprise = em.getPersonne().getDenominationEntreprise();
        }
        
        return mr;
    }

    // Méthode utilitaire pour mapper un créateur
    private CreateurResponse mapCreateur(Utilisateurs createur) {
        CreateurResponse cr = new CreateurResponse();
        cr.id = createur.getId();
        
        // Récupérer les informations de la personne associée
        if (createur.getPersonne() != null) {
            cr.nom = createur.getPersonne().getNom();
            cr.prenom = createur.getPersonne().getPrenom();
            cr.email = createur.getPersonne().getEmail();
            cr.telephone = createur.getPersonne().getTelephone1();
            cr.sexe = createur.getPersonne().getSexe() != null ? 
                createur.getPersonne().getSexe().toString() : null;
            cr.nationalite = createur.getPersonne().getNationalite() != null ?
                createur.getPersonne().getNationalite().toString() : null;
            cr.divisionCode = createur.getPersonne().getDivisionCode();
            
            // Récupérer le nom de la division si disponible
            if (createur.getPersonne().getDivision() != null) {
                cr.divisionNom = createur.getPersonne().getDivision().getNom();
            }
        }
        
        return cr;
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
        r.domaineActiviteNr = e.getDomaineActiviteNr();

        // NOUVELLE APPROCHE: Utiliser divisionCode INSTAT directement
        if (e.getDivisionCode() != null && !e.getDivisionCode().isBlank()) {
            r.divisionCode = e.getDivisionCode();
            
            // Essayer de récupérer le nom réel via l'API INSTAT
            try {
                String nomReel = resolveDivisionNameFromInstat(e.getDivisionCode());
                r.divisionNom = nomReel != null ? nomReel : ("Division " + e.getDivisionCode());
            } catch (Exception ex) {
                System.err.println("❌ [INSTAT] Erreur résolution division " + e.getDivisionCode() + ": " + ex.getMessage());
                r.divisionNom = "Division " + e.getDivisionCode(); // Fallback sûr
            }
        } else {
            // Fallback vers l'ancien système
            Divisions d = e.getDivision();
            if (d != null) {
                r.divisionCode = d.getCode();
                r.divisionNom = d.getNom();
            }
        }
        
        // Conserver la logique de hiérarchie pour l'ancien système
        Divisions d = e.getDivision();
        if (d != null) {

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
        System.out.println("🔧 [MAPPING] Vérification assignedTo pour " + e.getNom() + ": " + (e.getAssignedTo() != null ? "présent" : "null"));
        if (e.getAssignedTo() != null) {
            System.out.println("🔧 [MAPPING] Début mapping assignedTo pour " + e.getNom());
            System.out.println("🔧 [MAPPING] assignedTo.getId(): " + e.getAssignedTo().getId());
            System.out.println("🔧 [MAPPING] assignedTo.getUtilisateur(): " + e.getAssignedTo().getUtilisateur());
            System.out.println("🔧 [MAPPING] assignedTo.getPersonne(): " + (e.getAssignedTo().getPersonne() != null ? "présent" : "null"));
            
            r.assignedTo = new UtilisateursResponse();
            r.assignedTo.id = e.getAssignedTo().getId();
            r.assignedTo.utilisateur = e.getAssignedTo().getUtilisateur();
            if (e.getAssignedTo().getPersonne() != null) {
                r.assignedTo.email = e.getAssignedTo().getPersonne().getEmail();
                r.assignedTo.nom = e.getAssignedTo().getPersonne().getNom();
                r.assignedTo.prenom = e.getAssignedTo().getPersonne().getPrenom();
                System.out.println("🔧 [MAPPING] Personne mappée: " + r.assignedTo.nom + " " + r.assignedTo.prenom + " (" + r.assignedTo.email + ")");
            } else {
                System.out.println("⚠️ [MAPPING] Personne null - mapping partiel seulement");
            }
            System.out.println("🔧 [MAPPING] Fin mapping assignedTo - objet créé: " + (r.assignedTo != null ? "oui" : "non"));
        } else {
            System.out.println("⚠️ [MAPPING] assignedTo est null pour " + e.getNom());
        }
        
        // === INFORMATIONS DE PAIEMENT ===
        if (e.getPaiement() != null) {
            r.statutPaiement = e.getPaiement().getStatut();
            r.datePaiement = e.getPaiement().getDatePaiement();
            r.montantPaiement = e.getPaiement().getMontant();
            r.referencePaiement = e.getPaiement().getReferenceTransaction();
            r.paiementEffectue = (e.getPaiement().getStatut() != null && 
                                 e.getPaiement().getStatut().toString().equals("VALIDE"));
        } else {
            r.statutPaiement = null;
            r.datePaiement = null;
            r.montantPaiement = null;
            r.referencePaiement = null;
            r.paiementEffectue = false;
        }
        
        // Ajouter les informations du créateur
        System.out.println("🔍 [DEBUG] Entreprise " + e.getNom() + " - createdBy: " + (e.getCreatedBy() != null ? e.getCreatedBy().getId() : "NULL"));
        if (e.getCreatedBy() != null) {
            r.createdBy = mapCreateur(e.getCreatedBy());
            System.out.println("✅ [DEBUG] Créateur mappé pour " + e.getNom() + ": " + r.createdBy.nom + " " + r.createdBy.prenom + " (sexe: " + r.createdBy.sexe + ")");
        } else {
            System.out.println("⚠️ [DEBUG] Pas de créateur pour " + e.getNom());
        }
        
        // Ajouter le numéro NINA s'il existe
        r.numeroNina = e.getNumeroNina();
        
        // Ajouter l'état des téléchargements et la date de retrait
        r.rccmTelecharge = e.getRccmTelecharge();
        r.ninaTelecharge = e.getNinaTelecharge();
        r.dateRetrait = e.getDateRetrait();
        
        // === INFORMATIONS AGRÉMENT ===
        r.numeroAutorisation = e.getNumeroAutorisation();
        r.dateAutorisation = e.getDateAutorisation();
        r.agrementSignePath = e.getAgrementSignePath();
        r.telechargementAutorise = e.getTelechargementAutorise() != null ? e.getTelechargementAutorise() : false;
        
        // Ajouter le régime d'investissement pour les demandes d'investissement
        if (e.getRegimeInvestissement() != null) {
            r.regimeInvestissement = e.getRegimeInvestissement().toString();
        }
        
        // AJOUTER LE MOTIF DE REJET
        r.motifRejet = e.getMotifRejet();
        
        System.out.println("🔧 [MAPPING FINAL] " + e.getNom() + " - assignedTo avant return: " + (r.assignedTo != null ? r.assignedTo.id : "null"));
        System.out.println("🔍 [DIAGNOSTIC] " + e.getNom() + " - assigned_to en BDD: " + (e.getAssignedTo() != null ? e.getAssignedTo().getId() : "NULL"));
        
        return r;
    }

    /**
     * Méthodes utilitaires pour le traitement des documents
     */
    private String findFounderId(Entreprise entreprise) {
        return entrepriseMembreRepository.findByEntreprise_IdAndRole(entreprise.getId(), 
            abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole.GERANT)
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
     * Récupère l'email de l'utilisateur connecté depuis le token JWT.
     */
    private String getCurrentUserEmail(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("⚠️ DEBUG - Token Authorization manquant");
                throw new BadRequestException("Token d'authentification manquant. Veuillez vous reconnecter.");
            }

            String token = authHeader.substring(7);
            String email = jwtUtil.getUsernameFromToken(token);
            System.out.println("🔍 DEBUG - Email extrait du token: " + email);

            if (email == null || email.isBlank()) {
                System.out.println("⚠️ DEBUG - Impossible d'extraire l'email du token");
                throw new BadRequestException("Token d'authentification invalide. Veuillez vous reconnecter.");
            }

            // Vérifier que l'utilisateur existe
            if (!utilisateursRepository.findByUtilisateur(email).isPresent()) {
                System.out.println("⚠️ DEBUG - Aucun utilisateur pour l'email: " + email);
                throw new BadRequestException("Utilisateur non trouvé. Veuillez vous reconnecter.");
            }

            System.out.println("🔍 DEBUG - Email utilisateur validé: " + email);
            return email;

        } catch (BadRequestException e) {
            throw e; // Re-lancer les exceptions métier
        } catch (Exception e) {
            System.err.println("⚠️ DEBUG - Erreur lors de la récupération de l'utilisateur connecté: " + e.getMessage());
            throw new BadRequestException("Erreur d'authentification. Veuillez vous reconnecter.");
        }
    }

    /**
     * Endpoint pour déclencher manuellement la transition REGISSEUR → REVISION
     * Utile pour les tests et la maintenance
     */
    @PostMapping("/transition-regisseur-revision")
    public ResponseEntity<Map<String, Object>> transitionRegisseurToRevision() {
        try {
            // Récupérer les entreprises à l'étape REGISSEUR avec paiement validé
            List<Entreprise> entreprisesRegisseur = entrepriseRepository.findByEtapeValidation(EtapeValidation.REGISSEUR, Pageable.unpaged()).getContent();
            
            List<String> entreprisesTransferees = new ArrayList<>();
            int nombreTransitions = 0;
            
            for (Entreprise entreprise : entreprisesRegisseur) {
                // Vérifier si l'entreprise a un paiement validé
                if (entreprise.getPaiement() != null && 
                    entreprise.getPaiement().getStatut() == StatutPaiement.VALIDE) {
                    
                    // Faire la transition vers REVISION
                    entreprise.setEtapeValidation(EtapeValidation.REVISION);
                    
                    // Désassigner automatiquement lors du passage en REVISION
                    desassignerSiRevision(entreprise, EtapeValidation.REVISION, "Transition REGISSEUR → REVISION");
                    
                    entrepriseRepository.save(entreprise);
                    
                    entreprisesTransferees.add(entreprise.getNom() + " (ID: " + entreprise.getId() + ")");
                    nombreTransitions++;
                    
                    System.out.println("📋 [EntrepriseController] Transition: " + entreprise.getNom() + " REGISSEUR → REVISION");
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Transition REGISSEUR → REVISION effectuée");
            response.put("nombreTransitions", nombreTransitions);
            response.put("entreprisesTransferees", entreprisesTransferees);
            
            System.out.println("✅ [EntrepriseController] " + nombreTransitions + " entreprises transférées vers REVISION");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la transition REGISSEUR → REVISION: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la transition des entreprises");
        }
    }

    /**
     * Endpoint pour récupérer les documents d'une entreprise
     */
    @GetMapping("/{entrepriseId}/documents")
    public ResponseEntity<List<Map<String, Object>>> getEntrepriseDocuments(@PathVariable String entrepriseId) {
        try {
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new NotFoundException("Entreprise non trouvée"));
            
            // Pour l'instant, retourner une structure basique des documents
     
            List<Map<String, Object>> documents = new ArrayList<>();
            
            // Simuler quelques documents de base pour chaque entreprise
            String[] typesDocuments = {"STATUTS", "IDENTITE", "DOMICILE", "NAISSANCE", "RESIDENCE"};
            String[] nomsDocuments = {
                "Statuts de la société", 
                "Pièce d'identité du gérant", 
                "Justificatif de domicile",
                "Extrait de naissance",
                "Certificat de résidence"
            };
            
            for (int i = 0; i < typesDocuments.length; i++) {
                Map<String, Object> doc = new HashMap<>();
                doc.put("id", "real-doc-" + (i + 1) + "-" + entrepriseId);
                doc.put("nom", nomsDocuments[i]);
                doc.put("type", typesDocuments[i]);
                doc.put("statut", "en_attente");
                doc.put("entrepriseId", entrepriseId);
                documents.add(doc);
            }
            
            System.out.println("📄 [EntrepriseController] Retourné " + documents.size() + 
                             " documents pour l'entreprise " + entreprise.getNom());
            
            return ResponseEntity.ok(documents);
            
        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la récupération des documents: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la récupération des documents");
        }
    }

    /**
     * Endpoint simplifié pour récupérer les entreprises par étape (pour debug)
     */
    @GetMapping("/etape/{etape}/simple")
    public ResponseEntity<List<Map<String, Object>>> getEntreprisesByEtapeSimple(@PathVariable String etape) {
        try {
            EtapeValidation etapeValidation = EtapeValidation.valueOf(etape.toUpperCase());
            List<Entreprise> entreprises = entrepriseRepository.findByEtapeValidation(etapeValidation, Pageable.unpaged()).getContent();
            
            List<Map<String, Object>> result = entreprises.stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", e.getId());
                    map.put("nom", e.getNom());
                    map.put("sigle", e.getSigle());
                    map.put("reference", e.getReference());
                    map.put("etapeValidation", e.getEtapeValidation());
                    map.put("typeEntreprise", e.getTypeEntreprise());
                    map.put("divisionCode", e.getDivisionCode());
                    map.put("numeroNina", e.getNumeroNina());
                    map.put("numeroRccm", e.getNumeroRccm());
                    // Ne pas inclure membres directement pour éviter les références circulaires
                    // Les membres seront chargés séparément si nécessaire
                    map.put("formeJuridique", e.getFormeJuridique());
                    map.put("domaineActivite", e.getDomaineActivite());
                    map.put("domaineActiviteNr", e.getDomaineActiviteNr());
                    map.put("dateCreation", e.getCreation());
                    return map;
                })
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("❌ Erreur endpoint simple: " + e.getMessage());
            throw new BadRequestException("Erreur endpoint simple: " + e.getMessage());
        }
    }

    /**
     * Endpoint pour récupérer les entreprises par étape de validation
     * Utilisé par les agents pour voir les entreprises à leur étape
     */
    @GetMapping("/etape/{etape}")
    public ResponseEntity<List<EntrepriseResponse>> getEntreprisesByEtape(@PathVariable String etape) {
        System.out.println("🔥 [ENDPOINT DEBUG] getEntreprisesByEtape appelé avec étape: " + etape);
        try {
            // Convertir la chaîne en enum
            EtapeValidation etapeValidation;
            try {
                etapeValidation = EtapeValidation.valueOf(etape.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Étape de validation invalide: " + etape);
            }
            
            // Récupérer les entreprises à cette étape avec les membres chargés (fetch join)
            List<Entreprise> entreprises = entrepriseRepository.findByEtapeValidationWithMembres(etapeValidation);
            
            System.out.println("🔍 [EntrepriseController] Trouvé " + entreprises.size() + 
                             " entreprises brutes à l'étape " + etape);
            
            // Convertir en réponse avec gestion d'erreur individuelle
            List<EntrepriseResponse> entreprisesResponse = new ArrayList<>();
            for (Entreprise entreprise : entreprises) {
                try {
                    System.out.println("🔄 [EntrepriseController] Conversion de l'entreprise: " + entreprise.getNom() + " (ID: " + entreprise.getId() + ")");
                    System.out.println("📋 [EntrepriseController] numeroRccm en BDD: " + entreprise.getNumeroRccm());
                    System.out.println("📋 [EntrepriseController] numeroNina en BDD: " + entreprise.getNumeroNina());
                    System.out.println("👤 [EntrepriseController] assignedTo en BDD: " + (entreprise.getAssignedTo() != null ? entreprise.getAssignedTo().getId() + " (" + entreprise.getAssignedTo().getUtilisateur() + ")" : "null"));
                    EntrepriseResponse response = toResponse(entreprise);
                    System.out.println("📋 [EntrepriseController] numeroRccm dans response: " + response.numeroRccm);
                    System.out.println("📋 [EntrepriseController] numeroNina dans response: " + response.numeroNina);
                    System.out.println("👤 [EntrepriseController] assignedTo dans response: " + (response.assignedTo != null ? response.assignedTo.id + " (" + response.assignedTo.utilisateur + ")" : "null"));
                    entreprisesResponse.add(response);
                    System.out.println("✅ [EntrepriseController] Conversion réussie pour: " + entreprise.getNom());
                } catch (Exception ex) {
                    System.err.println("❌ [EntrepriseController] Erreur lors de la conversion de l'entreprise " + entreprise.getNom() + ": " + ex.getMessage());
                    ex.printStackTrace();
                    // Continuer avec les autres entreprises au lieu de tout faire échouer
                }
            }
            
            System.out.println("🏢 [EntrepriseController] " + entreprisesResponse.size() + "/" + entreprises.size() + 
                             " entreprises converties avec succès pour l'étape " + etape);
            
            return ResponseEntity.ok(entreprisesResponse);
            
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la récupération des entreprises par étape: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la récupération des entreprises");
        }
    }

    /**
     * Endpoint pour finaliser la révision et passer à l'étape TCOM
     */
    @PutMapping("/{entrepriseId}/finaliser-revision")
    public ResponseEntity<Map<String, Object>> finaliserRevision(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, Object> request) {
        try {
            String decision = (String) request.get("decision");
            String commentaire = (String) request.get("commentaire");
            
            System.out.println("🔄 [EntrepriseController] Finalisation révision pour entreprise: " + entrepriseId);
            System.out.println("📋 [EntrepriseController] Décision: " + decision);
            System.out.println("💬 [EntrepriseController] Commentaire: " + commentaire);
            
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new NotFoundException("Entreprise non trouvée"));
            
            if (entreprise.getEtapeValidation() != EtapeValidation.REVISION) {
                throw new BadRequestException("L'entreprise n'est pas à l'étape REVISION");
            }
            
            if ("approuve".equals(decision)) {
                // Toutes les entreprises vont directement à TCOM (RCCM1 supprimé du workflow)
                entreprise.setEtapeValidation(EtapeValidation.TCOM);
                System.out.println("✅ [EntrepriseController] Entreprise approuvée - transition vers TCOM");
            } else if ("rejete".equals(decision)) {
                // Retourner à l'étape ACCUEIL et changer le statut à EN_COURS
                entreprise.setEtapeValidation(EtapeValidation.ACCUEIL);
                entreprise.setStatutCreation(StatutCreation.EN_COURS);
                // Supprimer l'assignation pour que l'entreprise apparaisse dans "Demandes à traiter"
                entreprise.setAssignedTo(null);
                // Sauvegarder le motif de rejet si fourni
                if (commentaire != null && !commentaire.trim().isEmpty()) {
                    entreprise.setMotifRejet(commentaire);
                    System.out.println("❌ [EntrepriseController] Motif de rejet sauvegardé: " + commentaire);
                }
                System.out.println("❌ [EntrepriseController] Entreprise rejetée - retour vers ACCUEIL sans assignation pour réassignation manuelle");
            } else {
                throw new BadRequestException("Décision invalide. Valeurs acceptées: 'approuve', 'rejete'");
            }
            
            // Sauvegarder les modifications
            entreprise = entrepriseRepository.save(entreprise);
            
            
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            if ("approuve".equals(decision)) {
                response.put("message", "Révision finalisée avec succès. Entreprise transférée au TCOM.");
            } else {
                response.put("message", "Révision finalisée avec succès. Entreprise retournée à l'Accueil.");
            }
            response.put("nouvelleEtape", entreprise.getEtapeValidation().getValue());
            response.put("entrepriseId", entrepriseId);
            response.put("decision", decision);
            
            System.out.println("✅ [EntrepriseController] Révision finalisée - nouvelle étape: " + entreprise.getEtapeValidation().getValue());
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la finalisation de la révision: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la finalisation de la révision");
        }
    }

    /**
     * Endpoint pour finaliser l'étape impôts et passer à l'étape RCCM1
     */
    @PutMapping("/{entrepriseId}/finaliser-impots")
    public ResponseEntity<Map<String, Object>> finaliserImpots(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, Object> request) {
        try {
            String decision = (String) request.get("decision");
            String commentaire = (String) request.get("commentaire");
            
            System.out.println("🔄 [EntrepriseController] Finalisation impôts pour entreprise: " + entrepriseId);
            System.out.println("📋 [EntrepriseController] Décision: " + decision);
            System.out.println("💬 [EntrepriseController] Commentaire: " + commentaire);
            
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new NotFoundException("Entreprise non trouvée"));
            
            if (entreprise.getEtapeValidation() != EtapeValidation.IMPOTS) {
                throw new BadRequestException("L'entreprise n'est pas à l'étape IMPOTS");
            }
            
            if ("approuve".equals(decision)) {
                // IMPOTS est maintenant la dernière étape - rester à IMPOTS avec statut terminé
                entreprise.setEtapeValidation(EtapeValidation.IMPOTS);
                System.out.println("✅ [EntrepriseController] Entreprise approuvée - processus terminé à IMPOTS");
            } else if ("rejete".equals(decision)) {
                // Retourner à l'étape RETRAIT (étape précédente dans le nouveau flux)
                entreprise.setEtapeValidation(EtapeValidation.RETRAIT);
                System.out.println("❌ [EntrepriseController] Entreprise rejetée - retour vers RETRAIT");
            } else {
                throw new BadRequestException("Décision invalide. Valeurs acceptées: 'approuve', 'rejete'");
            }
            
            // Sauvegarder les modifications
            entreprise = entrepriseRepository.save(entreprise);
            
            
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Étape impôts finalisée avec succès");
            response.put("nouvelleEtape", entreprise.getEtapeValidation().getValue());
            response.put("entrepriseId", entrepriseId);
            response.put("decision", decision);
            
            System.out.println("✅ [EntrepriseController] Étape impôts finalisée - nouvelle étape: " + entreprise.getEtapeValidation().getValue());
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la finalisation de l'étape impôts: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la finalisation de l'étape impôts");
        }
    }

    /**
     * Endpoint pour finaliser l'étape RCCM1 et passer à l'étape RCCM2
     */
    @PutMapping("/{entrepriseId}/finaliser-rccm1")
    public ResponseEntity<Map<String, Object>> finaliserRCCM1(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, Object> request) {
        
        try {
            String decision = (String) request.get("decision");
            String commentaire = (String) request.get("commentaire");
            
            System.out.println("🔄 [EntrepriseController] Finalisation RCCM1 pour entreprise: " + entrepriseId);
            System.out.println("📋 [EntrepriseController] Décision: " + decision);
            System.out.println("💬 [EntrepriseController] Commentaire: " + commentaire);
            
            // Récupérer l'entreprise
            Optional<Entreprise> optionalEntreprise = entrepriseRepository.findById(entrepriseId);
            if (!optionalEntreprise.isPresent()) {
                throw new BadRequestException("Entreprise non trouvée");
            }
            
            Entreprise entreprise = optionalEntreprise.get();
            
            // Vérifier que l'entreprise est bien à l'étape RCCM1
            if (!EtapeValidation.RCCM1.equals(entreprise.getEtapeValidation())) {
                throw new BadRequestException("L'entreprise n'est pas à l'étape RCCM1");
            }
            
            // Déterminer la nouvelle étape selon la décision
            EtapeValidation nouvelleEtape;
            if ("approuve".equals(decision)) {
                nouvelleEtape = EtapeValidation.TCOM;
                System.out.println("✅ [EntrepriseController] Entreprise approuvée, transition vers TCOM");
            } else if ("rejete".equals(decision)) {
                nouvelleEtape = EtapeValidation.REVISION;
                System.out.println("❌ [EntrepriseController] Entreprise rejetée, retour à REVISION");
            } else {
                throw new BadRequestException("Décision invalide. Utilisez 'approuve' ou 'rejete'");
            }
            
            // Mettre à jour l'étape de validation
            entreprise.setEtapeValidation(nouvelleEtape);
            entreprise.setModification(Instant.now());
            
            // Sauvegarder
            entrepriseRepository.save(entreprise);
            
            System.out.println("✅ [EntrepriseController] Entreprise " + entrepriseId + " transférée à l'étape " + nouvelleEtape);
            
            // Préparer la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Étape RCCM1 finalisée avec succès");
            response.put("entrepriseId", entrepriseId);
            response.put("decision", decision);
            response.put("nouvelleEtape", nouvelleEtape.getValue());
            response.put("commentaire", commentaire);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] Erreur lors de la finalisation RCCM1: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la finalisation de l'étape RCCM1");
        }
    }

    /**
     * Endpoint pour finaliser l'étape RCCM2 et faire la transition vers l'étape suivante
     */
    @PutMapping("/{entrepriseId}/finaliser-rccm2")
    public ResponseEntity<Map<String, Object>> finaliserRCCM2(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, Object> request) {
        
        try {
            System.out.println("🔄 [EntrepriseController] Finalisation RCCM2 pour entreprise: " + entrepriseId);
            System.out.println("📋 [EntrepriseController] Données reçues: " + request);
            
            String decision = (String) request.get("decision");
            String commentaire = (String) request.get("commentaire");
            
            if (decision == null || decision.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "La décision est obligatoire"
                ));
            }
            
            // Récupérer l'entreprise
            System.out.println("🔍 [EntrepriseController] Recherche entreprise avec ID: " + entrepriseId);
            Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(entrepriseId);
            if (entrepriseOpt.isEmpty()) {
                System.err.println("❌ [EntrepriseController] Entreprise non trouvée avec ID: " + entrepriseId);
                return ResponseEntity.notFound().build();
            }
            
            Entreprise entreprise = entrepriseOpt.get();
            System.out.println("🏢 [EntrepriseController] Entreprise trouvée: " + entreprise.getNom());
            System.out.println("📊 [EntrepriseController] Étape actuelle: " + entreprise.getEtapeValidation());
            
            // Vérifier que l'entreprise est bien à l'étape RCCM2
            if (!EtapeValidation.RCCM2.equals(entreprise.getEtapeValidation())) {
                System.err.println("❌ [EntrepriseController] Étape invalide. Attendu: RCCM2, Actuel: " + entreprise.getEtapeValidation());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "L'entreprise n'est pas à l'étape RCCM2. Étape actuelle: " + entreprise.getEtapeValidation()
                ));
            }
            
            // Déterminer la prochaine étape selon la décision
            EtapeValidation prochaineEtape;
            if ("approuve".equals(decision)) {
                prochaineEtape = EtapeValidation.NINA; // Approuvé → NINA
                System.out.println("✅ [EntrepriseController] RCCM2 approuvé → Transition vers NINA");
            } else if ("rejete".equals(decision)) {
                prochaineEtape = EtapeValidation.TCOM; // Rejeté → Retour à TCOM (RCCM1 supprimé du workflow)
                System.out.println("❌ [EntrepriseController] RCCM2 rejeté → Retour à TCOM");
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Décision invalide. Utilisez 'approuve' ou 'rejete'"
                ));
            }
            
            // Mettre à jour l'entreprise
            entreprise.setEtapeValidation(prochaineEtape);
            entreprise.setModification(Instant.now());
            
            // Sauvegarder
            Entreprise entrepriseSauvegardee = entrepriseRepository.save(entreprise);
            
            System.out.println("✅ [EntrepriseController] Entreprise mise à jour avec succès");
            System.out.println("🎯 [EntrepriseController] Nouvelle étape: " + entrepriseSauvegardee.getEtapeValidation());
            
            // Préparer la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Étape RCCM2 finalisée avec succès");
            response.put("entrepriseId", entrepriseId);
            response.put("decision", decision);
            response.put("prochaineEtape", prochaineEtape.getValue()); // Utiliser getValue() pour obtenir la String
            response.put("commentaire", commentaire);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] Erreur lors de la finalisation RCCM2: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la finalisation de l'étape RCCM2");
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Filtrer les entreprises par antenne de l'agent connecté
     */
    private Page<Entreprise> filterByAgentAntenne(Page<Entreprise> originalPage, HttpServletRequest httpRequest, Pageable pageable) {
        System.out.println("🚨🚨🚨 [FILTRAGE] MÉTHODE APPELÉE - " + originalPage.getContent().size() + " entreprises 🚨🚨🚨");
        
        try {
            // Extraire le token JWT
            String token = httpRequest.getHeader("Authorization");
            System.out.println("🔑 [EntrepriseController] Token Authorization header: " + (token != null ? "Présent" : "Absent"));
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                System.out.println("🔑 [EntrepriseController] Token JWT extrait: " + token.substring(0, Math.min(20, token.length())) + "...");
            }

            if (token == null) {
                System.out.println("🚨🚨🚨 [FILTRAGE] PAS DE TOKEN - RETOUR ORIGINAL 🚨🚨🚨");
                return originalPage;
            }

            // Récupérer l'email de l'agent depuis le token
            String agentEmail = jwtUtil.getUsernameFromToken(token);
            System.out.println("🚨🚨🚨 [FILTRAGE] AGENT EMAIL: " + agentEmail + " 🚨🚨🚨");
            
            // Récupérer l'agent depuis la table Persons
            Optional<Persons> agentOpt = personsRepository.findByEmail(agentEmail);
            if (!agentOpt.isPresent()) {
                System.out.println("🚨🚨🚨 [FILTRAGE] AGENT NON TROUVÉ - RETOUR ORIGINAL 🚨🚨🚨");
                return originalPage;
            }

            Persons agent = agentOpt.get();
            System.out.println("🚨🚨🚨 [FILTRAGE] AGENT TROUVÉ: " + agent.getEmail() + " - ANTENNE: " + agent.getAntenneAgent() + " 🚨🚨🚨");
            
            // Si c'est SUPER_ADMIN, pas de filtrage
            if (agent.getRole() == Roles.SUPER_ADMIN) {
                System.out.println("🚨🚨🚨 [FILTRAGE] SUPER_ADMIN - PAS DE FILTRAGE 🚨🚨🚨");
                return originalPage;
            }
            
            // Récupérer TOUTES les antennes de l'agent (système multi-antennes)
            List<AntenneAgents> agentAntennes = personsService.getAgentAntennes(agent.getId());
            
            if (agentAntennes.isEmpty()) {
                System.out.println("🚨🚨🚨 [FILTRAGE] PAS D'ANTENNES - RETOUR ORIGINAL 🚨🚨🚨");
                return originalPage;
            }
            
            System.out.println("🚨🚨🚨 [FILTRAGE] FILTRAGE PAR ANTENNES: " + agentAntennes.stream().map(AntenneAgents::name).collect(Collectors.toList()) + " 🚨🚨🚨");
            
            // Filtrer les entreprises selon TOUTES les antennes de l'agent
            List<Entreprise> filteredList = originalPage.getContent().stream()
                .filter(entreprise -> {
                    if (entreprise.getDivisionCode() != null && entreprise.getDivisionCode().length() >= 2) {
                        String regionCode = entreprise.getDivisionCode().substring(0, 2);
                        
                        // Vérifier si l'entreprise correspond à AU MOINS UNE des antennes de l'agent
                        boolean matches = agentAntennes.stream()
                            .anyMatch(antenne -> isRegionCodeInAntenne(regionCode, antenne));
                        
                        System.out.println("🚨 [FILTRAGE] " + entreprise.getNom() + " (région " + regionCode + ") - Autorisée: " + matches + " (antennes: " + agentAntennes.stream().map(AntenneAgents::name).collect(Collectors.toList()) + ")");
                        return matches;
                    }
                    return false; // Pas de divisionCode = pas autorisé
                })
                .collect(Collectors.toList());
            
            System.out.println("🚨🚨🚨 [FILTRAGE] RÉSULTAT: " + filteredList.size() + "/" + originalPage.getContent().size() + " entreprises conservées 🚨🚨🚨");
            
            return new PageImpl<>(filteredList, pageable, filteredList.size());
            
        } catch (Exception e) {
            System.out.println("🚨🚨🚨 [FILTRAGE] ERREUR: " + e.getMessage() + " 🚨🚨🚨");
            return originalPage;
        }
    }

    /**
     * Mapper une antenne vers les codes de division correspondants
     */
    private String mapAntenneToLocalisation(AntenneAgents antenne) {
        switch (antenne) {
            case BAMAKO:
                return "BAMAKO";
            case KAYES:
                return "KAYES";
            case KOULIKORO:
                return "KOULIKORO";
            case SIKASSO:
                return "SIKASSO";
            case SÉGOU:
                return "SEGOU";
            case MOPTI:
                return "MOPTI";
            case GAO:
                return "GAO";
            case TOMBOUCTOU:
                return "TOMBOUCTOU";
            case KIDAL:
                return "KIDAL";
            case TAOUDÉNIT:
                return "TAOUDENIT";
            case MÉNAKA:
                return "MENAKA";
            case NIORO:
                return "NIORO";
            case BOUGOUNI:
                return "BOUGOUNI";
            case DIOÏLA:
                return "DIOILA";
            case KOUTIALA:
                return "KOUTIALA";
            case KITA:
                return "KITA";
            case NARA:
                return "NARA";
            case BANDIAGARA:
                return "BANDIAGARA";
            case SAN:
                return "SAN";
            case DOUENTZA:
                return "DOUENTZA";
            default:
                return null;
        }
    }

    /**
     * Vérifier si une entreprise (par son divisionCode) est dans les antennes autorisées de l'agent
     * Nouvelle approche basée sur les codes INSTAT
     */
    private boolean isEntrepriseInAgentAntennes(String divisionCode, List<AntenneAgents> agentAntennes) {
        if (divisionCode == null || divisionCode.length() < 2) {
            return false; // Code invalide
        }
        
        // Extraire le code région (2 premiers caractères du divisionCode)
        String regionCode = divisionCode.substring(0, 2);
        
        for (AntenneAgents antenne : agentAntennes) {
            // Mapper l'antenne vers les codes de région INSTAT correspondants
            if (isRegionCodeInAntenne(regionCode, antenne)) {
                System.out.println("📝 [EntrepriseController] DivisionCode " + divisionCode + 
                    " (région " + regionCode + ") autorisé pour antenne " + antenne.name());
                return true;
            }
        }
        
        System.out.println("📝 [EntrepriseController] DivisionCode " + divisionCode + 
            " (région " + regionCode + ") NON autorisé pour antennes: " + 
            agentAntennes.stream().map(AntenneAgents::name).collect(Collectors.toList()));
        return false;
    }
    
    /**
     * Vérifier si un code de région INSTAT correspond à une antenne
     * Mapping basé sur les vrais codes INSTAT du Mali (21 régions)
     */
    private boolean isRegionCodeInAntenne(String regionCode, AntenneAgents antenne) {
        switch (antenne) {
            case KAYES:
                return "01".equals(regionCode); // Région de Kayes
            case KOULIKORO:
                return "02".equals(regionCode); // Région de Koulikoro
            case SIKASSO:
                return "03".equals(regionCode); // Région de Sikasso
            case SÉGOU:
                return "04".equals(regionCode); // Région de Ségou
            case MOPTI:
                return "05".equals(regionCode); // Région de Mopti
            case TOMBOUCTOU:
                return "06".equals(regionCode); // Région de Tombouctou
            case GAO:
                return "07".equals(regionCode); // Région de Gao
            case KIDAL:
                return "08".equals(regionCode); // Région de Kidal
            case TAOUDÉNIT:
                return "09".equals(regionCode); // Région de Taoudenni
            case MÉNAKA:
                return "10".equals(regionCode); // Région de Ménaka
            case NIORO:
                return "11".equals(regionCode); // Région de Nioro
            case KITA:
                return "12".equals(regionCode); // Région de Kita
            case DIOÏLA:
                return "13".equals(regionCode); // Région de Dioïla
            case NARA:
                return "14".equals(regionCode); // Région de Nara
            case BOUGOUNI:
                return "15".equals(regionCode); // Région de Bougouni
            case KOUTIALA:
                return "16".equals(regionCode); // Région de Koutiala
            case SAN:
                return "17".equals(regionCode); // Région de San
            case DOUENTZA:
                return "18".equals(regionCode); // Région de Douentza
            case BANDIAGARA:
                return "19".equals(regionCode); // Région de Bandiagara
            case BAMAKO:
                return "90".equals(regionCode) || "X9".equals(regionCode); // District de Bamako (actuel et ancien)
                
            default:
                return false;
        }
    }

    /**
     * Récupérer toutes les divisions autorisées pour un agent basé sur ses antennes
     * Version optimisée pour éviter les timeouts
     */
    private Set<String> getAuthorizedDivisionsForAgent(List<AntenneAgents> agentAntennes) {
        Set<String> authorizedDivisionIds = new HashSet<>();
        
        // Approche ultra-simplifiée pour éviter les timeouts
        for (AntenneAgents antenne : agentAntennes) {
            String regionName = mapAntenneToLocalisation(antenne);
            if (regionName == null) continue;
            
            try {
                // Récupérer toutes les divisions qui correspondent à cette antenne
                List<Divisions> matchingDivisions = getDivisionsForAntenne(antenne, regionName);
                
                for (Divisions division : matchingDivisions) {
                    authorizedDivisionIds.add(division.getId());
                }
                
                System.out.println("📝 [EntrepriseController] Antenne " + antenne.name() + 
                    " → Région: " + regionName + " → " + matchingDivisions.size() + " divisions trouvées");
                    
            } catch (Exception e) {
                System.err.println("❌ [EntrepriseController] Erreur pour antenne " + antenne.name() + ": " + e.getMessage());
            }
        }
        
        System.out.println("📝 [EntrepriseController] Total divisions autorisées: " + authorizedDivisionIds.size());
        
        return authorizedDivisionIds;
    }
    
    /**
     * Récupérer toutes les divisions correspondant à une antenne spécifique
     * Version améliorée avec approche par codes de division + mots-clés
     */
    private List<Divisions> getDivisionsForAntenne(AntenneAgents antenne, String regionName) {
        Set<Divisions> allDivisions = new HashSet<>();
        
        // 1. APPROCHE PAR CODES DE DIVISION (plus fiable)
        List<String> codePrefixes = getCodePrefixesForAntenne(antenne);
        
        for (String prefix : codePrefixes) {
            try {
                List<Divisions> divisions = divisionsRepository.findByCodeStartingWith(prefix);
                allDivisions.addAll(divisions);
                System.out.println("📝 [EntrepriseController] Code prefix '" + prefix + "' → " + divisions.size() + " divisions");
                
                // Log détaillé pour debug
                if (divisions.size() > 0) {
                    System.out.println("📝 [EntrepriseController] Exemples divisions trouvées: " + 
                        divisions.stream().limit(3).map(d -> d.getNom() + "(" + d.getCode() + ")").collect(Collectors.toList()));
                }
            } catch (Exception e) {
                System.err.println("❌ [EntrepriseController] Erreur recherche code prefix '" + prefix + "': " + e.getMessage());
            }
        }
        
        // 2. APPROCHE PAR MOTS-CLÉS (complément)
        List<String> keywords = getKeywordsForAntenne(antenne);
        
        for (String keyword : keywords) {
            try {
                List<Divisions> divisions = divisionsRepository.findByNomContainingIgnoreCase(keyword);
                allDivisions.addAll(divisions);
            } catch (Exception e) {
                System.err.println("❌ [EntrepriseController] Erreur recherche keyword '" + keyword + "': " + e.getMessage());
            }
        }
        
        // 3. FALLBACK ÉLARGI : Recherche plus permissive
        if (allDivisions.size() < 10) {
            System.out.println("🔄 [EntrepriseController] Peu de divisions trouvées (" + allDivisions.size() + 
                "), utilisation du fallback élargi pour antenne " + antenne.name());
            
            try {
                // Chercher toutes les divisions qui contiennent le nom de la région
                List<Divisions> fallbackDivisions = divisionsRepository.findByNomContainingIgnoreCase(regionName);
                allDivisions.addAll(fallbackDivisions);
                
                // Fallbacks spécifiques par antenne
                if (antenne == AntenneAgents.BAMAKO) {
                    // Pour Bamako : inclure TOUS les quartiers des codes 0003 à 0008
                    List<Divisions> bamakoAll = new ArrayList<>();
                    for (String code : Arrays.asList("0003", "0004", "0005", "0006", "0007", "0008")) {
                        bamakoAll.addAll(divisionsRepository.findByCodeStartingWith(code));
                    }
                    allDivisions.addAll(bamakoAll);
                    
                    System.out.println("📝 [EntrepriseController] Bamako fallback : ajouté " + bamakoAll.size() + " divisions supplémentaires");
                } else {
                    // Pour les autres antennes : recherche élargie par nom de région
                    try {
                        String antenneRegionName = mapAntenneToLocalisation(antenne);
                        if (antenneRegionName != null) {
                            // Rechercher TOUTES les divisions qui contiennent le nom de la région
                            List<Divisions> regionDivisions = divisionsRepository.findByNomContainingIgnoreCase(antenneRegionName);
                            allDivisions.addAll(regionDivisions);
                            
                            System.out.println("📝 [EntrepriseController] Fallback région " + antenneRegionName + 
                                " : ajouté " + regionDivisions.size() + " divisions supplémentaires");
                            
                            // Si c'est encore insuffisant, chercher par cercles/communes
                            if (regionDivisions.size() < 5) {
                                List<String> antenneKeywords = getKeywordsForAntenne(antenne);
                                for (String keyword : antenneKeywords) {
                                    List<Divisions> keywordDivisions = divisionsRepository.findByNomContainingIgnoreCase(keyword);
                                    allDivisions.addAll(keywordDivisions);
                                }
                                System.out.println("📝 [EntrepriseController] Fallback mots-clés pour " + antenne.name() + 
                                    " : recherche par cercles/communes");
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("❌ [EntrepriseController] Erreur fallback région pour " + antenne.name() + ": " + e.getMessage());
                    }
                }
                
                System.out.println("📝 [EntrepriseController] Fallback général ajouté " + fallbackDivisions.size() + " divisions supplémentaires");
                
            } catch (Exception e) {
                System.err.println("❌ [EntrepriseController] Erreur fallback: " + e.getMessage());
            }
        }
        
        System.out.println("📝 [EntrepriseController] Total final pour antenne " + antenne.name() + ": " + allDivisions.size() + " divisions");
        
        return new ArrayList<>(allDivisions);
    }
    
    /**
     * Obtenir les préfixes de codes de division pour une antenne donnée
     * Version adaptative qui découvre automatiquement les vrais codes
     */
    private List<String> getCodePrefixesForAntenne(AntenneAgents antenne) {
        List<String> prefixes = new ArrayList<>();
        
        try {
            // Approche adaptative : découvrir les codes réels depuis la base
            String regionName = mapAntenneToLocalisation(antenne);
            if (regionName != null) {
                // 1. Trouver la région correspondante
                List<Divisions> regions = divisionsRepository.findByNomContainingIgnoreCaseAndDivisionType(
                    regionName, DivisionType.REGION);
                
                for (Divisions region : regions) {
                    if (region.getCode() != null && !region.getCode().isEmpty()) {
                        // 2. Utiliser le préfixe de la région (2 premiers caractères)
                        String regionPrefix = region.getCode().substring(0, Math.min(2, region.getCode().length()));
                        prefixes.add(regionPrefix);
                        
                        System.out.println("📝 [EntrepriseController] Région " + region.getNom() + 
                            " → Code: " + region.getCode() + " → Préfixe: " + regionPrefix);
                    }
                }
            }
            
            // 3. Fallback avec codes fixes pour les cas spéciaux connus
            if (prefixes.isEmpty()) {
                switch (antenne) {
                    case BAMAKO:
                        // Bamako District : codes spéciaux 0003 à 0008
                        prefixes.add("0003"); // Arrondissement I
                        prefixes.add("0004"); // Arrondissement II  
                        prefixes.add("0005"); // Arrondissement III
                        prefixes.add("0006"); // Arrondissement IV
                        prefixes.add("0007"); // Arrondissement V
                        prefixes.add("0008"); // Arrondissement VI
                        System.out.println("📝 [EntrepriseController] Bamako : utilisation codes fixes 0003-0008");
                        break;
                    case KOULIKORO:
                        prefixes.add("01"); // Préfixe général Koulikoro
                        break;
                    case KAYES:
                        prefixes.add("02"); // Préfixe général Kayes
                        break;
                    case SIKASSO:
                        prefixes.add("03"); // Préfixe général Sikasso (attention: conflit avec Bamako)
                        break;
                    case SÉGOU:
                        prefixes.add("04"); // Préfixe général Ségou
                        break;
                    case MOPTI:
                        prefixes.add("05"); // Préfixe général Mopti
                        break;
                    case BANDIAGARA:
                        prefixes.add("05"); // Bandiagara fait partie de Mopti
                        break;
                    default:
                        System.out.println("⚠️ [EntrepriseController] Aucun préfixe trouvé pour antenne: " + antenne.name());
                        break;
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] Erreur lors de la découverte des codes pour " + antenne.name() + ": " + e.getMessage());
            
            // Fallback d'urgence
            switch (antenne) {
                case BAMAKO:
                    prefixes.add("0003");
                    prefixes.add("0004");
                    prefixes.add("0005");
                    prefixes.add("0006");
                    prefixes.add("0007");
                    prefixes.add("0008");
                    break;
                default:
                    // Pour les autres, essayer le mapping simple
                    String regionName = mapAntenneToLocalisation(antenne);
                    if (regionName != null) {
                        // Utiliser les 2 premières lettres du nom comme préfixe approximatif
                        String approxPrefix = regionName.substring(0, Math.min(2, regionName.length())).toUpperCase();
                        System.out.println("📝 [EntrepriseController] Fallback d'urgence pour " + antenne.name() + 
                            " : préfixe approximatif " + approxPrefix);
                    }
                    break;
            }
        }
        
        System.out.println("📝 [EntrepriseController] Préfixes finaux pour " + antenne.name() + ": " + prefixes);
        return prefixes;
    }
    
    /**
     * Obtenir les mots-clés de recherche pour une antenne donnée
     * Version élargie avec plus de quartiers et zones
     */
    private List<String> getKeywordsForAntenne(AntenneAgents antenne) {
        List<String> keywords = new ArrayList<>();
        
        switch (antenne) {
            case BAMAKO:
                keywords.add("BAMAKO");
                keywords.add("DISTRICT");
                // Tous les arrondissements
                keywords.add("ARRONDISSEMENT I");
                keywords.add("ARRONDISSEMENT II");
                keywords.add("ARRONDISSEMENT III");
                keywords.add("ARRONDISSEMENT IV");
                keywords.add("ARRONDISSEMENT V");
                keywords.add("ARRONDISSEMENT VI");
                // Quartiers populaires (liste élargie)
                keywords.add("TALIKO");
                keywords.add("SOTUBA");
                keywords.add("MAGNAMBOUGOU");
                keywords.add("BADALABOUGOU");
                keywords.add("HIPPODROME");
                keywords.add("MEDINA COURA");
                keywords.add("BAGADADJI");
                keywords.add("HAMDALLAYE");
                keywords.add("LAFIABOUGOU");
                keywords.add("MISSABOUGOU");
                // Quartiers supplémentaires souvent oubliés
                keywords.add("KOROFINA");
                keywords.add("SABALIBOUGOU");
                keywords.add("DJELIBOUGOU");
                keywords.add("QUINZAMBOUGOU");
                keywords.add("BANCONI");
                keywords.add("KALABAN COURA");
                keywords.add("SEBENIKORO");
                keywords.add("FALADIÉ");
                keywords.add("SOGONIKO");
                keywords.add("YIRIMADIO");
                keywords.add("SIRAKORO");
                keywords.add("DIANEGUELA");
                keywords.add("TITIBOUGOU");
                keywords.add("BOLIBANA");
                keywords.add("NIAMAKORO");
                keywords.add("GARANTIGUIBOUGOU");
                keywords.add("TOROKOROBOUGOU");
                keywords.add("DAOUDABOUGOU");
                keywords.add("BACODJICORONI");
                keywords.add("NIARELA");
                keywords.add("PLATEAU");
                keywords.add("COMMUNE I");
                keywords.add("COMMUNE II");
                keywords.add("COMMUNE III");
                keywords.add("COMMUNE IV");
                keywords.add("COMMUNE V");
                keywords.add("COMMUNE VI");
                break;
            case KOULIKORO:
                keywords.add("KOULIKORO");
                keywords.add("KATI");
                keywords.add("KOLOKANI");
                keywords.add("NARA");
                keywords.add("BANAMBA");
                break;
            case BANDIAGARA:
                keywords.add("BANDIAGARA");
                keywords.add("BANKASS");
                keywords.add("KORO");
                break;
            case KAYES:
                keywords.add("KAYES");
                keywords.add("BAFOULABE");
                keywords.add("KENIEBA");
                keywords.add("KITA");
                keywords.add("NIORO");
                break;
            case SIKASSO:
                keywords.add("SIKASSO");
                keywords.add("BOUGOUNI");
                keywords.add("KOUTIALA");
                keywords.add("YANFOLILA");
                break;
            case SÉGOU:
                keywords.add("SEGOU");
                keywords.add("SAN");
                keywords.add("TOMINIAN");
                keywords.add("BLA");
                break;
            case MOPTI:
                keywords.add("MOPTI");
                keywords.add("DJENNE");
                keywords.add("TENENKOU");
                keywords.add("YOUWAROU");
                break;
            default:
                // Pour les autres antennes, utiliser seulement le nom de la région
                String regionName = mapAntenneToLocalisation(antenne);
                if (regionName != null) {
                    keywords.add(regionName);
                }
                break;
        }
        
        return keywords;
    }
    
    /**
     * Récupérer toutes les sous-divisions d'une région de manière non-récursive (optimisé)
     */
    private List<Divisions> getAllSubDivisionsNonRecursive(String regionId) {
        List<Divisions> allSubDivisions = new ArrayList<>();
        
        try {
            // Niveau 1: Enfants directs de la région (cercles ou communes pour Bamako)
            List<Divisions> level1 = divisionsRepository.findByParentId(regionId);
            allSubDivisions.addAll(level1);
            
            // Niveau 2: Petits-enfants (arrondissements ou quartiers)
            for (Divisions child : level1) {
                List<Divisions> level2 = divisionsRepository.findByParentId(child.getId());
                allSubDivisions.addAll(level2);
                
                // Niveau 3: Arrière-petits-enfants (communes ou quartiers)
                for (Divisions grandChild : level2) {
                    List<Divisions> level3 = divisionsRepository.findByParentId(grandChild.getId());
                    allSubDivisions.addAll(level3);
                }
            }
            
            System.out.println("📝 [EntrepriseController] Sous-divisions trouvées pour région " + regionId + ": " + allSubDivisions.size());
            
        } catch (Exception e) {
            System.err.println("❌ [EntrepriseController] Erreur lors de la récupération des sous-divisions: " + e.getMessage());
        }
        
        return allSubDivisions;
    }

    /**
     * Ajouter récursivement toutes les sous-divisions d'une division parente
     * Gère le cas spécial de Bamako District qui a une structure différente
     * @deprecated Remplacé par getAllSubDivisionsNonRecursive pour éviter les timeouts
     */
    @Deprecated
    private void addAllSubDivisions(String parentId, Set<String> divisionIds) {
        // Récupérer la division parente pour vérifier si c'est Bamako
        Optional<Divisions> parentOpt = divisionsRepository.findById(parentId);
        if (!parentOpt.isPresent()) return;
        
        Divisions parent = parentOpt.get();
        boolean isBamako = parent.getNom() != null && 
                          parent.getNom().toUpperCase().contains("BAMAKO") &&
                          parent.getDivisionType() == DivisionType.REGION;
        
        if (isBamako) {
            // Structure spéciale pour Bamako District : Région → Communes directement
            System.out.println("📝 [EntrepriseController] Traitement spécial pour Bamako District");
            
            // Ajouter les communes de Bamako (Commune I, II, III, IV, V, VI)
            List<Divisions> communes = divisionsRepository.findByParentId(parentId);
            for (Divisions commune : communes) {
                divisionIds.add(commune.getId());
                System.out.println("📝 [EntrepriseController] Ajout commune Bamako: " + commune.getNom());
                
                // Ajouter les quartiers de chaque commune
                List<Divisions> quartiers = divisionsRepository.findByParentId(commune.getId());
                for (Divisions quartier : quartiers) {
                    divisionIds.add(quartier.getId());
                    System.out.println("📝 [EntrepriseController] Ajout quartier: " + quartier.getNom());
                }
            }
        } else {
            // Structure normale pour les autres régions : Région → Cercle → Arrondissement → Commune → Quartier
            List<Divisions> children = divisionsRepository.findByParentId(parentId);
            for (Divisions child : children) {
                divisionIds.add(child.getId());
                System.out.println("📝 [EntrepriseController] Ajout division: " + child.getNom() + " (" + child.getDivisionType() + ")");
                // Récursion pour les sous-divisions
                addAllSubDivisions(child.getId(), divisionIds);
            }
        }
    }

    /**
     * Vérifier les correspondances géographiques connues
     * @deprecated Remplacé par la logique basée sur la table divisions
     */
    @Deprecated
    private boolean isGeographicalMatch(String divisionNom, String region) {
        switch (region) {
            case "BAMAKO":
                return divisionNom.contains("SOTUBA") || 
                       divisionNom.contains("COMMUNE I") ||
                       divisionNom.contains("COMMUNE II") ||
                       divisionNom.contains("COMMUNE III") ||
                       divisionNom.contains("COMMUNE IV") ||
                       divisionNom.contains("COMMUNE V") ||
                       divisionNom.contains("COMMUNE VI") ||
                       divisionNom.contains("TALIKO");
            case "KAYES":
                return divisionNom.contains("KAYES") ||
                       divisionNom.contains("KITA") ||
                       divisionNom.contains("NIORO");
            case "KOULIKORO":
                return divisionNom.contains("KOULIKORO") ||
                       divisionNom.contains("KATI") ||
                       divisionNom.contains("DIOILA");
            case "SIKASSO":
                return divisionNom.contains("SIKASSO") ||
                       divisionNom.contains("BOUGOUNI") ||
                       divisionNom.contains("KOUTIALA");
            case "SEGOU":
                return divisionNom.contains("SEGOU") ||
                       divisionNom.contains("SAN");
            case "MOPTI":
                return divisionNom.contains("MOPTI") ||
                       divisionNom.contains("BANDIAGARA") ||
                       divisionNom.contains("DOUENTZA");
            default:
                return false;
        }
    }

    /**
     * Résout le nom d'une division via l'API INSTAT
     * @param divisionCode Code de division INSTAT (ex: "010101010001")
     * @return Nom de la division ou null si non trouvé
     */
    private String resolveDivisionNameFromInstat(String divisionCode) {
        if (divisionCode == null || divisionCode.length() < 12) {
            return null;
        }
        
        try {
            // Extraire les codes hiérarchiques
            String regionCode = divisionCode.substring(0, 2);
            String cercleCode = divisionCode.substring(0, 4);
            String communeCode = divisionCode.substring(0, 8);
            String quartierCode = divisionCode; // Code complet
            
            System.out.println("🔍 [INSTAT] Résolution division: " + divisionCode);
            System.out.println("🔍 [INSTAT] Région: " + regionCode + ", Cercle: " + cercleCode + ", Commune: " + communeCode + ", Quartier: " + quartierCode);
            
            // Appeler l'API INSTAT pour récupérer les quartiers de la commune
            var quartiers = instatApiService.getQuartiersByCommune(communeCode);
            
            if (quartiers != null) {
                // Chercher le quartier correspondant au code
                for (var quartier : quartiers) {
                    if (quartierCode.equals(quartier.getCode())) {
                        String nom = quartier.getNom();
                        System.out.println("✅ [INSTAT] Quartier trouvé: " + quartierCode + " -> " + nom);
                        return nom;
                    }
                }
            }
            
            System.out.println("⚠️ [INSTAT] Quartier non trouvé pour le code: " + quartierCode);
            return null;
            
        } catch (Exception e) {
            System.err.println("❌ [INSTAT] Erreur lors de la résolution du nom de division: " + e.getMessage());
            return null;
        }
    }

    /**
     * Récupère les statistiques de création d'entreprises par période
     * @return Statistiques de création (aujourd'hui, ce mois, semestre, année)
     */
    @GetMapping("/statistics/creation")
    public ResponseEntity<?> getCreationStatistics() {
        try {
            System.out.println("📊 [STATS] Récupération des statistiques de création");
            
            // Calculer les dates de référence
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
            LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
            LocalDateTime startOfSemester = now.minusMonths(6).toLocalDate().atStartOfDay();
            LocalDateTime startOfYear = now.withDayOfYear(1).toLocalDate().atStartOfDay();
            
            // Convertir en Instant pour correspondre au type du champ creation
            Instant nowInstant = now.toInstant(ZoneOffset.UTC);
            Instant startOfTodayInstant = startOfToday.toInstant(ZoneOffset.UTC);
            Instant startOfMonthInstant = startOfMonth.toInstant(ZoneOffset.UTC);
            Instant startOfSemesterInstant = startOfSemester.toInstant(ZoneOffset.UTC);
            Instant startOfYearInstant = startOfYear.toInstant(ZoneOffset.UTC);
            
            // Compter les créations par période
            long todayCount = entrepriseRepository.countByCreationBetween(startOfTodayInstant, nowInstant);
            long monthCount = entrepriseRepository.countByCreationBetween(startOfMonthInstant, nowInstant);
            long semesterCount = entrepriseRepository.countByCreationBetween(startOfSemesterInstant, nowInstant);
            long yearCount = entrepriseRepository.countByCreationBetween(startOfYearInstant, nowInstant);
            
            // Créer la réponse
            Map<String, Object> stats = new HashMap<>();
            stats.put("today", todayCount);
            stats.put("thisMonth", monthCount);
            stats.put("semester", semesterCount);
            stats.put("thisYear", yearCount);
            
            System.out.println("📊 [STATS] Statistiques calculées:");
            System.out.println("  - Aujourd'hui: " + todayCount);
            System.out.println("  - Ce mois: " + monthCount);
            System.out.println("  - Semestre: " + semesterCount);
            System.out.println("  - Cette année: " + yearCount);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.err.println("❌ [STATS] Erreur lors du calcul des statistiques: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du calcul des statistiques", "details", e.getMessage()));
        }
    }

    /**
     * Endpoint pour finaliser l'étape TCOM et passer à l'étape RCCM2
     */
    @PutMapping("/{entrepriseId}/finaliser-tcom")
    public ResponseEntity<Map<String, Object>> finaliserTCOM(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, Object> request) {
        try {
            String decision = (String) request.get("decision");
            String commentaire = (String) request.get("commentaire");
            
            System.out.println("🔄 [EntrepriseController] Finalisation TCOM pour entreprise: " + entrepriseId);
            System.out.println("📋 [EntrepriseController] Décision: " + decision);
            System.out.println("💬 [EntrepriseController] Commentaire: " + commentaire);
            
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new NotFoundException("Entreprise non trouvée"));
            
            if (entreprise.getEtapeValidation() != EtapeValidation.TCOM) {
                throw new BadRequestException("L'entreprise n'est pas à l'étape TCOM");
            }
            
            if ("approuve".equals(decision)) {
                // Passer à l'étape RCCM2
                entreprise.setEtapeValidation(EtapeValidation.RCCM2);
                System.out.println("✅ [EntrepriseController] Entreprise approuvée - transition vers RCCM2");
            } else if ("rejete".equals(decision)) {
                // Retourner à l'étape précédente selon le type d'entreprise
                // Toutes les entreprises rejetées retournent à REVISION (RCCM1 supprimé du workflow)
                entreprise.setEtapeValidation(EtapeValidation.REVISION);
                // Sauvegarder le motif de rejet
                entreprise.setMotifRejet(commentaire);
                System.out.println("❌ [EntrepriseController] Entreprise rejetée - retour vers REVISION");
                System.out.println("📝 [EntrepriseController] Motif de rejet sauvegardé: " + commentaire);
            } else {
                throw new BadRequestException("Décision invalide. Valeurs acceptées: 'approuve', 'rejete'");
            }
            
            // Sauvegarder les modifications
            entreprise = entrepriseRepository.save(entreprise);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "TCOM finalisé avec succès");
            response.put("nouvelleEtape", entreprise.getEtapeValidation().getValue());
            response.put("entrepriseId", entrepriseId);
            response.put("decision", decision);
            
            System.out.println("✅ [EntrepriseController] TCOM finalisé - nouvelle étape: " + entreprise.getEtapeValidation().getValue());
            
            return ResponseEntity.ok(response);
            
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la finalisation TCOM: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de la finalisation TCOM");
        }
    }

    /**
     * Endpoint pour enregistrer le téléchargement d'un document par l'utilisateur
     */
    @PostMapping("/{entrepriseId}/enregistrer-telechargement")
    public ResponseEntity<Map<String, Object>> enregistrerTelechargement(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, String> request) {
        
        try {
            String documentType = request.get("documentType");
            
            Entreprise entreprise = entrepriseService.findById(entrepriseId);
            
            if ("RCCM".equals(documentType)) {
                entreprise.setRccmTelecharge(true);
            } else if ("NINA".equals(documentType)) {
                entreprise.setNinaTelecharge(true);
            } else {
                throw new BadRequestException("Type de document invalide: " + documentType);
            }
            
            entrepriseService.save(entreprise);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Téléchargement enregistré avec succès");
            response.put("rccmTelecharge", entreprise.getRccmTelecharge());
            response.put("ninaTelecharge", entreprise.getNinaTelecharge());
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException e) {
            throw e;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'enregistrement du téléchargement: " + e.getMessage());
            e.printStackTrace();
            throw new BadRequestException("Erreur lors de l'enregistrement du téléchargement");
        }
    }

    // ==================== ENDPOINTS D'AGRÉMENT ====================

    /**
     * Initier une demande d'agrément pour une entreprise
     * POST /entreprises/agrement/initier/{entrepriseId}
     */
    @PostMapping("/agrement/initier/{entrepriseId}")
    public ResponseEntity<?> initierDemandeAgrement(@PathVariable String entrepriseId) {
        try {
            System.out.println("=== INITIATION AGREMENT - ID: " + entrepriseId + " ===");
            Entreprise entreprise = agrementService.initierDemandeAgrement(entrepriseId);
            
            // Retourner seulement les données essentielles pour éviter les problèmes de lazy loading
            Map<String, Object> response = new HashMap<>();
            response.put("id", entreprise.getId());
            response.put("nom", entreprise.getNom());
            response.put("etapeValidation", entreprise.getEtapeValidation());
            response.put("numeroAutorisation", entreprise.getNumeroAutorisation());
            response.put("typeAgrement", entreprise.getTypeAgrement());
            response.put("observations", entreprise.getObservations());
            response.put("success", true);
            response.put("message", "Demande d'agrément initiée avec succès");
            
            System.out.println("✅ Agrément initié - Étape: " + entreprise.getEtapeValidation());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            System.err.println("❌ Erreur validation: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Erreur initiation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'initiation de la demande d'agrément: " + e.getMessage()));
        }
    }

    /**
     * Soumettre la demande d'agrément avec tous les documents
     * POST /entreprises/agrement/soumettre/{entrepriseId}
     */
    @PostMapping("/agrement/soumettre/{entrepriseId}")
    public ResponseEntity<?> soumettreDemandeAgrement(@PathVariable String entrepriseId) {
        try {
            System.out.println("=== SOUMISSION AGREMENT - ID: " + entrepriseId + " ===");
            Entreprise entreprise = agrementService.soumettreDemandeAgrement(entrepriseId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande soumise avec succès. Elle sera traitée par un agent.");
            response.put("id", entreprise.getId());
            response.put("nom", entreprise.getNom());
            response.put("etapeValidation", entreprise.getEtapeValidation());
            response.put("observations", entreprise.getObservations());
            
            System.out.println("✅ Demande soumise - Étape: " + entreprise.getEtapeValidation());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            System.err.println("❌ Erreur validation: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Erreur soumission: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la soumission de la demande: " + e.getMessage()));
        }
    }

    /**
     * Upload d'un document pour l'autorisation d'exercice
     * POST /entreprises/agrement/upload/{entrepriseId}
     */
    @PostMapping(value = "/agrement/upload/{entrepriseId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocumentAgrement(
            @PathVariable String entrepriseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("typeDocument") String typeDocument) {
        
        System.out.println("=== UPLOAD DOCUMENT AGREMENT ===");
        System.out.println("Entreprise ID: " + entrepriseId);
        System.out.println("Type Document: " + typeDocument);
        System.out.println("Fichier: " + (file != null ? file.getOriginalFilename() : "null"));
        
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Le fichier est vide"));
            }
            
            String uploadDir = "uploads/agrement/";
            Path uploadPath = Paths.get(uploadDir + entrepriseId);
            Files.createDirectories(uploadPath);
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = typeDocument.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis() + extension;
            
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("filename", filename);
            response.put("typeDocument", typeDocument);
            response.put("entrepriseId", entrepriseId);
            response.put("path", filePath.toString());
            
            System.out.println("✅ Upload réussi: " + filename);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'upload du fichier: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur inattendue: " + e.getMessage()));
        }
    }

    /**
     * Lister les documents uploadés pour une entreprise
     * GET /entreprises/agrement/documents/{entrepriseId}
     */
    @GetMapping("/agrement/documents/{entrepriseId}")
    public ResponseEntity<List<Map<String, String>>> getDocumentsAgrement(@PathVariable String entrepriseId) {
        try {
            String uploadDir = "uploads/agrement/";
            Path uploadPath = Paths.get(uploadDir + entrepriseId);
            List<Map<String, String>> documents = new ArrayList<>();
            
            if (Files.exists(uploadPath)) {
                Files.list(uploadPath).forEach(path -> {
                    Map<String, String> doc = new HashMap<>();
                    doc.put("filename", path.getFileName().toString());
                    doc.put("path", path.toString());
                    try {
                        doc.put("size", String.valueOf(Files.size(path)));
                    } catch (IOException e) {
                        doc.put("size", "0");
                    }
                    documents.add(doc);
                });
            }
            
            return ResponseEntity.ok(documents);
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Télécharger un fichier d'agrément spécifique
     * GET /entreprises/agrement/file/{entrepriseId}?filename=xxx
     */
    @GetMapping("/agrement/file/{entrepriseId}")
    public ResponseEntity<byte[]> getAgrementFile(@PathVariable String entrepriseId, @RequestParam String filename) {
        try {
            String uploadDir = "uploads/agrement/";
            Path filePath = Paths.get(uploadDir + entrepriseId, filename);
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] data = Files.readAllBytes(filePath);
            
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("inline", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data);
                    
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
