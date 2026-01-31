package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.repository.AgrementAssignmentRepository;
import abdaty_technologie.API_Invest.repository.DemandeAutorisationExerciceRepository;
import abdaty_technologie.API_Invest.service.AgrementWorkflowService;
import abdaty_technologie.API_Invest.service.WorkflowDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/autorisation-exercice")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AutorisationExerciceController {

    private final WorkflowDefinitionService workflowDefinitionService;
    private final AgrementWorkflowService agrementWorkflowService;
    private final AgrementAssignmentRepository assignmentRepository;
    private final DemandeAutorisationExerciceRepository demandeRepository;

    // ==================== GESTION DES TYPES DE DEMANDES ====================

    /**
     * Obtenir la liste des types de demandes d'autorisation d'exercice
     * GET /autorisation-exercice/types-demandes
     */
    @GetMapping("/types-demandes")
    public ResponseEntity<List<Map<String, Object>>> getTypesDemandes() {
        try {
            List<Map<String, Object>> types = new java.util.ArrayList<>();
            
            // Ajouter les nouveaux types de demandes
            for (TypeDemandeAgrement type : TypeDemandeAgrement.values()) {
                if (type.isWorkflowComplet() || type.isWorkflowDecision() || type.isWorkflowSimple()) {
                    Map<String, Object> typeInfo = workflowDefinitionService.getWorkflowInfo(type);
                    types.add(typeInfo);
                }
            }
            
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtenir les détails d'un workflow spécifique
     * GET /autorisation-exercice/workflow/{typedemande}
     */
    @GetMapping("/workflow/{typedemande}")
    public ResponseEntity<?> getWorkflowDetails(@PathVariable String typedemande) {
        try {
            TypeDemandeAgrement type = TypeDemandeAgrement.valueOf(typedemande);
            Map<String, Object> workflowInfo = workflowDefinitionService.getWorkflowInfo(type);
            return ResponseEntity.ok(workflowInfo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type de demande invalide: " + typedemande));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== WORKFLOW AGRÉMENT COMPLET ====================

    /**
     * Créer une demande d'agrément avec paiement
     * POST /autorisation-exercice/agrement/creer
     */
    @PostMapping("/agrement/creer")
    public ResponseEntity<?> creerDemandeAgrement(@RequestBody Map<String, Object> request) {
        try {
            String entrepriseId = (String) request.get("entrepriseId");
            String agentId = (String) request.get("agentId");
            
            System.out.println("=== CRÉATION DEMANDE AGRÉMENT ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            
            // Créer l'assignation avec le workflow agrément
            AgrementAssignment assignment = agrementWorkflowService.creerDemandeAvecWorkflow(
                entrepriseId, agentId, TypeDemandeAgrement.AGREMENT);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande d'agrément créée avec succès");
            response.put("assignment", assignment);
            response.put("nextStep", workflowDefinitionService.getNextStep(TypeDemandeAgrement.AGREMENT, assignment.getEtape()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la création: " + e.getMessage()));
        }
    }

    /**
     * Passer à l'étape MIC (première validation)
     * POST /autorisation-exercice/agrement/passer-mic
     */
    @PostMapping("/agrement/passer-mic")
    public ResponseEntity<?> passerAuMIC(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = agrementWorkflowService.passerEtapeSuivante(
                entrepriseId, agentId, EtapeValidation.MIC_PREMIERE_VALIDATION, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au MIC");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer au Ministère des Finances
     * POST /autorisation-exercice/agrement/passer-finances
     */
    @PostMapping("/agrement/passer-finances")
    public ResponseEntity<?> passerAuxFinances(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = agrementWorkflowService.passerEtapeSuivante(
                entrepriseId, agentId, EtapeValidation.MINISTERE_FINANCES, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au Ministère des Finances");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer au SGG (première validation)
     * POST /autorisation-exercice/agrement/passer-sgg
     */
    @PostMapping("/agrement/passer-sgg")
    public ResponseEntity<?> passerAuSGG(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = agrementWorkflowService.passerEtapeSuivante(
                entrepriseId, agentId, EtapeValidation.SGG_PREMIERE_VALIDATION, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au SGG");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer à la Présidence
     * POST /autorisation-exercice/agrement/passer-presidence
     */
    @PostMapping("/agrement/passer-presidence")
    public ResponseEntity<?> passerALaPresidence(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = agrementWorkflowService.passerEtapeSuivante(
                entrepriseId, agentId, EtapeValidation.PRESIDENCE, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée à la Présidence");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== WORKFLOW DÉCISION ====================

    /**
     * Créer une demande de décision
     * POST /autorisation-exercice/decision/creer
     */
    @PostMapping("/decision/creer")
    public ResponseEntity<?> creerDemandeDecision(@RequestBody Map<String, Object> request) {
        try {
            String entrepriseId = (String) request.get("entrepriseId");
            String agentId = (String) request.get("agentId");
            
            System.out.println("=== CRÉATION DEMANDE DÉCISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            
            AgrementAssignment assignment = agrementWorkflowService.creerDemandeAvecWorkflow(
                entrepriseId, agentId, TypeDemandeAgrement.DECISION);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande de décision créée avec succès");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Workflow décision - Passer au MIC
     * POST /autorisation-exercice/decision/passer-mic
     */
    @PostMapping("/decision/passer-mic")
    public ResponseEntity<?> passerAuMICDecision(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = agrementWorkflowService.passerEtapeSuivante(
                entrepriseId, agentId, EtapeValidation.MIC_DECISION, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande de décision transférée au MIC");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== WORKFLOW ENREGISTREMENT ====================

    /**
     * Créer un enregistrement (traitement direct)
     * POST /autorisation-exercice/enregistrement/creer
     */
    @PostMapping("/enregistrement/creer")
    public ResponseEntity<?> creerEnregistrement(@RequestBody Map<String, Object> request) {
        try {
            String entrepriseId = (String) request.get("entrepriseId");
            String agentId = (String) request.get("agentId");
            
            System.out.println("=== CRÉATION ENREGISTREMENT ===");
            System.out.println("Entreprise: " + entrepriseId);
            
            // Pour l'enregistrement, on passe directement à l'étape finale
            AgrementAssignment assignment = agrementWorkflowService.creerDemandeAvecWorkflow(
                entrepriseId, agentId, TypeDemandeAgrement.ENREGISTREMENT);
            
            // Compléter immédiatement l'enregistrement
            assignment = agrementWorkflowService.passerEtapeSuivante(
                entrepriseId, agentId, EtapeValidation.ENREGISTREMENT_COMPLETE, "Enregistrement automatique");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Enregistrement effectué avec succès");
            response.put("assignment", assignment);
            response.put("completed", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== UTILITAIRES ====================

    /**
     * Obtenir le statut actuel d'une demande
     * GET /autorisation-exercice/statut/{entrepriseId}
     */
    @GetMapping("/statut/{entrepriseId}")
    public ResponseEntity<?> getStatutDemande(@PathVariable String entrepriseId) {
        try {
            AgrementAssignment assignment = agrementWorkflowService.getAssignationActuelle(entrepriseId);
            if (assignment == null) {
                return ResponseEntity.ok(Map.of("message", "Aucune demande trouvée"));
            }
            
            // Déterminer le type de demande basé sur l'étape actuelle
            TypeDemandeAgrement typedemande = determinerTypeDemande(assignment.getEtape());
            
            Map<String, Object> response = new HashMap<>();
            response.put("assignment", assignment);
            response.put("typedemande", typedemande);
            response.put("workflowInfo", workflowDefinitionService.getWorkflowInfo(typedemande));
            response.put("nextStep", workflowDefinitionService.getNextStep(typedemande, assignment.getEtape()));
            response.put("isCompleted", workflowDefinitionService.isLastStep(typedemande, assignment.getEtape()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Rejeter une demande à n'importe quelle étape
     * POST /autorisation-exercice/rejeter
     */
    @PostMapping("/rejeter")
    public ResponseEntity<?> rejeterDemande(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            String etapeRetour = request.get("etapeRetour"); // Optionnel
            
            AgrementAssignment assignment = agrementWorkflowService.rejeterDemande(
                entrepriseId, agentId, motifRejet, etapeRetour);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetée avec succès");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * Déterminer le type de demande basé sur l'étape actuelle
     */
    private TypeDemandeAgrement determinerTypeDemande(EtapeValidation etape) {
        if (etape.name().contains("AGREMENT")) {
            return TypeDemandeAgrement.AGREMENT;
        } else if (etape.name().contains("DECISION")) {
            return TypeDemandeAgrement.DECISION;
        } else if (etape.name().contains("ENREGISTREMENT")) {
            return TypeDemandeAgrement.ENREGISTREMENT;
        }
        return TypeDemandeAgrement.AGREMENT; // Par défaut
    }

    /**
     * Créer une nouvelle demande d'autorisation indépendante (sans entreprise existante)
     * POST /autorisation-exercice/nouvelle-demande
     */
    @PostMapping("/nouvelle-demande")
    public ResponseEntity<?> creerNouvelleDemande(@RequestBody Map<String, Object> nouvelleDemandeData) {
        try {
            System.out.println("=== CRÉATION NOUVELLE DEMANDE INDÉPENDANTE ===");
            System.out.println("Données reçues: " + nouvelleDemandeData);
            
            // Extraire les informations de la demande
            @SuppressWarnings("unchecked")
            Map<String, Object> demandeDetails = (Map<String, Object>) nouvelleDemandeData.get("demandeDetails");
            
            String typeDemande = (String) demandeDetails.get("typeDemande");
            String nomDemandeur = (String) demandeDetails.get("nomDemandeur");
            String prenomDemandeur = (String) demandeDetails.get("prenomDemandeur");
            String emailDemandeur = (String) demandeDetails.get("emailDemandeur");
            String nomEntreprise = (String) demandeDetails.get("nomEntreprise");
            
            System.out.println("Type: " + typeDemande);
            System.out.println("Demandeur: " + prenomDemandeur + " " + nomDemandeur);
            System.out.println("Entreprise: " + nomEntreprise);
            
            // Créer une nouvelle demande d'autorisation d'exercice
            TypeDemandeAgrement typeAgrement = TypeDemandeAgrement.valueOf(typeDemande);
            
            // Créer l'entité DemandeAutorisationExercice
            DemandeAutorisationExercice demande = new DemandeAutorisationExercice();
            demande.setTypeDemande(typeAgrement);
            demande.setEtapeActuelle(EtapeValidation.ACCUEIL);
            demande.setStatut("EN_COURS");
            
            // Informations du demandeur
            demande.setNomDemandeur(nomDemandeur);
            demande.setPrenomDemandeur(prenomDemandeur);
            demande.setEmailDemandeur(emailDemandeur);
            demande.setTelephoneDemandeur((String) demandeDetails.get("telephoneDemandeur"));
            demande.setAdresseDemandeur((String) demandeDetails.get("adresseDemandeur"));
            
            // Informations de l'entreprise
            demande.setNomEntreprise(nomEntreprise);
            demande.setSigleEntreprise((String) demandeDetails.get("sigleEntreprise"));
            demande.setSecteurActivite((String) demandeDetails.get("secteurActivite"));
            demande.setDescriptionActivite((String) demandeDetails.get("descriptionActivite"));
            demande.setAdresseEntreprise((String) demandeDetails.get("adresseEntreprise"));
            demande.setVilleEntreprise((String) demandeDetails.get("villeEntreprise"));
            demande.setRegionEntreprise((String) demandeDetails.get("regionEntreprise"));
            
            // Informations financières
            Object capitalSocial = demandeDetails.get("capitalSocial");
            if (capitalSocial instanceof Number) {
                demande.setCapitalSocial(java.math.BigDecimal.valueOf(((Number) capitalSocial).doubleValue()));
            }
            
            Object chiffreAffaires = demandeDetails.get("chiffreAffairesPrevisionnel");
            if (chiffreAffaires instanceof Number) {
                demande.setChiffreAffairesPrevisionnel(java.math.BigDecimal.valueOf(((Number) chiffreAffaires).doubleValue()));
            }
            
            Object nombreEmployes = demandeDetails.get("nombreEmployesPrevus");
            if (nombreEmployes instanceof Number) {
                demande.setNombreEmployesPrevus(((Number) nombreEmployes).intValue());
            }
            
            // Montant selon le type de demande
            java.math.BigDecimal montant = typeAgrement == TypeDemandeAgrement.AGREMENT ? 
                java.math.BigDecimal.valueOf(300000) : 
                typeAgrement == TypeDemandeAgrement.DECISION ? 
                java.math.BigDecimal.valueOf(150000) : 
                java.math.BigDecimal.valueOf(50000);
            demande.setMontantDemande(montant);
            
            // Documents fournis (JSON) - format propre et sécurisé
            Object documentsJoints = demandeDetails.get("documentsJoints");
            if (documentsJoints != null) {
                try {
                    // Créer un JSON simplifié avec seulement les informations essentielles
                    @SuppressWarnings("unchecked")
                    Map<String, Object> docs = (Map<String, Object>) documentsJoints;
                    Map<String, String> documentsSimplifies = new HashMap<>();
                    
                    for (Map.Entry<String, Object> entry : docs.entrySet()) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> docInfo = (Map<String, Object>) entry.getValue();
                        String nom = (String) docInfo.get("nom");
                        Boolean uploaded = (Boolean) docInfo.get("uploaded");
                        
                        if (uploaded != null && uploaded && nom != null) {
                            documentsSimplifies.put(entry.getKey(), nom);
                        }
                    }
                    
                    // Convertir en JSON string propre
                    StringBuilder jsonBuilder = new StringBuilder("{");
                    boolean first = true;
                    for (Map.Entry<String, String> entry : documentsSimplifies.entrySet()) {
                        if (!first) jsonBuilder.append(",");
                        jsonBuilder.append("\"").append(entry.getKey()).append("\":\"").append(entry.getValue()).append("\"");
                        first = false;
                    }
                    jsonBuilder.append("}");
                    
                    String documentsJson = jsonBuilder.toString();
                    // Limiter la taille pour éviter les contraintes DB
                    if (documentsJson.length() > 1000) {
                        documentsJson = documentsJson.substring(0, 997) + "...";
                    }
                    
                    demande.setDocumentsFournis(documentsJson);
                    System.out.println("Documents JSON: " + documentsJson);
                    
                } catch (Exception e) {
                    System.err.println("Erreur formatage documents: " + e.getMessage());
                    demande.setDocumentsFournis("{\"error\":\"Format invalide\"}");
                }
            }
            
            // Informations de workflow
            demande.setAntenneTraitement("BAMAKO_CENTRE");
            demande.setDelaiTraitementEstime(typeAgrement == TypeDemandeAgrement.AGREMENT ? 90 : 
                                           typeAgrement == TypeDemandeAgrement.DECISION ? 45 : 10);
            
            // Sauvegarder la demande dans la table demande_autorisation_exercice
            demande = demandeRepository.save(demande);
            
            // Créer aussi une entrée AgrementAssignment pour l'intégration avec le workflow des agents
            System.out.println("=== CRÉATION AGREMENT ASSIGNMENT ===");
            AgrementAssignment assignment = new AgrementAssignment();
            assignment.setEntrepriseId(demande.getNumeroDemande()); // Utiliser le numéro de demande comme référence
            assignment.setAgentId(null); // Pas encore assigné
            assignment.setEtape(EtapeValidation.ACCUEIL);
            assignment.setStatut("EN_COURS");
            assignment.setDateAssignment(java.time.LocalDateTime.now());
            assignment.setObservations("Nouvelle demande indépendante - ID: " + demande.getId() + 
                                     " - Demandeur: " + prenomDemandeur + " " + nomDemandeur + 
                                     " - Entreprise: " + nomEntreprise);
            
            System.out.println("Assignment avant sauvegarde:");
            System.out.println("- EntrepriseId: " + assignment.getEntrepriseId());
            System.out.println("- AgentId: " + assignment.getAgentId());
            System.out.println("- Etape: " + assignment.getEtape());
            System.out.println("- Statut: " + assignment.getStatut());
            System.out.println("- DateAssignment: " + assignment.getDateAssignment());
            
            // Sauvegarder l'assignation pour qu'elle apparaisse dans l'interface agent
            try {
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ AgrementAssignment sauvegardé avec ID: " + assignment.getId());
            } catch (Exception e) {
                System.err.println("❌ Erreur sauvegarde AgrementAssignment: " + e.getMessage());
                e.printStackTrace();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Nouvelle demande créée avec succès");
            response.put("demande", demande);
            response.put("numeroDemande", demande.getNumeroDemande());
            response.put("typedemande", typeAgrement);
            response.put("nextStep", workflowDefinitionService.getNextStep(typeAgrement, demande.getEtapeActuelle()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Erreur création nouvelle demande: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la création: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
