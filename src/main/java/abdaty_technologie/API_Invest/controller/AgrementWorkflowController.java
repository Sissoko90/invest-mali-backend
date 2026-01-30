<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.repository.AgrementAssignmentRepository;
import abdaty_technologie.API_Invest.repository.DemandeAutorisationExerciceRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.AgrementWorkflowService;
import abdaty_technologie.API_Invest.service.InvestmentAgreementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.time.LocalDateTime;
import java.util.Optional;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agrement-workflow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgrementWorkflowController {

    private final AgrementWorkflowService workflowService;
    private final AgrementAssignmentRepository assignmentRepository;
    private final DemandeAutorisationExerciceRepository demandeRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final InvestmentAgreementService investmentAgreementService;

    // ==================== ÉTAPE ACCUEIL ====================

    /**
     * Test simple pour vérifier que le contrôleur fonctionne
     * GET /agrement-workflow/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "AgrementWorkflowController fonctionne");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Test pour vérifier toutes les assignations en base
     * GET /agrement-workflow/debug/all-assignations
     */
    @GetMapping("/debug/all-assignations")
    public ResponseEntity<?> getAllAssignationsDebug() {
        try {
            System.out.println("=== DEBUG: Récupération de toutes les assignations ===");
            
            List<AgrementAssignment> allAssignations = assignmentRepository.findAll();
            System.out.println("Total assignations en base: " + allAssignations.size());
            
            for (AgrementAssignment assignation : allAssignations) {
                System.out.println("- ID: " + assignation.getId() + 
                                 ", Agent: " + assignation.getAgentId() + 
                                 ", Entreprise: " + assignation.getEntrepriseId() + 
                                 ", Statut: " + assignation.getStatut() +
                                 ", Etape: " + assignation.getEtape());
            }
            
            return ResponseEntity.ok(allAssignations);
            
        } catch (Exception e) {
            System.err.println("Erreur debug assignations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Récupérer les assignations d'un agent
     * GET /agrement-workflow/accueil/mes-assignations/{agentId}
     */
    @GetMapping("/accueil/mes-assignations/{agentId}")
    public ResponseEntity<?> getMesAssignations(@PathVariable String agentId) {
        try {
            System.out.println("=== CONTROLLER: getMesAssignations appelé pour agent: " + agentId + " ===");
            
            // Récupérer les assignations normales (AgrementAssignment)
            List<AgrementAssignment> assignationsNormales = workflowService.getMesAssignations(agentId);
            System.out.println("=== CONTROLLER: " + assignationsNormales.size() + " assignations normales trouvées ===");
            
            // Récupérer les demandes indépendantes assignées à cet agent
            List<DemandeAutorisationExercice> demandesIndependantesAssignees = demandeRepository.findAll().stream()
                .filter(demande -> agentId.equals(demande.getAgentAssigneId()))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + demandesIndependantesAssignees.size() + " demandes indépendantes assignées ===");
            
            // Créer des objets AgrementAssignment fictifs pour les demandes indépendantes
            List<AgrementAssignment> assignationsIndependantes = new ArrayList<>();
            for (DemandeAutorisationExercice demande : demandesIndependantesAssignees) {
                AgrementAssignment assignmentFictif = new AgrementAssignment();
                // Utiliser le nom de l'entreprise comme ID pour l'affichage
                assignmentFictif.setEntrepriseId(demande.getNomEntreprise() + " (" + demande.getNumeroDemande() + ")");
                assignmentFictif.setAgentId(agentId);
                assignmentFictif.setEtape(demande.getEtapeActuelle());
                assignmentFictif.setStatut(demande.getStatut());
                assignmentFictif.setDateAssignment(demande.getDateDerniereModification());
                assignmentFictif.setObservations("Demande indépendante - " + demande.getNomEntreprise() + 
                                               " (Demandeur: " + demande.getPrenomDemandeur() + " " + demande.getNomDemandeur() + ")");
                assignationsIndependantes.add(assignmentFictif);
            }
            
            // Combiner toutes les assignations
            List<AgrementAssignment> toutesLesAssignations = new ArrayList<>(assignationsNormales);
            toutesLesAssignations.addAll(assignationsIndependantes);
            
            System.out.println("=== CONTROLLER: Total " + toutesLesAssignations.size() + " assignations (incluant " + assignationsIndependantes.size() + " indépendantes) ===");
            return ResponseEntity.ok(toutesLesAssignations);
            
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getMesAssignations ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la récupération des assignations");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Lister les demandes non assignées
     * GET /agrement-workflow/accueil/demandes-non-assignees
     */
    @GetMapping("/accueil/demandes-non-assignees")
    public ResponseEntity<?> getDemandesNonAssignees() {
        try {
            System.out.println("=== CONTROLLER: getDemandesNonAssignees appelé ===");
            
            // Récupérer les demandes liées aux entreprises existantes (système actuel)
            List<Entreprise> demandesEntreprises = workflowService.getDemandesNonAssignees();
            System.out.println("=== CONTROLLER: " + demandesEntreprises.size() + " demandes d'entreprises ===");
            
            // Récupérer les nouvelles demandes indépendantes depuis demande_autorisation_exercice
            List<DemandeAutorisationExercice> toutesLesDemandesIndependantes = demandeRepository.findAll();
            System.out.println("=== CONTROLLER: Total " + toutesLesDemandesIndependantes.size() + " demandes indépendantes en base ===");
            
            // Récupérer les demandes d'investissement
            List<InvestmentAgreement> demandesInvestissement = investmentAgreementService.getAllInvestmentAgreements();
            System.out.println("=== CONTROLLER: Total " + demandesInvestissement.size() + " demandes d'investissement en base ===");
            
            for (DemandeAutorisationExercice demande : toutesLesDemandesIndependantes) {
                System.out.println("Demande ID: " + demande.getId());
                System.out.println("- NumeroDemande: " + demande.getNumeroDemande());
                System.out.println("- NomDemandeur: " + demande.getNomDemandeur());
                System.out.println("- NomEntreprise: " + demande.getNomEntreprise());
                System.out.println("- EtapeActuelle: " + demande.getEtapeActuelle());
                System.out.println("- Statut: " + demande.getStatut());
                System.out.println("- AgentAssigneId: " + demande.getAgentAssigneId());
                System.out.println("---");
            }
            
            List<DemandeAutorisationExercice> demandesNonAssignees = toutesLesDemandesIndependantes.stream()
                .filter(demande -> {
                    boolean agentNull = demande.getAgentAssigneId() == null;
                    boolean etapeAccueil = demande.getEtapeActuelle() == EtapeValidation.ACCUEIL;
                    boolean statutEnCours = "EN_COURS".equals(demande.getStatut());
                    boolean nonAssignee = agentNull && etapeAccueil && statutEnCours;
                    System.out.println("Filtrage " + demande.getId() + ": agentNull=" + agentNull + ", etapeAccueil=" + etapeAccueil + ", statutEnCours=" + statutEnCours + ", nonAssignee=" + nonAssignee);
                    return nonAssignee;
                })
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + demandesNonAssignees.size() + " demandes non assignées après filtrage ===");
            
            // Créer des objets Entreprise fictifs pour les demandes indépendantes afin de maintenir la compatibilité
            List<Entreprise> toutesLesDemandes = new ArrayList<>(demandesEntreprises);
            
            for (DemandeAutorisationExercice demande : demandesNonAssignees) {
                // Créer une entreprise fictive pour chaque demande indépendante
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId(demande.getNumeroDemande()); // Utiliser le numéro de demande comme ID
                entrepriseFictive.setNom(demande.getNomEntreprise()); // Utiliser le nom de l'entreprise
                
                toutesLesDemandes.add(entrepriseFictive);
            }
            
            // Récupérer toutes les assignations existantes pour filtrer les demandes d'investissement
            List<AgrementAssignment> toutesLesAssignations = assignmentRepository.findAll();
            List<String> entreprisesAssignees = toutesLesAssignations.stream()
                .map(AgrementAssignment::getEntrepriseId)
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + entreprisesAssignees.size() + " entreprises déjà assignées ===");
            
            // Ajouter les demandes d'investissement NON ASSIGNÉES seulement
            for (InvestmentAgreement investmentAgreement : demandesInvestissement) {
                String entrepriseIdAvecPrefixe = "INV-" + investmentAgreement.getId();
                
                // Vérifier si cette demande d'investissement est déjà assignée
                boolean dejaAssignee = entreprisesAssignees.contains(entrepriseIdAvecPrefixe);
                System.out.println("=== VERIFICATION ASSIGNATION: " + entrepriseIdAvecPrefixe + " - Déjà assignée: " + dejaAssignee + " ===");
                
                if (!dejaAssignee) {
                    // Créer une entreprise fictive pour chaque demande d'investissement NON ASSIGNÉE
                    Entreprise entrepriseFictive = new Entreprise();
                    entrepriseFictive.setId(entrepriseIdAvecPrefixe); // Préfixe pour distinguer
                    entrepriseFictive.setNom(investmentAgreement.getIdentification().getNomRaisonSociale());
                    entrepriseFictive.setReference(investmentAgreement.getReferenceNumber());
                    entrepriseFictive.setTypeDemandeAgrement(TypeDemandeAgrement.AGREMENT); // Marquer comme demande d'investissement
                    entrepriseFictive.setStatutCreation(investmentAgreement.getStatut());
                    
                    toutesLesDemandes.add(entrepriseFictive);
                    System.out.println("=== AJOUT DEMANDE INVESTISSEMENT NON ASSIGNÉE: " + investmentAgreement.getReferenceNumber() + " - " + investmentAgreement.getIdentification().getNomRaisonSociale() + " ===");
                } else {
                    System.out.println("=== DEMANDE INVESTISSEMENT DÉJÀ ASSIGNÉE - IGNORÉE: " + investmentAgreement.getReferenceNumber() + " ===");
                }
            }
            
            System.out.println("=== CONTROLLER: Total " + toutesLesDemandes.size() + " demandes (incluant " + demandesNonAssignees.size() + " indépendantes) ===");
            
            // Retourner le format original attendu par le frontend
            return ResponseEntity.ok(toutesLesDemandes);
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDemandesNonAssignees ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            // Retourner une réponse d'erreur détaillée
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur serveur");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Assigner une demande à un agent
     * POST /agrement-workflow/accueil/assigner
     */
    @PostMapping("/accueil/assigner")
    public ResponseEntity<?> assignerDemande(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== ASSIGNATION DEMANDE ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            
            // Vérifier le type de demande
            if (entrepriseId != null && entrepriseId.startsWith("AGR-")) {
                System.out.println("=== ASSIGNATION DEMANDE INDÉPENDANTE ===");
                
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> entrepriseId.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Demande indépendante non trouvée: " + entrepriseId));
                
                // Assigner l'agent à la demande
                demande.setAgentAssigneId(agentId);
                demande.setResponsableEtapeActuelle(agentId);
                demande.setDateDerniereModification(java.time.LocalDateTime.now());
                
                // Sauvegarder la demande mise à jour
                demande = demandeRepository.save(demande);
                
                System.out.println("✅ Demande indépendante assignée à l'agent: " + agentId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande indépendante assignée avec succès");
                response.put("demande", demande);
                response.put("numeroDemande", demande.getNumeroDemande());
                
                return ResponseEntity.ok(response);
            } else if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== ASSIGNATION DEMANDE D'INVESTISSEMENT ===");
                
                // Vérifier s'il existe déjà une assignation pour cette demande
                Optional<AgrementAssignment> assignationExistante = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId))
                    .findFirst();
                
                if (assignationExistante.isPresent()) {
                    System.out.println("⚠️ Assignation existante trouvée, suppression...");
                    assignmentRepository.delete(assignationExistante.get());
                }
                
                // Extraire l'ID réel de la demande d'investissement (enlever le préfixe INV-)
                String realInvestmentId = entrepriseId.substring(4);
                System.out.println("ID réel de la demande d'investissement: " + realInvestmentId);
                
                // Récupérer les détails de la demande d'investissement pour obtenir le vrai nom
                List<InvestmentAgreement> demandesInvestissement = investmentAgreementService.getAllInvestmentAgreements();
                InvestmentAgreement investmentAgreement = demandesInvestissement.stream()
                    .filter(inv -> inv.getId().equals(realInvestmentId))
                    .findFirst()
                    .orElse(null);
                
                String nomEntreprise = "Entreprise inconnue";
                if (investmentAgreement != null) {
                    nomEntreprise = investmentAgreement.getIdentification().getNomRaisonSociale();
                    System.out.println("Nom de l'entreprise trouvé: " + nomEntreprise);
                }
                
                // Créer un enregistrement d'assignation dans la base de données
                AgrementAssignment assignment = new AgrementAssignment();
                assignment.setEntrepriseId(entrepriseId); // Garder le préfixe INV- pour l'identifier
                assignment.setAgentId(agentId);
                assignment.setAgentNom("Agent"); // Nom par défaut, peut être amélioré plus tard
                assignment.setEtape(EtapeValidation.ACCUEIL);
                assignment.setDateAssignment(LocalDateTime.now());
                assignment.setStatut("EN_COURS");
                assignment.setDocumentsVerifies(false);
                assignment.setObservations("Demande d'investissement assignée - " + nomEntreprise + " (ID: " + realInvestmentId + ")");
                
                // Sauvegarder l'assignation
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Assignation d'investissement persistée avec ID: " + assignment.getId());
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement assignée avec succès");
                response.put("assignment", assignment);
                response.put("entrepriseId", entrepriseId);
                response.put("agentId", agentId);
                response.put("investmentId", realInvestmentId);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les entreprises normales
                AgrementAssignment assignment = workflowService.assignerDemandeAccueil(entrepriseId, agentId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande assignée avec succès");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'assignation: " + e.getMessage()));
        }
    }


    /**
     * Vérifier les documents
     * POST /agrement-workflow/accueil/verifier-documents
     */
    @PostMapping("/accueil/verifier-documents")
    public ResponseEntity<?> verifierDocuments(@RequestBody Map<String, Object> request) {
        try {
            String entrepriseId = (String) request.get("entrepriseId");
            String agentId = (String) request.get("agentId");
            Boolean documentsOk = (Boolean) request.get("documentsOk");
            String observations = (String) request.get("observations");
            
            System.out.println("=== VÉRIFICATION DOCUMENTS ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            System.out.println("Documents OK: " + documentsOk);
            
            // Vérifier si c'est une demande indépendante (commence par AGR-)
            if (entrepriseId != null && entrepriseId.startsWith("AGR-")) {
                System.out.println("=== VÉRIFICATION DOCUMENTS DEMANDE INDÉPENDANTE ===");
                
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> entrepriseId.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Demande indépendante non trouvée: " + entrepriseId));
                
                // Mettre à jour le statut de vérification des documents
                if (documentsOk != null && documentsOk) {
                    // Documents vérifiés et conformes
                    demande.setObservations("Documents vérifiés et conformes - " + 
                                          (observations != null ? observations : "Aucune observation"));
                    System.out.println("✅ Documents validés pour la demande: " + entrepriseId);
                } else {
                    // Documents non conformes
                    demande.setObservations("Documents non conformes - " + 
                                          (observations != null ? observations : "Documents à corriger"));
                    System.out.println("❌ Documents non conformes pour la demande: " + entrepriseId);
                }
                
                demande.setDateDerniereModification(java.time.LocalDateTime.now());
                
                // Sauvegarder la demande mise à jour
                demande = demandeRepository.save(demande);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Documents vérifiés pour la demande indépendante");
                response.put("demande", demande);
                response.put("documentsOk", documentsOk);
                
                return ResponseEntity.ok(response);
            } else if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== VÉRIFICATION DOCUMENTS DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId))
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Mettre à jour le statut de vérification des documents
                if (documentsOk != null && documentsOk) {
                    assignment.setDocumentsVerifies(true);
                    assignment.setObservations(assignment.getObservations() + " - Documents vérifiés et conformes - " + 
                                             (observations != null ? observations : "Aucune observation"));
                    System.out.println("✅ Documents validés pour la demande d'investissement: " + entrepriseId);
                } else {
                    assignment.setDocumentsVerifies(false);
                    assignment.setObservations(assignment.getObservations() + " - Documents non conformes - " + 
                                             (observations != null ? observations : "Documents à corriger"));
                    System.out.println("❌ Documents non conformes pour la demande d'investissement: " + entrepriseId);
                }
                
                assignment.setDateTraitement(LocalDateTime.now());
                
                // Sauvegarder l'assignation mise à jour
                assignment = assignmentRepository.save(assignment);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Documents vérifiés pour la demande d'investissement");
                response.put("assignment", assignment);
                response.put("documentsOk", documentsOk);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les entreprises normales
                AgrementAssignment assignment = workflowService.verifierDocumentsAccueil(
                    entrepriseId, agentId, documentsOk, observations);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Documents vérifiés");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Récupérer les documents d'une demande indépendante
     * GET /agrement-workflow/accueil/documents/{numeroDemande}
     */
    @GetMapping("/accueil/documents/{numeroDemande}")
    public ResponseEntity<?> getDocumentsDemandeIndependante(@PathVariable String numeroDemande) {
        try {
            System.out.println("=== RÉCUPÉRATION DOCUMENTS DEMANDE INDÉPENDANTE ===");
            System.out.println("Numéro de demande: " + numeroDemande);
            
            // Vérifier si c'est une demande indépendante (commence par AGR-)
            if (numeroDemande != null && numeroDemande.startsWith("AGR-")) {
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> numeroDemande.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElse(null);
                
                if (demande == null) {
                    System.out.println("❌ Demande indépendante non trouvée: " + numeroDemande);
                    return ResponseEntity.ok(new ArrayList<>());
                }
                
                System.out.println("✅ Demande trouvée: " + demande.getNomEntreprise());
                System.out.println("Documents fournis: " + demande.getDocumentsFournis());
                
                // Parser les documents JSON
                List<Map<String, Object>> documents = new ArrayList<>();
                if (demande.getDocumentsFournis() != null && !demande.getDocumentsFournis().trim().isEmpty()) {
                    try {
                        String documentsJson = demande.getDocumentsFournis();
                        System.out.println("JSON brut: " + documentsJson);
                        
                        // Parser JSON simple - extraire les paires clé-valeur
                        // Format attendu: {"key1":"value1","key2":"value2",...}
                        if (documentsJson.startsWith("{") && documentsJson.endsWith("}")) {
                            String content = documentsJson.substring(1, documentsJson.length() - 1);
                            String[] pairs = content.split(",");
                            
                            int docId = 1;
                            for (String pair : pairs) {
                                String[] keyValue = pair.split(":");
                                if (keyValue.length == 2) {
                                    String key = keyValue[0].trim().replaceAll("\"", "");
                                    String fileName = keyValue[1].trim().replaceAll("\"", "");
                                    
                                    Map<String, Object> doc = new HashMap<>();
                                    doc.put("id", String.valueOf(docId++));
                                    doc.put("type", key.toUpperCase());
                                    doc.put("nom", getDocumentDisplayName(key));
                                    doc.put("fileName", fileName);
                                    documents.add(doc);
                                    
                                    System.out.println("Document ajouté: " + key + " -> " + fileName);
                                }
                            }
                        }
                        
                    } catch (Exception e) {
                        System.err.println("Erreur parsing JSON documents: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                System.out.println("=== DOCUMENTS TROUVÉS: " + documents.size() + " ===");
                return ResponseEntity.ok(documents);
            } else {
                // Pour les entreprises normales, retourner une liste vide
                return ResponseEntity.ok(new ArrayList<>());
            }
            
        } catch (Exception e) {
            System.err.println("Erreur récupération documents: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Créer une image SVG de placeholder pour visualiser un document
     */
    private String createDocumentPlaceholder(String filename, String demandeId, String nomEntreprise) {
        // Déterminer le type de fichier par l'extension
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        String iconColor = "#3B82F6"; // Bleu par défaut
        String iconPath = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"; // Icône document par défaut
        
        // Personnaliser selon le type de fichier
        switch (extension) {
            case "pdf":
                iconColor = "#DC2626"; // Rouge pour PDF
                iconPath = "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
                break;
            case "png":
            case "jpg":
            case "jpeg":
                iconColor = "#059669"; // Vert pour images
                iconPath = "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
                break;
        }
        
        return String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<svg width=\"400\" height=\"300\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">" +
            "<defs>" +
            "<style type=\"text/css\">" +
            ".document-bg { fill: #F8FAFC; stroke: #E2E8F0; stroke-width: 2; }" +
            ".document-icon { fill: none; stroke: %s; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }" +
            ".title-text { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #1F2937; text-anchor: middle; }" +
            ".subtitle-text { font-family: Arial, sans-serif; font-size: 14px; fill: #6B7280; text-anchor: middle; }" +
            ".info-text { font-family: Arial, sans-serif; font-size: 12px; fill: #9CA3AF; text-anchor: middle; }" +
            ".hint-text { font-family: Arial, sans-serif; font-size: 10px; fill: #D1D5DB; text-anchor: middle; }" +
            "</style>" +
            "</defs>" +
            "<rect width=\"100%%\" height=\"100%%\" class=\"document-bg\" rx=\"8\"/>" +
            "<g transform=\"translate(168,60)\">" +
            "<svg width=\"64\" height=\"64\" viewBox=\"0 0 24 24\" class=\"document-icon\">" +
            "<path d=\"%s\"/>" +
            "</svg>" +
            "</g>" +
            "<text x=\"200\" y=\"160\" class=\"title-text\">%s</text>" +
            "<text x=\"200\" y=\"185\" class=\"subtitle-text\">%s</text>" +
            "<text x=\"200\" y=\"210\" class=\"info-text\">Demande: %s</text>" +
            "<text x=\"200\" y=\"240\" class=\"hint-text\">Document disponible</text>" +
            "<circle cx=\"350\" cy=\"50\" r=\"8\" fill=\"%s\" opacity=\"0.8\"/>" +
            "</svg>",
            iconColor, iconPath, filename, nomEntreprise, demandeId, iconColor
        );
    }

    /**
     * Déterminer le type de contenu à partir du nom de fichier
     */
    private String getContentTypeFromFilename(String filename) {
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return switch (extension) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "bmp" -> "image/bmp";
            case "webp" -> "image/webp";
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "txt" -> "text/plain";
            default -> "application/octet-stream";
        };
    }

    /**
     * Convertir les clés de documents JSON en noms d'affichage lisibles
     */
    private String getDocumentDisplayName(String key) {
        switch (key.toLowerCase()) {
            case "diplomearchitecte": return "Diplôme d'Architecte";
            case "casierjudiciaire": return "Casier Judiciaire";
            case "certificatnationalite": return "Certificat de Nationalité";
            case "curriculumvitae": return "Curriculum Vitae";
            case "attestationordrephysique": return "Attestation Ordre Physique";
            case "demandetimbre": return "Demande Timbre";
            case "actenaissance": return "Acte de Naissance";
            case "certificatresidence": return "Certificat de Résidence";
            case "attestationassurance": return "Attestation d'Assurance";
            case "diplomeingenieur": return "Diplôme d'Ingénieur";
            case "licenceprofessionnelle": return "Licence Professionnelle";
            default: 
                // Convertir camelCase en titre lisible
                String result = key.replaceAll("([a-z])([A-Z])", "$1 $2");
                return result.substring(0, 1).toUpperCase() + result.substring(1);
        }
    }


    /**
     * Rejeter une demande depuis l'accueil
     * POST /agrement-workflow/accueil/rejeter
     */
    @PostMapping("/accueil/rejeter")
    public ResponseEntity<?> rejeterDemandeAccueil(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            
            System.out.println("=== REJET DEMANDE ACCUEIL ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Motif: " + motifRejet);
            
            // Pour l'instant, on marque juste la demande comme rejetée
            // Vous pouvez implémenter une logique spécifique selon vos besoins
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetée avec succès");
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du rejet: " + e.getMessage()));
        }
    }

    /**
     * Passer en révision
     * POST /agrement-workflow/accueil/passer-revision
     */
    @PostMapping("/accueil/passer-revision")
    public ResponseEntity<?> passerEnRevision(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== PASSER EN RÉVISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== PASSER EN RÉVISION DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId) && a.getEtape() == EtapeValidation.ACCUEIL)
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Vérifier que c'est le bon agent
                if (!agentId.equals(assignment.getAgentId())) {
                    throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
                }
                
                // Vérifier que les documents ont été vérifiés
                if (!Boolean.TRUE.equals(assignment.getDocumentsVerifies())) {
                    throw new IllegalStateException("Les documents doivent être vérifiés avant de passer en révision");
                }
                
                // Marquer l'assignation actuelle comme validée et passer à l'étape révision
                assignment.setStatut("VALIDE");
                assignment.setEtape(EtapeValidation.REVISION);
                assignment.setDateTraitement(LocalDateTime.now());
                assignment.setObservations(assignment.getObservations() + " - Passé en révision le " + LocalDateTime.now());
                
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Demande d'investissement passée en révision: " + entrepriseId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement passée en révision avec succès");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les autres types de demandes
                AgrementAssignment assignment = workflowService.passerEnRevision(entrepriseId, agentId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande passée en révision avec succès");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE REVISION ====================

    /**
     * Lister les demandes en révision (incluant les demandes d'investissement)
     * GET /agrement-workflow/revision/demandes
     */
    @GetMapping("/revision/demandes")
    public ResponseEntity<?> getDemandesRevision() {
        try {
            System.out.println("=== CONTROLLER: getDemandesRevision appelé ===");
            
            // Récupérer les entreprises normales à l'étape REVISION_AGREMENT
            List<Entreprise> entreprisesNormales = entrepriseRepository.findByEtapeValidation(EtapeValidation.REVISION_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("=== CONTROLLER: " + entreprisesNormales.size() + " entreprises normales en révision ===");
            
            // Récupérer les assignations d'investissement à l'étape REVISION
            List<AgrementAssignment> assignationsInvestissement = assignmentRepository.findAll().stream()
                .filter(a -> a.getEtape() == EtapeValidation.REVISION && a.getEntrepriseId().startsWith("INV-"))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + assignationsInvestissement.size() + " demandes d'investissement en révision ===");
            
            // Créer des objets Entreprise fictifs pour les demandes d'investissement
            List<Entreprise> toutesLesEntreprises = new ArrayList<>(entreprisesNormales);
            
            for (AgrementAssignment assignment : assignationsInvestissement) {
                // Extraire le nom depuis les observations
                String nomEntreprise = "Entreprise " + assignment.getEntrepriseId().substring(0, 8) + "...";
                if (assignment.getObservations() != null) {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Demande d'investissement assignée - (.+?) \\(ID:");
                    java.util.regex.Matcher matcher = pattern.matcher(assignment.getObservations());
                    if (matcher.find()) {
                        nomEntreprise = matcher.group(1);
                    }
                }
                
                // Créer une entreprise fictive pour l'affichage
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId(assignment.getEntrepriseId());
                entrepriseFictive.setNom(nomEntreprise);
                entrepriseFictive.setEtapeValidation(EtapeValidation.REVISION_AGREMENT); // Pour compatibilité frontend
                entrepriseFictive.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
                entrepriseFictive.setTypeDemandeAgrement(TypeDemandeAgrement.AGREMENT);
                
                toutesLesEntreprises.add(entrepriseFictive);
                System.out.println("=== AJOUT DEMANDE INVESTISSEMENT EN RÉVISION: " + nomEntreprise + " (" + assignment.getEntrepriseId() + ") ===");
            }
            
            System.out.println("=== CONTROLLER: Total " + toutesLesEntreprises.size() + " demandes en révision ===");
            return ResponseEntity.ok(toutesLesEntreprises);
            
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDemandesRevision ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la récupération des demandes en révision");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Obtenir les documents d'une entreprise (incluant les demandes d'investissement)
     * GET /agrement-workflow/revision/documents/{entrepriseId}
     */
    @GetMapping("/revision/documents/{entrepriseId}")
    public ResponseEntity<?> getDocuments(@PathVariable String entrepriseId) {
        try {
            System.out.println("=== CONTROLLER: getDocuments appelé pour: " + entrepriseId + " ===");
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== RÉCUPÉRATION DOCUMENTS DEMANDE D'INVESTISSEMENT ===");
                
                // Extraire l'ID réel de la demande d'investissement
                String realInvestmentId = entrepriseId.substring(4);
                System.out.println("ID réel de la demande d'investissement: " + realInvestmentId);
                
                // Récupérer les documents via le service d'investissement
                List<abdaty_technologie.API_Invest.dto.InvestmentAgreementDocumentDto> documentsInvestissement = 
                    investmentAgreementService.getDocumentsByAgreementId(realInvestmentId);
                
                System.out.println("=== CONTROLLER: " + documentsInvestissement.size() + " documents trouvés pour l'investissement ===");
                
                Map<String, Object> response = new HashMap<>();
                response.put("documents", documentsInvestissement);
                response.put("count", documentsInvestissement.size());
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les entreprises normales
                Map<String, Object> documents = workflowService.getDocumentsEntreprise(entrepriseId);
                return ResponseEntity.ok(documents);
            }
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDocuments ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtenir les détails complets d'une demande d'investissement
     * GET /agrement-workflow/revision/investment-details/{entrepriseId}
     */
    @GetMapping("/revision/investment-details/{entrepriseId}")
    public ResponseEntity<?> getInvestmentDetails(@PathVariable String entrepriseId) {
        try {
            System.out.println("=== CONTROLLER: getInvestmentDetails appelé pour: " + entrepriseId + " ===");
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                // Extraire l'ID réel de la demande d'investissement
                String realInvestmentId = entrepriseId.substring(4);
                System.out.println("ID réel de la demande d'investissement: " + realInvestmentId);
                
                // Récupérer les détails complets via le service d'investissement
                List<InvestmentAgreement> allAgreements = investmentAgreementService.getAllInvestmentAgreements();
                InvestmentAgreement investmentAgreement = allAgreements.stream()
                    .filter(agreement -> agreement.getId().equals(realInvestmentId))
                    .findFirst()
                    .orElse(null);
                
                if (investmentAgreement == null) {
                    return ResponseEntity.notFound().build();
                }
                
                System.out.println("=== CONTROLLER: Détails trouvés pour l'investissement ===");
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("investmentAgreement", investmentAgreement);
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "ID d'entreprise invalide pour une demande d'investissement"));
            }
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getInvestmentDetails ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Valider la révision
     * POST /agrement-workflow/revision/valider
     */
    @PostMapping("/revision/valider")
    public ResponseEntity<?> validerRevision(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            System.out.println("=== VALIDER RÉVISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            System.out.println("Observations: " + observations);
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== VALIDATION RÉVISION DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId) && a.getEtape() == EtapeValidation.REVISION)
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Vérifier que c'est le bon agent
                if (!agentId.equals(assignment.getAgentId())) {
                    throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
                }
                
                // Valider et passer au régisseur
                assignment.setStatut("VALIDE");
                assignment.setEtape(EtapeValidation.REGISSEUR_AGREMENT);
                assignment.setDateTraitement(LocalDateTime.now());
                assignment.setObservations(assignment.getObservations() + " - Validé par l'analyste le " + LocalDateTime.now() + 
                                         (observations != null && !observations.isEmpty() ? " - " + observations : ""));
                
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Demande d'investissement validée et passée au régisseur: " + entrepriseId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement validée et passée au régisseur");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les autres types de demandes
                AgrementAssignment assignment = workflowService.validerRevision(entrepriseId, agentId, observations);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Révision validée");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Rejeter vers accueil
     * POST /agrement-workflow/revision/rejeter
     */
    @PostMapping("/revision/rejeter")
    public ResponseEntity<?> rejeterVersAccueil(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            
            System.out.println("=== REJETER RÉVISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            System.out.println("Motif: " + motifRejet);
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== REJET RÉVISION DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId) && a.getEtape() == EtapeValidation.REVISION)
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Vérifier que c'est le bon agent
                if (!agentId.equals(assignment.getAgentId())) {
                    throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
                }
                
                // Rejeter et retourner à l'accueil
                assignment.setStatut("REJETE");
                assignment.setEtape(EtapeValidation.ACCUEIL);
                assignment.setDateTraitement(LocalDateTime.now());
                assignment.setObservations(assignment.getObservations() + " - Rejeté par l'analyste le " + LocalDateTime.now() + 
                                         " - Motif: " + (motifRejet != null ? motifRejet : "Non spécifié"));
                
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Demande d'investissement rejetée vers l'accueil: " + entrepriseId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement rejetée vers l'accueil");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les autres types de demandes
                AgrementAssignment assignment = workflowService.rejeterVersAccueil(entrepriseId, agentId, motifRejet);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande rejetée vers l'accueil");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE REGISSEUR ====================

    /**
     * Lister les demandes du régisseur (incluant les demandes d'investissement)
     * GET /agrement-workflow/regisseur/demandes
     */
    @GetMapping("/regisseur/demandes")
    public ResponseEntity<?> getDemandesRegisseur() {
        try {
            System.out.println("=== CONTROLLER: getDemandesRegisseur appelé ===");
            
            // Récupérer les entreprises normales à l'étape REGISSEUR_AGREMENT
            List<Entreprise> entreprisesNormales = entrepriseRepository.findByEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("=== CONTROLLER: " + entreprisesNormales.size() + " entreprises normales chez le régisseur ===");
            
            // Récupérer aussi les entreprises en attente de paiement
            List<Entreprise> entreprisesPaiement = entrepriseRepository.findByEtapeValidation(EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("=== CONTROLLER: " + entreprisesPaiement.size() + " entreprises en attente de paiement ===");
            
            // Récupérer les assignations d'investissement à l'étape REGISSEUR_AGREMENT
            List<AgrementAssignment> assignationsInvestissement = assignmentRepository.findAll().stream()
                .filter(a -> a.getEtape() == EtapeValidation.REGISSEUR_AGREMENT && a.getEntrepriseId().startsWith("INV-"))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + assignationsInvestissement.size() + " demandes d'investissement chez le régisseur ===");
            
            // Créer des objets Entreprise fictifs pour les demandes d'investissement
            List<Entreprise> toutesLesEntreprises = new ArrayList<>(entreprisesNormales);
            toutesLesEntreprises.addAll(entreprisesPaiement);
            
            for (AgrementAssignment assignment : assignationsInvestissement) {
                // Extraire le nom depuis les observations
                String nomEntreprise = "Entreprise " + assignment.getEntrepriseId().substring(0, 8) + "...";
                if (assignment.getObservations() != null) {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Demande d'investissement assignée - (.+?) \\(ID:");
                    java.util.regex.Matcher matcher = pattern.matcher(assignment.getObservations());
                    if (matcher.find()) {
                        nomEntreprise = matcher.group(1);
                    }
                }
                
                // Créer une entreprise fictive pour l'affichage
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId(assignment.getEntrepriseId());
                entrepriseFictive.setNom(nomEntreprise);
                entrepriseFictive.setEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT); // Pour compatibilité frontend
                entrepriseFictive.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
                entrepriseFictive.setTypeDemandeAgrement(TypeDemandeAgrement.AGREMENT);
                
                toutesLesEntreprises.add(entrepriseFictive);
                System.out.println("=== AJOUT DEMANDE INVESTISSEMENT CHEZ RÉGISSEUR: " + nomEntreprise + " (" + assignment.getEntrepriseId() + ") ===");
            }
            
            System.out.println("=== CONTROLLER: Total " + toutesLesEntreprises.size() + " demandes chez le régisseur ===");
            return ResponseEntity.ok(toutesLesEntreprises);
            
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDemandesRegisseur ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la récupération des demandes du régisseur");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Passer au régisseur
     * POST /agrement-workflow/revision/passer-regisseur
     */
    @PostMapping("/revision/passer-regisseur")
    public ResponseEntity<?> passerAuRegisseur(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            AgrementAssignment assignment = workflowService.passerAuRegisseur(entrepriseId, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au régisseur");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE REGISSEUR ====================

    /**
     * Supprimer les paiements en attente et régénérer
     * POST /agrement-workflow/regisseur/regenerer-paiement
     */
    @PostMapping("/regisseur/regenerer-paiement")
    public ResponseEntity<?> regenererPaiement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== RÉGÉNÉRATION PAIEMENT (SUPPRESSION + CRÉATION) ===");
            System.out.println("Entreprise: " + entrepriseId);
            
            Map<String, Object> result = workflowService.regenererPaiementTransport(entrepriseId, agentId);
            
            System.out.println("✅ Paiement régénéré avec succès");
            
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            System.err.println("❌ Erreur état: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Erreur régénération paiement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la régénération du paiement: " + e.getMessage()));
        }
    }
    
    /**
     * Générer le paiement TresorPay
     * POST /agrement-workflow/regisseur/generer-paiement
     */
    @PostMapping("/regisseur/generer-paiement")
    public ResponseEntity<?> genererPaiement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== GÉNÉRATION PAIEMENT TRANSPORT ===");
            System.out.println("Entreprise: " + entrepriseId);
            
            Map<String, Object> result = workflowService.genererPaiementTransport(entrepriseId, agentId);
            
            System.out.println("✅ Paiement généré/mis à jour avec succès");
            
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            System.err.println("❌ Erreur état: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Erreur génération paiement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la génération du paiement: " + e.getMessage()));
        }
    }

    /**
     * Vérifier le paiement
     * POST /agrement-workflow/regisseur/verifier-paiement
     */
    @PostMapping("/regisseur/verifier-paiement")
    public ResponseEntity<?> verifierPaiement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            AgrementAssignment assignment = workflowService.verifierPaiement(entrepriseId, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Paiement vérifié et validé");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer au ministère
     * POST /agrement-workflow/regisseur/passer-ministere
     */
    @PostMapping("/regisseur/passer-ministere")
    public ResponseEntity<?> passerAuMinistere(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String ministereRole = request.get("ministereRole");
            
            AgrementAssignment assignment = workflowService.passerAuMinistere(entrepriseId, agentId, ministereRole);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au ministère");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE MINISTERE ====================

    /**
     * Obtenir la liste des ministères disponibles
     * GET /agrement-workflow/ministere/liste
     */
    @GetMapping("/ministere/liste")
    public ResponseEntity<List<String>> getMinisteresDisponibles() {
        try {
            List<String> ministeres = workflowService.getMinisteresDisponibles();
            return ResponseEntity.ok(ministeres);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Valider au niveau ministère
     * POST /agrement-workflow/ministere/valider
     */
    @PostMapping("/ministere/valider")
    public ResponseEntity<?> validerMinistere(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = workflowService.validerMinistere(entrepriseId, agentId, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Validation ministère effectuée");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer au retrait
     * POST /agrement-workflow/ministere/passer-retrait
     */
    @PostMapping("/ministere/passer-retrait")
    public ResponseEntity<?> passerAuRetrait(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            AgrementAssignment assignment = workflowService.passerAuRetrait(entrepriseId, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande prête pour le retrait");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Rejeter au niveau ministere - retour accueil sans paiement
     * POST /agrement-workflow/ministere/rejeter
     */
    @PostMapping("/ministere/rejeter")
    public ResponseEntity<?> rejeterMinistere(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            
            System.out.println("[Ministere] Rejet demande: " + entrepriseId + " - Motif: " + motifRejet);
            
            AgrementAssignment assignment = workflowService.rejeterMinistereVersAccueil(entrepriseId, agentId, motifRejet);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetee vers l'accueil (sans nouveau paiement)");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Upload de l'agrement signe et cachete
     * POST /agrement-workflow/ministere/upload-agrement
     */
    @PostMapping("/ministere/upload-agrement")
    public ResponseEntity<?> uploadAgrementSigne(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("entrepriseId") String entrepriseId,
            @RequestParam("agentId") String agentId) {
        try {
            System.out.println("[Ministere] Upload agrement signe pour: " + entrepriseId);
            
            Map<String, Object> result = workflowService.uploadAgrementSigne(entrepriseId, agentId, file);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE RETRAIT ====================

    /**
     * Obtenir le fichier d'agrément signé
     * GET /agrement-workflow/retrait/agrement-file/{entrepriseId}
     */
    @GetMapping("/retrait/agrement-file/{entrepriseId}")
    public ResponseEntity<?> getAgrementFile(@PathVariable String entrepriseId) {
        try {
            return workflowService.getAgrementFile(entrepriseId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Autoriser le téléchargement par l'utilisateur
     * POST /agrement-workflow/retrait/autoriser-telechargement
     */
    @PostMapping("/retrait/autoriser-telechargement")
    public ResponseEntity<?> autoriserTelechargement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            Map<String, Object> result = workflowService.autoriserTelechargement(entrepriseId, agentId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Marquer le téléchargement comme effectué (désactive l'autorisation)
     * POST /agrement-workflow/retrait/marquer-telecharge
     */
    @PostMapping("/retrait/marquer-telecharge")
    public ResponseEntity<?> marquerTelecharge(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            
            Map<String, Object> result = workflowService.marquerTelechargementEffectue(entrepriseId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== UTILITAIRES ====================

    /**
     * Obtenir l'assignation actuelle d'une entreprise
     * GET /agrement-workflow/assignation/{entrepriseId}
     */
    @GetMapping("/assignation/{entrepriseId}")
    public ResponseEntity<?> getAssignationActuelle(@PathVariable String entrepriseId) {
        try {
            AgrementAssignment assignment = workflowService.getAssignationActuelle(entrepriseId);
            if (assignment == null) {
                return ResponseEntity.ok(Map.of("message", "Aucune assignation trouvée"));
            }
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtenir l'historique des assignations
     * GET /agrement-workflow/historique/{entrepriseId}
     */
    @GetMapping("/historique/{entrepriseId}")
    public ResponseEntity<List<AgrementAssignment>> getHistorique(@PathVariable String entrepriseId) {
        try {
            List<AgrementAssignment> historique = workflowService.getHistoriqueAssignations(entrepriseId);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== UTILITAIRES CODE DES INVESTISSEMENTS ====================

    /**
     * Obtenir la liste des régimes d'investissement
     * GET /agrement-workflow/regimes
     */
    @GetMapping("/regimes")
    public ResponseEntity<List<Map<String, Object>>> getRegimes() {
        try {
            List<Map<String, Object>> regimes = new java.util.ArrayList<>();
            for (abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement regime : 
                 abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.values()) {
                Map<String, Object> regimeInfo = new HashMap<>();
                regimeInfo.put("code", regime.name());
                regimeInfo.put("libelle", regime.getLibelle());
                regimeInfo.put("montant", regime.getMontantDepot());
                regimeInfo.put("description", regime.getDescription());
                regimes.add(regimeInfo);
            }
            return ResponseEntity.ok(regimes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtenir la liste des types de demande d'agrément
     * GET /agrement-workflow/types-demande
     */
    @GetMapping("/types-demande")
    public ResponseEntity<List<Map<String, Object>>> getTypesDemande() {
        try {
            List<Map<String, Object>> types = new java.util.ArrayList<>();
            for (abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement type : 
                 abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement.values()) {
                Map<String, Object> typeInfo = new HashMap<>();
                typeInfo.put("code", type.name());
                typeInfo.put("libelle", type.getLibelle());
                typeInfo.put("requiresRegime", type.requiresRegime());
                typeInfo.put("montantFixe", type.getMontantFixe());
                typeInfo.put("description", type.getDescription());
                types.add(typeInfo);
            }
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtenir la liste des ministères disponibles
     * GET /agrement-workflow/ministeres
     */
    @GetMapping("/ministeres")
    public ResponseEntity<List<Map<String, Object>>> getMinisteres() {
        try {
            List<Map<String, Object>> ministeres = new java.util.ArrayList<>();
            
            Map<String, Object> commerce = new HashMap<>();
            commerce.put("code", "MINISTERE_COMMERCE");
            commerce.put("nom", "Ministère du Commerce");
            commerce.put("description", "Commerce et développement des entreprises");
            ministeres.add(commerce);
            
            Map<String, Object> industrie = new HashMap<>();
            industrie.put("code", "MINISTERE_INDUSTRIE");
            industrie.put("nom", "Ministère de l'Industrie");
            industrie.put("description", "Industrie et transformation");
            ministeres.add(industrie);
            
            Map<String, Object> tourisme = new HashMap<>();
            tourisme.put("code", "MINISTERE_TOURISME");
            tourisme.put("nom", "Ministère du Tourisme");
            tourisme.put("description", "Tourisme et hôtellerie");
            ministeres.add(tourisme);
            
            Map<String, Object> urbanisme = new HashMap<>();
            urbanisme.put("code", "MINISTERE_URBANISME");
            urbanisme.put("nom", "Ministère de l'Urbanisme");
            urbanisme.put("description", "BTP et établissements classés");
            ministeres.add(urbanisme);
            
            Map<String, Object> transports = new HashMap<>();
            transports.put("code", "MINISTERE_TRANSPORTS");
            transports.put("nom", "Ministère des Transports");
            transports.put("description", "Transport de marchandises et de personnes");
            ministeres.add(transports);
            
            return ResponseEntity.ok(ministeres);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== TÉLÉCHARGEMENT DE FICHIERS ====================

    /**
     * Télécharger un fichier d'agrément
     * GET /agrement-workflow/file/{entrepriseId}?filename=xxx
     */
    @GetMapping("/file/{entrepriseId}")
    public ResponseEntity<byte[]> getAgrementFile(
            @PathVariable String entrepriseId,
            @RequestParam String filename) {
        
        try {
            System.out.println("=== TÉLÉCHARGEMENT FICHIER ===");
            System.out.println("Entreprise/Demande: " + entrepriseId);
            System.out.println("Nom du fichier: " + filename);
            
            // Vérifier si c'est une demande indépendante (commence par AGR-)
            if (entrepriseId != null && entrepriseId.startsWith("AGR-")) {
                System.out.println("=== DEMANDE INDÉPENDANTE DÉTECTÉE ===");
                
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> entrepriseId.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElse(null);
                
                if (demande == null) {
                    System.out.println("❌ Demande indépendante non trouvée: " + entrepriseId);
                    return ResponseEntity.notFound().build();
                }
                
                System.out.println("✅ Demande trouvée: " + demande.getNomEntreprise());
                System.out.println("Documents fournis: " + demande.getDocumentsFournis());
                
                // Vérifier si le fichier existe dans les documents fournis
                String documentsJson = demande.getDocumentsFournis();
                if (documentsJson != null && documentsJson.contains(filename)) {
                    System.out.println("✅ Fichier trouvé dans les documents: " + filename);
                    
                    // Pour l'instant, générer un placeholder SVG informatif
                    // En production, les fichiers seraient stockés dans un système de stockage séparé
                    String svgContent = createDocumentPlaceholder(filename, entrepriseId, demande.getNomEntreprise());
                    byte[] data = svgContent.getBytes("UTF-8");
                    
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType("image/svg+xml"));
                    headers.setCacheControl("no-cache");
                    headers.add("Content-Disposition", "inline");
                    headers.add("X-Content-Type-Options", "nosniff");
                    
                    System.out.println("✅ Placeholder SVG envoyé: " + data.length + " bytes");
                    
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(data);
                } else {
                    System.out.println("❌ Fichier non trouvé dans les documents: " + filename);
                    return ResponseEntity.notFound().build();
                }
            } else {
                // Logique existante pour les entreprises normales
                System.out.println("=== ENTREPRISE NORMALE ===");
                Path filePath = Paths.get("uploads/agrement/" + entrepriseId + "/" + filename);
                
                System.out.println("[AgrementWorkflowController] Téléchargement fichier: " + filePath.toAbsolutePath());
                
                if (!Files.exists(filePath)) {
                    System.err.println("[AgrementWorkflowController] Fichier non trouvé: " + filePath.toAbsolutePath());
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
                
                System.out.println("[AgrementWorkflowController] Fichier envoyé: " + data.length + " bytes, type: " + contentType);
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(data);
            }
                    
        } catch (IOException e) {
            System.err.println("[AgrementWorkflowController] Erreur lecture fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("Erreur générale téléchargement fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.repository.AgrementAssignmentRepository;
import abdaty_technologie.API_Invest.repository.DemandeAutorisationExerciceRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.AgrementWorkflowService;
import abdaty_technologie.API_Invest.service.InvestmentAgreementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agrement-workflow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgrementWorkflowController {

    private final AgrementWorkflowService workflowService;
    private final AgrementAssignmentRepository assignmentRepository;
    private final DemandeAutorisationExerciceRepository demandeRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final InvestmentAgreementService investmentAgreementService;

    // ==================== ÉTAPE ACCUEIL ====================

    /**
     * Test simple pour vérifier que le contrôleur fonctionne
     * GET /agrement-workflow/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "AgrementWorkflowController fonctionne");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Test pour vérifier toutes les assignations en base
     * GET /agrement-workflow/debug/all-assignations
     */
    @GetMapping("/debug/all-assignations")
    public ResponseEntity<?> getAllAssignationsDebug() {
        try {
            System.out.println("=== DEBUG: Récupération de toutes les assignations ===");
            
            List<AgrementAssignment> allAssignations = assignmentRepository.findAll();
            System.out.println("Total assignations en base: " + allAssignations.size());
            
            for (AgrementAssignment assignation : allAssignations) {
                System.out.println("- ID: " + assignation.getId() + 
                                 ", Agent: " + assignation.getAgentId() + 
                                 ", Entreprise: " + assignation.getEntrepriseId() + 
                                 ", Statut: " + assignation.getStatut() +
                                 ", Etape: " + assignation.getEtape());
            }
            
            return ResponseEntity.ok(allAssignations);
            
        } catch (Exception e) {
            System.err.println("Erreur debug assignations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Récupérer les assignations d'un agent
     * GET /agrement-workflow/accueil/mes-assignations/{agentId}
     */
    @GetMapping("/accueil/mes-assignations/{agentId}")
    public ResponseEntity<?> getMesAssignations(@PathVariable String agentId) {
        try {
            System.out.println("=== CONTROLLER: getMesAssignations appelé pour agent: " + agentId + " ===");
            
            // Récupérer les assignations normales (AgrementAssignment)
            List<AgrementAssignment> assignationsNormales = workflowService.getMesAssignations(agentId);
            System.out.println("=== CONTROLLER: " + assignationsNormales.size() + " assignations normales trouvées ===");
            
            // Récupérer les demandes indépendantes assignées à cet agent
            List<DemandeAutorisationExercice> demandesIndependantesAssignees = demandeRepository.findAll().stream()
                .filter(demande -> agentId.equals(demande.getAgentAssigneId()))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + demandesIndependantesAssignees.size() + " demandes indépendantes assignées ===");
            
            // Créer des objets AgrementAssignment fictifs pour les demandes indépendantes
            List<AgrementAssignment> assignationsIndependantes = new ArrayList<>();
            for (DemandeAutorisationExercice demande : demandesIndependantesAssignees) {
                AgrementAssignment assignmentFictif = new AgrementAssignment();
                // Utiliser le nom de l'entreprise comme ID pour l'affichage
                assignmentFictif.setEntrepriseId(demande.getNomEntreprise() + " (" + demande.getNumeroDemande() + ")");
                assignmentFictif.setAgentId(agentId);
                assignmentFictif.setEtape(demande.getEtapeActuelle());
                assignmentFictif.setStatut(demande.getStatut());
                assignmentFictif.setDateAssignment(demande.getDateDerniereModification());
                assignmentFictif.setObservations("Demande indépendante - " + demande.getNomEntreprise() + 
                                               " (Demandeur: " + demande.getPrenomDemandeur() + " " + demande.getNomDemandeur() + ")");
                assignationsIndependantes.add(assignmentFictif);
            }
            
            // Combiner toutes les assignations
            List<AgrementAssignment> toutesLesAssignations = new ArrayList<>(assignationsNormales);
            toutesLesAssignations.addAll(assignationsIndependantes);
            
            System.out.println("=== CONTROLLER: Total " + toutesLesAssignations.size() + " assignations (incluant " + assignationsIndependantes.size() + " indépendantes) ===");
            return ResponseEntity.ok(toutesLesAssignations);
            
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getMesAssignations ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la récupération des assignations");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Lister les demandes non assignées
     * GET /agrement-workflow/accueil/demandes-non-assignees
     */
    @GetMapping("/accueil/demandes-non-assignees")
    public ResponseEntity<?> getDemandesNonAssignees() {
        try {
            System.out.println("=== CONTROLLER: getDemandesNonAssignees appelé ===");
            
            // Récupérer les demandes liées aux entreprises existantes (système actuel)
            List<Entreprise> demandesEntreprises = workflowService.getDemandesNonAssignees();
            System.out.println("=== CONTROLLER: " + demandesEntreprises.size() + " demandes d'entreprises ===");
            
            // Récupérer les nouvelles demandes indépendantes depuis demande_autorisation_exercice
            List<DemandeAutorisationExercice> toutesLesDemandesIndependantes = demandeRepository.findAll();
            System.out.println("=== CONTROLLER: Total " + toutesLesDemandesIndependantes.size() + " demandes indépendantes en base ===");
            
            // Récupérer les demandes d'investissement
            List<InvestmentAgreement> demandesInvestissement = investmentAgreementService.getAllInvestmentAgreements();
            System.out.println("=== CONTROLLER: Total " + demandesInvestissement.size() + " demandes d'investissement en base ===");
            
            for (DemandeAutorisationExercice demande : toutesLesDemandesIndependantes) {
                System.out.println("Demande ID: " + demande.getId());
                System.out.println("- NumeroDemande: " + demande.getNumeroDemande());
                System.out.println("- NomDemandeur: " + demande.getNomDemandeur());
                System.out.println("- NomEntreprise: " + demande.getNomEntreprise());
                System.out.println("- EtapeActuelle: " + demande.getEtapeActuelle());
                System.out.println("- Statut: " + demande.getStatut());
                System.out.println("- AgentAssigneId: " + demande.getAgentAssigneId());
                System.out.println("---");
            }
            
            List<DemandeAutorisationExercice> demandesNonAssignees = toutesLesDemandesIndependantes.stream()
                .filter(demande -> {
                    boolean agentNull = demande.getAgentAssigneId() == null;
                    boolean etapeAccueil = demande.getEtapeActuelle() == EtapeValidation.ACCUEIL;
                    boolean statutEnCours = "EN_COURS".equals(demande.getStatut());
                    boolean nonAssignee = agentNull && etapeAccueil && statutEnCours;
                    System.out.println("Filtrage " + demande.getId() + ": agentNull=" + agentNull + ", etapeAccueil=" + etapeAccueil + ", statutEnCours=" + statutEnCours + ", nonAssignee=" + nonAssignee);
                    return nonAssignee;
                })
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + demandesNonAssignees.size() + " demandes non assignées après filtrage ===");
            
            // Créer des objets Entreprise fictifs pour les demandes indépendantes afin de maintenir la compatibilité
            List<Entreprise> toutesLesDemandes = new ArrayList<>(demandesEntreprises);
            
            for (DemandeAutorisationExercice demande : demandesNonAssignees) {
                // Créer une entreprise fictive pour chaque demande indépendante
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId(demande.getNumeroDemande()); // Utiliser le numéro de demande comme ID
                entrepriseFictive.setNom(demande.getNomEntreprise()); // Utiliser le nom de l'entreprise
                
                toutesLesDemandes.add(entrepriseFictive);
            }
            
            // Récupérer toutes les assignations existantes pour filtrer les demandes d'investissement
            List<AgrementAssignment> toutesLesAssignations = assignmentRepository.findAll();
            List<String> entreprisesAssignees = toutesLesAssignations.stream()
                .map(AgrementAssignment::getEntrepriseId)
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + entreprisesAssignees.size() + " entreprises déjà assignées ===");
            
            // Ajouter les demandes d'investissement NON ASSIGNÉES seulement
            for (InvestmentAgreement investmentAgreement : demandesInvestissement) {
                String entrepriseIdAvecPrefixe = "INV-" + investmentAgreement.getId();
                
                // Vérifier si cette demande d'investissement est déjà assignée
                boolean dejaAssignee = entreprisesAssignees.contains(entrepriseIdAvecPrefixe);
                System.out.println("=== VERIFICATION ASSIGNATION: " + entrepriseIdAvecPrefixe + " - Déjà assignée: " + dejaAssignee + " ===");
                
                if (!dejaAssignee) {
                    // Créer une entreprise fictive pour chaque demande d'investissement NON ASSIGNÉE
                    Entreprise entrepriseFictive = new Entreprise();
                    entrepriseFictive.setId(entrepriseIdAvecPrefixe); // Préfixe pour distinguer
                    entrepriseFictive.setNom(investmentAgreement.getIdentification().getNomRaisonSociale());
                    entrepriseFictive.setReference(investmentAgreement.getReferenceNumber());
                    entrepriseFictive.setTypeDemandeAgrement(TypeDemandeAgrement.AGREMENT); // Marquer comme demande d'investissement
                    entrepriseFictive.setStatutCreation(investmentAgreement.getStatut());
                    
                    toutesLesDemandes.add(entrepriseFictive);
                    System.out.println("=== AJOUT DEMANDE INVESTISSEMENT NON ASSIGNÉE: " + investmentAgreement.getReferenceNumber() + " - " + investmentAgreement.getIdentification().getNomRaisonSociale() + " ===");
                } else {
                    System.out.println("=== DEMANDE INVESTISSEMENT DÉJÀ ASSIGNÉE - IGNORÉE: " + investmentAgreement.getReferenceNumber() + " ===");
                }
            }
            
            System.out.println("=== CONTROLLER: Total " + toutesLesDemandes.size() + " demandes (incluant " + demandesNonAssignees.size() + " indépendantes) ===");
            
            // Retourner le format original attendu par le frontend
            return ResponseEntity.ok(toutesLesDemandes);
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDemandesNonAssignees ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            // Retourner une réponse d'erreur détaillée
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur serveur");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Assigner une demande à un agent
     * POST /agrement-workflow/accueil/assigner
     */
    @PostMapping("/accueil/assigner")
    public ResponseEntity<?> assignerDemande(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== ASSIGNATION DEMANDE ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            
            // Vérifier le type de demande
            if (entrepriseId != null && entrepriseId.startsWith("AGR-")) {
                System.out.println("=== ASSIGNATION DEMANDE INDÉPENDANTE ===");
                
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> entrepriseId.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Demande indépendante non trouvée: " + entrepriseId));
                
                // Assigner l'agent à la demande
                demande.setAgentAssigneId(agentId);
                demande.setResponsableEtapeActuelle(agentId);
                demande.setDateDerniereModification(java.time.LocalDateTime.now());
                
                // Sauvegarder la demande mise à jour
                demande = demandeRepository.save(demande);
                
                System.out.println("✅ Demande indépendante assignée à l'agent: " + agentId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande indépendante assignée avec succès");
                response.put("demande", demande);
                response.put("numeroDemande", demande.getNumeroDemande());
                
                return ResponseEntity.ok(response);
            } else if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== ASSIGNATION DEMANDE D'INVESTISSEMENT ===");
                
                // Vérifier s'il existe déjà une assignation pour cette demande
                Optional<AgrementAssignment> assignationExistante = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId))
                    .findFirst();
                
                if (assignationExistante.isPresent()) {
                    System.out.println("⚠️ Assignation existante trouvée, suppression...");
                    assignmentRepository.delete(assignationExistante.get());
                }
                
                // Extraire l'ID réel de la demande d'investissement (enlever le préfixe INV-)
                String realInvestmentId = entrepriseId.substring(4);
                System.out.println("ID réel de la demande d'investissement: " + realInvestmentId);
                
                // Récupérer les détails de la demande d'investissement pour obtenir le vrai nom
                List<InvestmentAgreement> demandesInvestissement = investmentAgreementService.getAllInvestmentAgreements();
                InvestmentAgreement investmentAgreement = demandesInvestissement.stream()
                    .filter(inv -> inv.getId().equals(realInvestmentId))
                    .findFirst()
                    .orElse(null);
                
                String nomEntreprise = "Entreprise inconnue";
                if (investmentAgreement != null) {
                    nomEntreprise = investmentAgreement.getIdentification().getNomRaisonSociale();
                    System.out.println("Nom de l'entreprise trouvé: " + nomEntreprise);
                }
                
                // Créer un enregistrement d'assignation dans la base de données
                AgrementAssignment assignment = new AgrementAssignment();
                assignment.setEntrepriseId(entrepriseId); // Garder le préfixe INV- pour l'identifier
                assignment.setAgentId(agentId);
                assignment.setAgentNom("Agent"); // Nom par défaut, peut être amélioré plus tard
                assignment.setEtape(EtapeValidation.ACCUEIL);
                assignment.setDateAssignment(LocalDateTime.now());
                assignment.setStatut("EN_COURS");
                assignment.setDocumentsVerifies(false);
                assignment.setObservations("Demande d'investissement assignée - " + nomEntreprise + " (ID: " + realInvestmentId + ")");
                
                // Sauvegarder l'assignation
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Assignation d'investissement persistée avec ID: " + assignment.getId());
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement assignée avec succès");
                response.put("assignment", assignment);
                response.put("entrepriseId", entrepriseId);
                response.put("agentId", agentId);
                response.put("investmentId", realInvestmentId);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les entreprises normales
                AgrementAssignment assignment = workflowService.assignerDemandeAccueil(entrepriseId, agentId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande assignée avec succès");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'assignation: " + e.getMessage()));
        }
    }


    /**
     * Vérifier les documents
     * POST /agrement-workflow/accueil/verifier-documents
     */
    @PostMapping("/accueil/verifier-documents")
    public ResponseEntity<?> verifierDocuments(@RequestBody Map<String, Object> request) {
        try {
            String entrepriseId = (String) request.get("entrepriseId");
            String agentId = (String) request.get("agentId");
            Boolean documentsOk = (Boolean) request.get("documentsOk");
            String observations = (String) request.get("observations");
            
            System.out.println("=== VÉRIFICATION DOCUMENTS ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            System.out.println("Documents OK: " + documentsOk);
            
            // Vérifier si c'est une demande indépendante (commence par AGR-)
            if (entrepriseId != null && entrepriseId.startsWith("AGR-")) {
                System.out.println("=== VÉRIFICATION DOCUMENTS DEMANDE INDÉPENDANTE ===");
                
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> entrepriseId.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Demande indépendante non trouvée: " + entrepriseId));
                
                // Mettre à jour le statut de vérification des documents
                if (documentsOk != null && documentsOk) {
                    // Documents vérifiés et conformes
                    demande.setObservations("Documents vérifiés et conformes - " + 
                                          (observations != null ? observations : "Aucune observation"));
                    System.out.println("✅ Documents validés pour la demande: " + entrepriseId);
                } else {
                    // Documents non conformes
                    demande.setObservations("Documents non conformes - " + 
                                          (observations != null ? observations : "Documents à corriger"));
                    System.out.println("❌ Documents non conformes pour la demande: " + entrepriseId);
                }
                
                demande.setDateDerniereModification(java.time.LocalDateTime.now());
                
                // Sauvegarder la demande mise à jour
                demande = demandeRepository.save(demande);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Documents vérifiés pour la demande indépendante");
                response.put("demande", demande);
                response.put("documentsOk", documentsOk);
                
                return ResponseEntity.ok(response);
            } else if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== VÉRIFICATION DOCUMENTS DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId))
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Mettre à jour le statut de vérification des documents
                if (documentsOk != null && documentsOk) {
                    assignment.setDocumentsVerifies(true);
                    assignment.setObservations(assignment.getObservations() + " - Documents vérifiés et conformes - " + 
                                             (observations != null ? observations : "Aucune observation"));
                    System.out.println("✅ Documents validés pour la demande d'investissement: " + entrepriseId);
                } else {
                    assignment.setDocumentsVerifies(false);
                    assignment.setObservations(assignment.getObservations() + " - Documents non conformes - " + 
                                             (observations != null ? observations : "Documents à corriger"));
                    System.out.println("❌ Documents non conformes pour la demande d'investissement: " + entrepriseId);
                }
                
                assignment.setDateTraitement(LocalDateTime.now());
                
                // Sauvegarder l'assignation mise à jour
                assignment = assignmentRepository.save(assignment);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Documents vérifiés pour la demande d'investissement");
                response.put("assignment", assignment);
                response.put("documentsOk", documentsOk);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les entreprises normales
                AgrementAssignment assignment = workflowService.verifierDocumentsAccueil(
                    entrepriseId, agentId, documentsOk, observations);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Documents vérifiés");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Récupérer les documents d'une demande indépendante
     * GET /agrement-workflow/accueil/documents/{numeroDemande}
     */
    @GetMapping("/accueil/documents/{numeroDemande}")
    public ResponseEntity<?> getDocumentsDemandeIndependante(@PathVariable String numeroDemande) {
        try {
            System.out.println("=== RÉCUPÉRATION DOCUMENTS DEMANDE INDÉPENDANTE ===");
            System.out.println("Numéro de demande: " + numeroDemande);
            
            // Vérifier si c'est une demande indépendante (commence par AGR-)
            if (numeroDemande != null && numeroDemande.startsWith("AGR-")) {
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> numeroDemande.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElse(null);
                
                if (demande == null) {
                    System.out.println("❌ Demande indépendante non trouvée: " + numeroDemande);
                    return ResponseEntity.ok(new ArrayList<>());
                }
                
                System.out.println("✅ Demande trouvée: " + demande.getNomEntreprise());
                System.out.println("Documents fournis: " + demande.getDocumentsFournis());
                
                // Parser les documents JSON
                List<Map<String, Object>> documents = new ArrayList<>();
                if (demande.getDocumentsFournis() != null && !demande.getDocumentsFournis().trim().isEmpty()) {
                    try {
                        String documentsJson = demande.getDocumentsFournis();
                        System.out.println("JSON brut: " + documentsJson);
                        
                        // Parser JSON simple - extraire les paires clé-valeur
                        // Format attendu: {"key1":"value1","key2":"value2",...}
                        if (documentsJson.startsWith("{") && documentsJson.endsWith("}")) {
                            String content = documentsJson.substring(1, documentsJson.length() - 1);
                            String[] pairs = content.split(",");
                            
                            int docId = 1;
                            for (String pair : pairs) {
                                String[] keyValue = pair.split(":");
                                if (keyValue.length == 2) {
                                    String key = keyValue[0].trim().replaceAll("\"", "");
                                    String fileName = keyValue[1].trim().replaceAll("\"", "");
                                    
                                    Map<String, Object> doc = new HashMap<>();
                                    doc.put("id", String.valueOf(docId++));
                                    doc.put("type", key.toUpperCase());
                                    doc.put("nom", getDocumentDisplayName(key));
                                    doc.put("fileName", fileName);
                                    documents.add(doc);
                                    
                                    System.out.println("Document ajouté: " + key + " -> " + fileName);
                                }
                            }
                        }
                        
                    } catch (Exception e) {
                        System.err.println("Erreur parsing JSON documents: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                System.out.println("=== DOCUMENTS TROUVÉS: " + documents.size() + " ===");
                return ResponseEntity.ok(documents);
            } else {
                // Pour les entreprises normales, retourner une liste vide
                return ResponseEntity.ok(new ArrayList<>());
            }
            
        } catch (Exception e) {
            System.err.println("Erreur récupération documents: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Créer une image SVG de placeholder pour visualiser un document
     */
    private String createDocumentPlaceholder(String filename, String demandeId, String nomEntreprise) {
        // Déterminer le type de fichier par l'extension
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        String iconColor = "#3B82F6"; // Bleu par défaut
        String iconPath = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"; // Icône document par défaut
        
        // Personnaliser selon le type de fichier
        switch (extension) {
            case "pdf":
                iconColor = "#DC2626"; // Rouge pour PDF
                iconPath = "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
                break;
            case "png":
            case "jpg":
            case "jpeg":
                iconColor = "#059669"; // Vert pour images
                iconPath = "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
                break;
        }
        
        return String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<svg width=\"400\" height=\"300\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">" +
            "<defs>" +
            "<style type=\"text/css\">" +
            ".document-bg { fill: #F8FAFC; stroke: #E2E8F0; stroke-width: 2; }" +
            ".document-icon { fill: none; stroke: %s; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }" +
            ".title-text { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #1F2937; text-anchor: middle; }" +
            ".subtitle-text { font-family: Arial, sans-serif; font-size: 14px; fill: #6B7280; text-anchor: middle; }" +
            ".info-text { font-family: Arial, sans-serif; font-size: 12px; fill: #9CA3AF; text-anchor: middle; }" +
            ".hint-text { font-family: Arial, sans-serif; font-size: 10px; fill: #D1D5DB; text-anchor: middle; }" +
            "</style>" +
            "</defs>" +
            "<rect width=\"100%%\" height=\"100%%\" class=\"document-bg\" rx=\"8\"/>" +
            "<g transform=\"translate(168,60)\">" +
            "<svg width=\"64\" height=\"64\" viewBox=\"0 0 24 24\" class=\"document-icon\">" +
            "<path d=\"%s\"/>" +
            "</svg>" +
            "</g>" +
            "<text x=\"200\" y=\"160\" class=\"title-text\">%s</text>" +
            "<text x=\"200\" y=\"185\" class=\"subtitle-text\">%s</text>" +
            "<text x=\"200\" y=\"210\" class=\"info-text\">Demande: %s</text>" +
            "<text x=\"200\" y=\"240\" class=\"hint-text\">Document disponible</text>" +
            "<circle cx=\"350\" cy=\"50\" r=\"8\" fill=\"%s\" opacity=\"0.8\"/>" +
            "</svg>",
            iconColor, iconPath, filename, nomEntreprise, demandeId, iconColor
        );
    }

    /**
     * Déterminer le type de contenu à partir du nom de fichier
     */
    private String getContentTypeFromFilename(String filename) {
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return switch (extension) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "bmp" -> "image/bmp";
            case "webp" -> "image/webp";
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "txt" -> "text/plain";
            default -> "application/octet-stream";
        };
    }

    /**
     * Convertir les clés de documents JSON en noms d'affichage lisibles
     */
    private String getDocumentDisplayName(String key) {
        switch (key.toLowerCase()) {
            case "diplomearchitecte": return "Diplôme d'Architecte";
            case "casierjudiciaire": return "Casier Judiciaire";
            case "certificatnationalite": return "Certificat de Nationalité";
            case "curriculumvitae": return "Curriculum Vitae";
            case "attestationordrephysique": return "Attestation Ordre Physique";
            case "demandetimbre": return "Demande Timbre";
            case "actenaissance": return "Acte de Naissance";
            case "certificatresidence": return "Certificat de Résidence";
            case "attestationassurance": return "Attestation d'Assurance";
            case "diplomeingenieur": return "Diplôme d'Ingénieur";
            case "licenceprofessionnelle": return "Licence Professionnelle";
            default: 
                // Convertir camelCase en titre lisible
                String result = key.replaceAll("([a-z])([A-Z])", "$1 $2");
                return result.substring(0, 1).toUpperCase() + result.substring(1);
        }
    }


    /**
     * Rejeter une demande depuis l'accueil
     * POST /agrement-workflow/accueil/rejeter
     */
    @PostMapping("/accueil/rejeter")
    public ResponseEntity<?> rejeterDemandeAccueil(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            
            System.out.println("=== REJET DEMANDE ACCUEIL ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Motif: " + motifRejet);
            
            // Pour l'instant, on marque juste la demande comme rejetée
            // Vous pouvez implémenter une logique spécifique selon vos besoins
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetée avec succès");
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du rejet: " + e.getMessage()));
        }
    }

    /**
     * Passer en révision
     * POST /agrement-workflow/accueil/passer-revision
     */
    @PostMapping("/accueil/passer-revision")
    public ResponseEntity<?> passerEnRevision(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== PASSER EN RÉVISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== PASSER EN RÉVISION DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId) && a.getEtape() == EtapeValidation.ACCUEIL)
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Vérifier que c'est le bon agent
                if (!agentId.equals(assignment.getAgentId())) {
                    throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
                }
                
                // Vérifier que les documents ont été vérifiés
                if (!Boolean.TRUE.equals(assignment.getDocumentsVerifies())) {
                    throw new IllegalStateException("Les documents doivent être vérifiés avant de passer en révision");
                }
                
                // Marquer l'assignation actuelle comme validée et passer à l'étape révision
                assignment.setStatut("VALIDE");
                assignment.setEtape(EtapeValidation.REVISION);
                assignment.setDateTraitement(LocalDateTime.now());
                assignment.setObservations(assignment.getObservations() + " - Passé en révision le " + LocalDateTime.now());
                
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Demande d'investissement passée en révision: " + entrepriseId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement passée en révision avec succès");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les autres types de demandes
                AgrementAssignment assignment = workflowService.passerEnRevision(entrepriseId, agentId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande passée en révision avec succès");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE REVISION ====================

    /**
     * Lister les demandes en révision (incluant les demandes d'investissement)
     * GET /agrement-workflow/revision/demandes
     */
    @GetMapping("/revision/demandes")
    public ResponseEntity<?> getDemandesRevision() {
        try {
            System.out.println("=== CONTROLLER: getDemandesRevision appelé ===");
            
            // Récupérer les entreprises normales à l'étape REVISION_AGREMENT
            List<Entreprise> entreprisesNormales = entrepriseRepository.findByEtapeValidation(EtapeValidation.REVISION_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("=== CONTROLLER: " + entreprisesNormales.size() + " entreprises normales en révision ===");
            
            // Récupérer les assignations d'investissement à l'étape REVISION
            List<AgrementAssignment> assignationsInvestissement = assignmentRepository.findAll().stream()
                .filter(a -> a.getEtape() == EtapeValidation.REVISION && a.getEntrepriseId().startsWith("INV-"))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + assignationsInvestissement.size() + " demandes d'investissement en révision ===");
            
            // Créer des objets Entreprise fictifs pour les demandes d'investissement
            List<Entreprise> toutesLesEntreprises = new ArrayList<>(entreprisesNormales);
            
            for (AgrementAssignment assignment : assignationsInvestissement) {
                // Extraire le nom depuis les observations
                String nomEntreprise = "Entreprise " + assignment.getEntrepriseId().substring(0, 8) + "...";
                if (assignment.getObservations() != null) {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Demande d'investissement assignée - (.+?) \\(ID:");
                    java.util.regex.Matcher matcher = pattern.matcher(assignment.getObservations());
                    if (matcher.find()) {
                        nomEntreprise = matcher.group(1);
                    }
                }
                
                // Créer une entreprise fictive pour l'affichage
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId(assignment.getEntrepriseId());
                entrepriseFictive.setNom(nomEntreprise);
                entrepriseFictive.setEtapeValidation(EtapeValidation.REVISION_AGREMENT); // Pour compatibilité frontend
                entrepriseFictive.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
                entrepriseFictive.setTypeDemandeAgrement(TypeDemandeAgrement.AGREMENT);
                
                toutesLesEntreprises.add(entrepriseFictive);
                System.out.println("=== AJOUT DEMANDE INVESTISSEMENT EN RÉVISION: " + nomEntreprise + " (" + assignment.getEntrepriseId() + ") ===");
            }
            
            System.out.println("=== CONTROLLER: Total " + toutesLesEntreprises.size() + " demandes en révision ===");
            return ResponseEntity.ok(toutesLesEntreprises);
            
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDemandesRevision ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la récupération des demandes en révision");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Obtenir les documents d'une entreprise (incluant les demandes d'investissement)
     * GET /agrement-workflow/revision/documents/{entrepriseId}
     */
    @GetMapping("/revision/documents/{entrepriseId}")
    public ResponseEntity<?> getDocuments(@PathVariable String entrepriseId) {
        try {
            System.out.println("=== CONTROLLER: getDocuments appelé pour: " + entrepriseId + " ===");
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== RÉCUPÉRATION DOCUMENTS DEMANDE D'INVESTISSEMENT ===");
                
                // Extraire l'ID réel de la demande d'investissement
                String realInvestmentId = entrepriseId.substring(4);
                System.out.println("ID réel de la demande d'investissement: " + realInvestmentId);
                
                // Récupérer les documents via le service d'investissement
                List<abdaty_technologie.API_Invest.dto.InvestmentAgreementDocumentDto> documentsInvestissement = 
                    investmentAgreementService.getDocumentsByAgreementId(realInvestmentId);
                
                System.out.println("=== CONTROLLER: " + documentsInvestissement.size() + " documents trouvés pour l'investissement ===");
                
                Map<String, Object> response = new HashMap<>();
                response.put("documents", documentsInvestissement);
                response.put("count", documentsInvestissement.size());
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les entreprises normales
                Map<String, Object> documents = workflowService.getDocumentsEntreprise(entrepriseId);
                return ResponseEntity.ok(documents);
            }
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDocuments ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtenir les détails complets d'une demande d'investissement
     * GET /agrement-workflow/revision/investment-details/{entrepriseId}
     */
    @GetMapping("/revision/investment-details/{entrepriseId}")
    public ResponseEntity<?> getInvestmentDetails(@PathVariable String entrepriseId) {
        try {
            System.out.println("=== CONTROLLER: getInvestmentDetails appelé pour: " + entrepriseId + " ===");
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                // Extraire l'ID réel de la demande d'investissement
                String realInvestmentId = entrepriseId.substring(4);
                System.out.println("ID réel de la demande d'investissement: " + realInvestmentId);
                
                // Récupérer les détails complets via le service d'investissement
                List<InvestmentAgreement> allAgreements = investmentAgreementService.getAllInvestmentAgreements();
                InvestmentAgreement investmentAgreement = allAgreements.stream()
                    .filter(agreement -> agreement.getId().equals(realInvestmentId))
                    .findFirst()
                    .orElse(null);
                
                if (investmentAgreement == null) {
                    return ResponseEntity.notFound().build();
                }
                
                System.out.println("=== CONTROLLER: Détails trouvés pour l'investissement ===");
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("investmentAgreement", investmentAgreement);
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "ID d'entreprise invalide pour une demande d'investissement"));
            }
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getInvestmentDetails ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Valider la révision
     * POST /agrement-workflow/revision/valider
     */
    @PostMapping("/revision/valider")
    public ResponseEntity<?> validerRevision(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            System.out.println("=== VALIDER RÉVISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            System.out.println("Observations: " + observations);
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== VALIDATION RÉVISION DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId) && a.getEtape() == EtapeValidation.REVISION)
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Vérifier que c'est le bon agent
                if (!agentId.equals(assignment.getAgentId())) {
                    throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
                }
                
                // Valider et passer au régisseur
                assignment.setStatut("VALIDE");
                assignment.setEtape(EtapeValidation.REGISSEUR_AGREMENT);
                assignment.setDateTraitement(LocalDateTime.now());
                assignment.setObservations(assignment.getObservations() + " - Validé par l'analyste le " + LocalDateTime.now() + 
                                         (observations != null && !observations.isEmpty() ? " - " + observations : ""));
                
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Demande d'investissement validée et passée au régisseur: " + entrepriseId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement validée et passée au régisseur");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les autres types de demandes
                AgrementAssignment assignment = workflowService.validerRevision(entrepriseId, agentId, observations);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Révision validée");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Rejeter vers accueil
     * POST /agrement-workflow/revision/rejeter
     */
    @PostMapping("/revision/rejeter")
    public ResponseEntity<?> rejeterVersAccueil(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            
            System.out.println("=== REJETER RÉVISION ===");
            System.out.println("Entreprise: " + entrepriseId);
            System.out.println("Agent: " + agentId);
            System.out.println("Motif: " + motifRejet);
            
            // Vérifier si c'est une demande d'investissement
            if (entrepriseId != null && entrepriseId.startsWith("INV-")) {
                System.out.println("=== REJET RÉVISION DEMANDE D'INVESTISSEMENT ===");
                
                // Chercher l'assignation pour cette demande d'investissement
                Optional<AgrementAssignment> assignationOpt = assignmentRepository.findAll().stream()
                    .filter(a -> a.getEntrepriseId().equals(entrepriseId) && a.getEtape() == EtapeValidation.REVISION)
                    .findFirst();
                
                if (!assignationOpt.isPresent()) {
                    throw new IllegalStateException("Aucune assignation trouvée pour la demande d'investissement: " + entrepriseId);
                }
                
                AgrementAssignment assignment = assignationOpt.get();
                
                // Vérifier que c'est le bon agent
                if (!agentId.equals(assignment.getAgentId())) {
                    throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
                }
                
                // Rejeter et retourner à l'accueil
                assignment.setStatut("REJETE");
                assignment.setEtape(EtapeValidation.ACCUEIL);
                assignment.setDateTraitement(LocalDateTime.now());
                assignment.setObservations(assignment.getObservations() + " - Rejeté par l'analyste le " + LocalDateTime.now() + 
                                         " - Motif: " + (motifRejet != null ? motifRejet : "Non spécifié"));
                
                assignment = assignmentRepository.save(assignment);
                System.out.println("✅ Demande d'investissement rejetée vers l'accueil: " + entrepriseId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande d'investissement rejetée vers l'accueil");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            } else {
                // Logique existante pour les autres types de demandes
                AgrementAssignment assignment = workflowService.rejeterVersAccueil(entrepriseId, agentId, motifRejet);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Demande rejetée vers l'accueil");
                response.put("assignment", assignment);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE REGISSEUR ====================

    /**
     * Lister les demandes du régisseur (incluant les demandes d'investissement)
     * GET /agrement-workflow/regisseur/demandes
     */
    @GetMapping("/regisseur/demandes")
    public ResponseEntity<?> getDemandesRegisseur() {
        try {
            System.out.println("=== CONTROLLER: getDemandesRegisseur appelé ===");
            
            // Récupérer les entreprises normales à l'étape REGISSEUR_AGREMENT
            List<Entreprise> entreprisesNormales = entrepriseRepository.findByEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("=== CONTROLLER: " + entreprisesNormales.size() + " entreprises normales chez le régisseur ===");
            
            // Récupérer aussi les entreprises en attente de paiement
            List<Entreprise> entreprisesPaiement = entrepriseRepository.findByEtapeValidation(EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("=== CONTROLLER: " + entreprisesPaiement.size() + " entreprises en attente de paiement ===");
            
            // Récupérer les assignations d'investissement à l'étape REGISSEUR_AGREMENT
            List<AgrementAssignment> assignationsInvestissement = assignmentRepository.findAll().stream()
                .filter(a -> a.getEtape() == EtapeValidation.REGISSEUR_AGREMENT && a.getEntrepriseId().startsWith("INV-"))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("=== CONTROLLER: " + assignationsInvestissement.size() + " demandes d'investissement chez le régisseur ===");
            
            // Créer des objets Entreprise fictifs pour les demandes d'investissement
            List<Entreprise> toutesLesEntreprises = new ArrayList<>(entreprisesNormales);
            toutesLesEntreprises.addAll(entreprisesPaiement);
            
            for (AgrementAssignment assignment : assignationsInvestissement) {
                // Extraire le nom depuis les observations
                String nomEntreprise = "Entreprise " + assignment.getEntrepriseId().substring(0, 8) + "...";
                if (assignment.getObservations() != null) {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Demande d'investissement assignée - (.+?) \\(ID:");
                    java.util.regex.Matcher matcher = pattern.matcher(assignment.getObservations());
                    if (matcher.find()) {
                        nomEntreprise = matcher.group(1);
                    }
                }
                
                // Créer une entreprise fictive pour l'affichage
                Entreprise entrepriseFictive = new Entreprise();
                entrepriseFictive.setId(assignment.getEntrepriseId());
                entrepriseFictive.setNom(nomEntreprise);
                entrepriseFictive.setEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT); // Pour compatibilité frontend
                entrepriseFictive.setStatutCreation(abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.EN_COURS);
                entrepriseFictive.setTypeDemandeAgrement(TypeDemandeAgrement.AGREMENT);
                
                toutesLesEntreprises.add(entrepriseFictive);
                System.out.println("=== AJOUT DEMANDE INVESTISSEMENT CHEZ RÉGISSEUR: " + nomEntreprise + " (" + assignment.getEntrepriseId() + ") ===");
            }
            
            System.out.println("=== CONTROLLER: Total " + toutesLesEntreprises.size() + " demandes chez le régisseur ===");
            return ResponseEntity.ok(toutesLesEntreprises);
            
        } catch (Exception e) {
            System.err.println("=== CONTROLLER: ERREUR dans getDemandesRegisseur ===");
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la récupération des demandes du régisseur");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Passer au régisseur
     * POST /agrement-workflow/revision/passer-regisseur
     */
    @PostMapping("/revision/passer-regisseur")
    public ResponseEntity<?> passerAuRegisseur(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            AgrementAssignment assignment = workflowService.passerAuRegisseur(entrepriseId, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au régisseur");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE REGISSEUR ====================

    /**
     * Supprimer les paiements en attente et régénérer
     * POST /agrement-workflow/regisseur/regenerer-paiement
     */
    @PostMapping("/regisseur/regenerer-paiement")
    public ResponseEntity<?> regenererPaiement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== RÉGÉNÉRATION PAIEMENT (SUPPRESSION + CRÉATION) ===");
            System.out.println("Entreprise: " + entrepriseId);
            
            Map<String, Object> result = workflowService.regenererPaiementTransport(entrepriseId, agentId);
            
            System.out.println("✅ Paiement régénéré avec succès");
            
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            System.err.println("❌ Erreur état: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Erreur régénération paiement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la régénération du paiement: " + e.getMessage()));
        }
    }
    
    /**
     * Générer le paiement TresorPay
     * POST /agrement-workflow/regisseur/generer-paiement
     */
    @PostMapping("/regisseur/generer-paiement")
    public ResponseEntity<?> genererPaiement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            System.out.println("=== GÉNÉRATION PAIEMENT TRANSPORT ===");
            System.out.println("Entreprise: " + entrepriseId);
            
            Map<String, Object> result = workflowService.genererPaiementTransport(entrepriseId, agentId);
            
            System.out.println("✅ Paiement généré/mis à jour avec succès");
            
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            System.err.println("❌ Erreur état: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Erreur génération paiement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la génération du paiement: " + e.getMessage()));
        }
    }

    /**
     * Vérifier le paiement
     * POST /agrement-workflow/regisseur/verifier-paiement
     */
    @PostMapping("/regisseur/verifier-paiement")
    public ResponseEntity<?> verifierPaiement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            AgrementAssignment assignment = workflowService.verifierPaiement(entrepriseId, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Paiement vérifié et validé");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer au ministère
     * POST /agrement-workflow/regisseur/passer-ministere
     */
    @PostMapping("/regisseur/passer-ministere")
    public ResponseEntity<?> passerAuMinistere(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String ministereRole = request.get("ministereRole");
            
            AgrementAssignment assignment = workflowService.passerAuMinistere(entrepriseId, agentId, ministereRole);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande transférée au ministère");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE MINISTERE ====================

    /**
     * Obtenir la liste des ministères disponibles
     * GET /agrement-workflow/ministere/liste
     */
    @GetMapping("/ministere/liste")
    public ResponseEntity<List<String>> getMinisteresDisponibles() {
        try {
            List<String> ministeres = workflowService.getMinisteresDisponibles();
            return ResponseEntity.ok(ministeres);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Valider au niveau ministère
     * POST /agrement-workflow/ministere/valider
     */
    @PostMapping("/ministere/valider")
    public ResponseEntity<?> validerMinistere(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String observations = request.get("observations");
            
            AgrementAssignment assignment = workflowService.validerMinistere(entrepriseId, agentId, observations);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Validation ministère effectuée");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Passer au retrait
     * POST /agrement-workflow/ministere/passer-retrait
     */
    @PostMapping("/ministere/passer-retrait")
    public ResponseEntity<?> passerAuRetrait(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            AgrementAssignment assignment = workflowService.passerAuRetrait(entrepriseId, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande prête pour le retrait");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Rejeter au niveau ministere - retour accueil sans paiement
     * POST /agrement-workflow/ministere/rejeter
     */
    @PostMapping("/ministere/rejeter")
    public ResponseEntity<?> rejeterMinistere(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            String motifRejet = request.get("motifRejet");
            
            System.out.println("[Ministere] Rejet demande: " + entrepriseId + " - Motif: " + motifRejet);
            
            AgrementAssignment assignment = workflowService.rejeterMinistereVersAccueil(entrepriseId, agentId, motifRejet);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Demande rejetee vers l'accueil (sans nouveau paiement)");
            response.put("assignment", assignment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Upload de l'agrement signe et cachete
     * POST /agrement-workflow/ministere/upload-agrement
     */
    @PostMapping("/ministere/upload-agrement")
    public ResponseEntity<?> uploadAgrementSigne(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("entrepriseId") String entrepriseId,
            @RequestParam("agentId") String agentId) {
        try {
            System.out.println("[Ministere] Upload agrement signe pour: " + entrepriseId);
            
            Map<String, Object> result = workflowService.uploadAgrementSigne(entrepriseId, agentId, file);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ÉTAPE RETRAIT ====================

    /**
     * Obtenir le fichier d'agrément signé
     * GET /agrement-workflow/retrait/agrement-file/{entrepriseId}
     */
    @GetMapping("/retrait/agrement-file/{entrepriseId}")
    public ResponseEntity<?> getAgrementFile(@PathVariable String entrepriseId) {
        try {
            return workflowService.getAgrementFile(entrepriseId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Autoriser le téléchargement par l'utilisateur
     * POST /agrement-workflow/retrait/autoriser-telechargement
     */
    @PostMapping("/retrait/autoriser-telechargement")
    public ResponseEntity<?> autoriserTelechargement(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            String agentId = request.get("agentId");
            
            Map<String, Object> result = workflowService.autoriserTelechargement(entrepriseId, agentId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Marquer le téléchargement comme effectué (désactive l'autorisation)
     * POST /agrement-workflow/retrait/marquer-telecharge
     */
    @PostMapping("/retrait/marquer-telecharge")
    public ResponseEntity<?> marquerTelecharge(@RequestBody Map<String, String> request) {
        try {
            String entrepriseId = request.get("entrepriseId");
            
            Map<String, Object> result = workflowService.marquerTelechargementEffectue(entrepriseId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== UTILITAIRES ====================

    /**
     * Obtenir l'assignation actuelle d'une entreprise
     * GET /agrement-workflow/assignation/{entrepriseId}
     */
    @GetMapping("/assignation/{entrepriseId}")
    public ResponseEntity<?> getAssignationActuelle(@PathVariable String entrepriseId) {
        try {
            AgrementAssignment assignment = workflowService.getAssignationActuelle(entrepriseId);
            if (assignment == null) {
                return ResponseEntity.ok(Map.of("message", "Aucune assignation trouvée"));
            }
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtenir l'historique des assignations
     * GET /agrement-workflow/historique/{entrepriseId}
     */
    @GetMapping("/historique/{entrepriseId}")
    public ResponseEntity<List<AgrementAssignment>> getHistorique(@PathVariable String entrepriseId) {
        try {
            List<AgrementAssignment> historique = workflowService.getHistoriqueAssignations(entrepriseId);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== UTILITAIRES CODE DES INVESTISSEMENTS ====================

    /**
     * Obtenir la liste des régimes d'investissement
     * GET /agrement-workflow/regimes
     */
    @GetMapping("/regimes")
    public ResponseEntity<List<Map<String, Object>>> getRegimes() {
        try {
            List<Map<String, Object>> regimes = new java.util.ArrayList<>();
            for (abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement regime : 
                 abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement.values()) {
                Map<String, Object> regimeInfo = new HashMap<>();
                regimeInfo.put("code", regime.name());
                regimeInfo.put("libelle", regime.getLibelle());
                regimeInfo.put("montant", regime.getMontantDepot());
                regimeInfo.put("description", regime.getDescription());
                regimes.add(regimeInfo);
            }
            return ResponseEntity.ok(regimes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtenir la liste des types de demande d'agrément
     * GET /agrement-workflow/types-demande
     */
    @GetMapping("/types-demande")
    public ResponseEntity<List<Map<String, Object>>> getTypesDemande() {
        try {
            List<Map<String, Object>> types = new java.util.ArrayList<>();
            for (abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement type : 
                 abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement.values()) {
                Map<String, Object> typeInfo = new HashMap<>();
                typeInfo.put("code", type.name());
                typeInfo.put("libelle", type.getLibelle());
                typeInfo.put("requiresRegime", type.requiresRegime());
                typeInfo.put("montantFixe", type.getMontantFixe());
                typeInfo.put("description", type.getDescription());
                types.add(typeInfo);
            }
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtenir la liste des ministères disponibles
     * GET /agrement-workflow/ministeres
     */
    @GetMapping("/ministeres")
    public ResponseEntity<List<Map<String, Object>>> getMinisteres() {
        try {
            List<Map<String, Object>> ministeres = new java.util.ArrayList<>();
            
            Map<String, Object> commerce = new HashMap<>();
            commerce.put("code", "MINISTERE_COMMERCE");
            commerce.put("nom", "Ministère du Commerce");
            commerce.put("description", "Commerce et développement des entreprises");
            ministeres.add(commerce);
            
            Map<String, Object> industrie = new HashMap<>();
            industrie.put("code", "MINISTERE_INDUSTRIE");
            industrie.put("nom", "Ministère de l'Industrie");
            industrie.put("description", "Industrie et transformation");
            ministeres.add(industrie);
            
            Map<String, Object> tourisme = new HashMap<>();
            tourisme.put("code", "MINISTERE_TOURISME");
            tourisme.put("nom", "Ministère du Tourisme");
            tourisme.put("description", "Tourisme et hôtellerie");
            ministeres.add(tourisme);
            
            Map<String, Object> urbanisme = new HashMap<>();
            urbanisme.put("code", "MINISTERE_URBANISME");
            urbanisme.put("nom", "Ministère de l'Urbanisme");
            urbanisme.put("description", "BTP et établissements classés");
            ministeres.add(urbanisme);
            
            Map<String, Object> transports = new HashMap<>();
            transports.put("code", "MINISTERE_TRANSPORTS");
            transports.put("nom", "Ministère des Transports");
            transports.put("description", "Transport de marchandises et de personnes");
            ministeres.add(transports);
            
            return ResponseEntity.ok(ministeres);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== TÉLÉCHARGEMENT DE FICHIERS ====================

    /**
     * Télécharger un fichier d'agrément
     * GET /agrement-workflow/file/{entrepriseId}?filename=xxx
     */
    @GetMapping("/file/{entrepriseId}")
    public ResponseEntity<byte[]> getAgrementFile(
            @PathVariable String entrepriseId,
            @RequestParam String filename) {
        
        try {
            System.out.println("=== TÉLÉCHARGEMENT FICHIER ===");
            System.out.println("Entreprise/Demande: " + entrepriseId);
            System.out.println("Nom du fichier: " + filename);
            
            // Vérifier si c'est une demande indépendante (commence par AGR-)
            if (entrepriseId != null && entrepriseId.startsWith("AGR-")) {
                System.out.println("=== DEMANDE INDÉPENDANTE DÉTECTÉE ===");
                
                // Chercher la demande dans demande_autorisation_exercice
                DemandeAutorisationExercice demande = demandeRepository.findAll().stream()
                    .filter(d -> entrepriseId.equals(d.getNumeroDemande()))
                    .findFirst()
                    .orElse(null);
                
                if (demande == null) {
                    System.out.println("❌ Demande indépendante non trouvée: " + entrepriseId);
                    return ResponseEntity.notFound().build();
                }
                
                System.out.println("✅ Demande trouvée: " + demande.getNomEntreprise());
                System.out.println("Documents fournis: " + demande.getDocumentsFournis());
                
                // Vérifier si le fichier existe dans les documents fournis
                String documentsJson = demande.getDocumentsFournis();
                if (documentsJson != null && documentsJson.contains(filename)) {
                    System.out.println("✅ Fichier trouvé dans les documents: " + filename);
                    
                    // Pour l'instant, générer un placeholder SVG informatif
                    // En production, les fichiers seraient stockés dans un système de stockage séparé
                    String svgContent = createDocumentPlaceholder(filename, entrepriseId, demande.getNomEntreprise());
                    byte[] data = svgContent.getBytes("UTF-8");
                    
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType("image/svg+xml"));
                    headers.setCacheControl("no-cache");
                    headers.add("Content-Disposition", "inline");
                    headers.add("X-Content-Type-Options", "nosniff");
                    
                    System.out.println("✅ Placeholder SVG envoyé: " + data.length + " bytes");
                    
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(data);
                } else {
                    System.out.println("❌ Fichier non trouvé dans les documents: " + filename);
                    return ResponseEntity.notFound().build();
                }
            } else {
                // Logique existante pour les entreprises normales
                System.out.println("=== ENTREPRISE NORMALE ===");
                Path filePath = Paths.get("uploads/agrement/" + entrepriseId + "/" + filename);
                
                System.out.println("[AgrementWorkflowController] Téléchargement fichier: " + filePath.toAbsolutePath());
                
                if (!Files.exists(filePath)) {
                    System.err.println("[AgrementWorkflowController] Fichier non trouvé: " + filePath.toAbsolutePath());
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
                
                System.out.println("[AgrementWorkflowController] Fichier envoyé: " + data.length + " bytes, type: " + contentType);
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(data);
            }
                    
        } catch (IOException e) {
            System.err.println("[AgrementWorkflowController] Erreur lecture fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("Erreur générale téléchargement fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
