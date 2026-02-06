package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.AgrementAssignment;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Payment;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.repository.AgrementAssignmentRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.repository.PaymentRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.service.AgrementWorkflowService;
import abdaty_technologie.API_Invest.service.TresorPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgrementWorkflowServiceImpl implements AgrementWorkflowService {

    private final EntrepriseRepository entrepriseRepository;
    private final AgrementAssignmentRepository assignmentRepository;
    private final PersonsRepository personsRepository;
    private final PaymentRepository paymentRepository;
    private final TresorPayService tresorPayService;
    private final EntrepriseMembreRepository entrepriseMembreRepository;

    // ==================== ÉTAPE ACCUEIL ====================

    @Override
    @Transactional
    public AgrementAssignment assignerDemandeAccueil(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.ACCUEIL_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape ACCUEIL_AGREMENT");
        }

        // Vérifier si déjà assignée
        Optional<AgrementAssignment> existingAssignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.ACCUEIL_AGREMENT);
        
        if (existingAssignment.isPresent() && "EN_COURS".equals(existingAssignment.get().getStatut())) {
            throw new IllegalStateException("Cette demande est déjà assignée à un agent");
        }

        Persons agent = personsRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent non trouvé"));

        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        assignment.setEtape(EtapeValidation.ACCUEIL_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setStatut("EN_COURS");
        assignment.setDocumentsVerifies(false);

        return assignmentRepository.save(assignment);
    }

    @Override
    public List<Entreprise> getDemandesNonAssignees() {
        try {
            System.out.println("=== DEBUG getDemandesNonAssignees ===");
            
            // Utiliser une requête JPQL simple qui évite les relations
            List<Entreprise> entreprisesAccueil = entrepriseRepository.findByEtapeValidation(EtapeValidation.ACCUEIL_AGREMENT, org.springframework.data.domain.Pageable.unpaged()).getContent();
            System.out.println("Entreprises à ACCUEIL_AGREMENT trouvées: " + entreprisesAccueil.size());
            
            List<Entreprise> result = new ArrayList<>();
            
            for (Entreprise entreprise : entreprisesAccueil) {
                try {
                    System.out.println("✓ Entreprise: " + entreprise.getId() + " - " + entreprise.getNom());
                    
                    // Vérifier assignation de manière sécurisée
                    boolean estAssignee = false;
                    try {
                        Optional<AgrementAssignment> assignment = assignmentRepository
                                .findByEntrepriseIdAndEtape(entreprise.getId(), EtapeValidation.ACCUEIL_AGREMENT);
                        estAssignee = assignment.isPresent() && "EN_COURS".equals(assignment.get().getStatut());
                        System.out.println("  - Assignment présent: " + assignment.isPresent());
                        if (assignment.isPresent()) {
                            System.out.println("  - Statut assignment: '" + assignment.get().getStatut() + "'");
                            System.out.println("  - Est assignée: " + estAssignee);
                        } else {
                            System.out.println("  - Aucune assignation trouvée");
                        }
                    } catch (Exception assignEx) {
                        System.err.println("  - Erreur assignation: " + assignEx.getMessage());
                        estAssignee = false;
                    }
                    
                    if (!estAssignee) {
                        result.add(entreprise);
                        System.out.println("  ✓ Ajoutée à la liste des non assignées");
                    } else {
                        System.out.println("  ❌ Exclue car assignée");
                    }
                    
                } catch (Exception entEx) {
                    System.err.println("Erreur entreprise " + entreprise.getId() + ": " + entEx.getMessage());
                }
            }
            
            System.out.println("=== RÉSULTAT: " + result.size() + " demandes non assignées ===");
            return result;
            
        } catch (Exception e) {
            System.err.println("Erreur dans getDemandesNonAssignees: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<AgrementAssignment> getMesAssignations(String agentId) {
        try {
            System.out.println("=== DEBUG getMesAssignations pour agent: " + agentId + " ===");
            
            List<AgrementAssignment> assignations = assignmentRepository.findByAgentIdAndStatut(agentId, "EN_COURS");
            System.out.println("Assignations trouvées: " + assignations.size());
            
            // Pour chaque assignation, enrichir avec les informations de l'entreprise
            for (AgrementAssignment assignation : assignations) {
                try {
                    Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(assignation.getEntrepriseId());
                    if (entrepriseOpt.isPresent()) {
                        Entreprise entreprise = entrepriseOpt.get();
                        System.out.println("✓ Entreprise trouvée pour assignation: " + entreprise.getNom());
                        
                        // Enrichir l'assignation avec les informations de l'entreprise
                        // Note: Nous pourrions ajouter des champs à AgrementAssignment ou créer un DTO
                        // Pour l'instant, on s'assure juste que les données sont disponibles
                        
                    } else {
                        System.err.println("❌ Entreprise non trouvée pour ID: " + assignation.getEntrepriseId());
                    }
                } catch (Exception e) {
                    System.err.println("Erreur lors de la récupération de l'entreprise " + assignation.getEntrepriseId() + ": " + e.getMessage());
                }
            }
            
            return assignations;
            
        } catch (Exception e) {
            System.err.println("Erreur dans getMesAssignations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional
    public AgrementAssignment verifierDocumentsAccueil(String entrepriseId, String agentId, 
                                                       boolean documentsOk, String observations) {
        AgrementAssignment assignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.ACCUEIL_AGREMENT)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation trouvée"));

        if (!agentId.equals(assignment.getAgentId())) {
            throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
        }

        assignment.setDocumentsVerifies(documentsOk);
        assignment.setObservations(observations);
        assignment.setDateTraitement(LocalDateTime.now());

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public AgrementAssignment passerEnRevision(String entrepriseId, String agentId) {
        AgrementAssignment assignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.ACCUEIL_AGREMENT)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation trouvée"));

        if (!agentId.equals(assignment.getAgentId())) {
            throw new IllegalStateException("Vous n'êtes pas l'agent assigné à cette demande");
        }

        if (!Boolean.TRUE.equals(assignment.getDocumentsVerifies())) {
            throw new IllegalStateException("Les documents doivent être vérifiés avant de passer en révision");
        }

        // Marquer l'assignation actuelle comme validée
        assignment.setStatut("VALIDE");
        assignment.setDateTraitement(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // Passer l'entreprise à l'étape REVISION
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));
        entreprise.setEtapeValidation(EtapeValidation.REVISION_AGREMENT);
        entrepriseRepository.save(entreprise);

        return assignment;
    }

    // ==================== ÉTAPE REVISION ====================

    @Override
    public Map<String, Object> getDocumentsEntreprise(String entrepriseId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Récupérer les documents d'agrément depuis le système de fichiers
            String uploadDir = "uploads/agrement/";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir + entrepriseId);
            List<Map<String, Object>> documentsData = new ArrayList<>();
            
            if (java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.list(uploadPath).forEach(path -> {
                    Map<String, Object> docInfo = new HashMap<>();
                    String filename = path.getFileName().toString();
                    
                    // Extraire le type de document du nom de fichier
                    String typeDocument = filename.contains("_") 
                        ? filename.substring(0, filename.lastIndexOf("_")).replaceAll("_", " ")
                        : "Document";
                    
                    docInfo.put("id", filename);
                    docInfo.put("filename", filename);
                    docInfo.put("typeDocument", typeDocument);
                    docInfo.put("url", "/agrement-workflow/file/" + entrepriseId + "?filename=" + filename);
                    
                    try {
                        docInfo.put("size", java.nio.file.Files.size(path));
                        docInfo.put("lastModified", java.nio.file.Files.getLastModifiedTime(path).toString());
                    } catch (java.io.IOException e) {
                        docInfo.put("size", 0);
                    }
                    
                    documentsData.add(docInfo);
                });
            }
            
            result.put("documents", documentsData);
            result.put("totalDocuments", documentsData.size());
            result.put("entrepriseId", entrepriseId);
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération des documents d'agrément", e);
        }
        
        return result;
    }

    @Override
    @Transactional
    public AgrementAssignment validerRevision(String entrepriseId, String agentId, String observations) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.REVISION_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape REVISION");
        }

        // Passer à l'étape REGISSEUR_AGREMENT
        entreprise.setEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT);
        entrepriseRepository.save(entreprise);

        // Créer une assignation pour la révision validée
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        
        Persons agent = personsRepository.findById(agentId).orElse(null);
        if (agent != null) {
            assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        }
        
        assignment.setEtape(EtapeValidation.REGISSEUR_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setDateTraitement(LocalDateTime.now());
        assignment.setStatut("VALIDE");
        assignment.setObservations(observations);
        assignment.setDocumentsVerifies(true);

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public AgrementAssignment rejeterVersAccueil(String entrepriseId, String agentId, String motifRejet) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.REVISION_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape REVISION");
        }

        // Créer une assignation pour marquer le rejet
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        
        Persons agent = personsRepository.findById(agentId).orElse(null);
        if (agent != null) {
            assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        }
        
        assignment.setEtape(EtapeValidation.REVISION_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setDateTraitement(LocalDateTime.now());
        assignment.setStatut("REJETE");
        assignment.setObservations("REJET: " + motifRejet);

        assignmentRepository.save(assignment);

        // Retourner à l'étape ACCUEIL
        entreprise.setEtapeValidation(EtapeValidation.ACCUEIL_AGREMENT);
        entreprise.setObservations(motifRejet);
        entrepriseRepository.save(entreprise);

        return assignment;
    }

    @Override
    @Transactional
    public AgrementAssignment passerAuRegisseur(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.REVISION_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape REVISION");
        }

        // Passer à l'étape REGISSEUR
        entreprise.setEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT);
        entrepriseRepository.save(entreprise);

        // Créer l'assignation
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        
        Persons agent = personsRepository.findById(agentId).orElse(null);
        if (agent != null) {
            assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        }
        
        assignment.setEtape(EtapeValidation.REGISSEUR_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setStatut("EN_COURS");

        return assignmentRepository.save(assignment);
    }

    // ==================== ÉTAPE REGISSEUR ====================

    /**
     * Calcule le montant des frais de dépôt selon le domaine d'activité, le régime et le type de demande
     */
    private int calculerMontantFraisDepot(Entreprise entreprise) {
        // D'abord, vérifier si c'est une autorisation d'exercice (basée sur le domaine d'activité)
        abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites domaine = entreprise.getDomaineActivite();
        
        // Pour les domaines spécifiques (autorisations d'exercice), utiliser le montant du domaine
        if (domaine != null) {
            switch (domaine) {
                case URBANISTE:
                case ARCHITECTE:
                case GEOMETRES_EXPERTS:
                case TRANSPORT:
                case BTP:
                case INGENIEUR_CONSEIL:
                case ETABLISSEMENT_DE_TOURISME:
                case AGENCE_DE_VOYAGE:
                case STATIONS:
                    // Ces domaines ont des montants spécifiques pour les autorisations d'exercice
                    return calculerMontantParDomaineActivite(entreprise);
                default:
                    break;
            }
        }
        
        // Pour les autres cas, vérifier le type de demande d'agrément
        TypeDemandeAgrement typeAgrement = entreprise.getTypeDemandeAgrement();
        
        // Si pas de type défini, calculer selon le domaine d'activité
        if (typeAgrement == null) {
            return calculerMontantParDomaineActivite(entreprise);
        }
        
        // Pour les demandes qui ont un montant fixe (extension, renouvellement, prorogation)
        if (!typeAgrement.requiresRegime()) {
            return typeAgrement.getMontantFixe();
        }
        
        // Pour les nouvelles demandes, le montant dépend du régime
        RegimeInvestissement regime = entreprise.getRegimeInvestissement();
        if (regime == null) {
            // Si pas de régime, utiliser le domaine d'activité
            return calculerMontantParDomaineActivite(entreprise);
        }
        
        return regime.getMontantDepot();
    }

    /**
     * Calcule le montant des frais de dépôt selon le domaine d'activité
     * NB: Montants spécifiques par type de demande d'autorisation d'exercice
     */
    private int calculerMontantParDomaineActivite(Entreprise entreprise) {
        abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites domaine = entreprise.getDomaineActivite();
        
        if (domaine == null) {
            return 125000; // Montant par défaut
        }
        
        // Montants spécifiques selon le domaine d'activité
        switch (domaine) {
            case URBANISTE:
            case ARCHITECTE:
            case GEOMETRES_EXPERTS:
                return 300000; // NB: Frais de dépôt = 300 000 FCFA
            case TRANSPORT:
                return 125000; // Frais de dépôt pour transport
            case BTP:
                return 150000; // Frais de dépôt pour BTP
            case INGENIEUR_CONSEIL:
                return 250000; // Frais de dépôt pour ingénieur conseil
            case ETABLISSEMENT_DE_TOURISME:
                return 200000; // Frais de dépôt pour établissement de tourisme
            case AGENCE_DE_VOYAGE:
                return 150000; // Frais de dépôt pour agence de voyage
            case STATIONS:
                return 200000; // Frais de dépôt pour stations-service
            default:
                return 125000; // Montant par défaut pour autres domaines
        }
    }

    @Override
    @Transactional
    public Map<String, Object> genererPaiementTransport(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        // Accepter REGISSEUR_AGREMENT ou PAIEMENT_EN_ATTENTE_AGREMENT (pour régénération)
        if (!EtapeValidation.REGISSEUR_AGREMENT.equals(entreprise.getEtapeValidation()) && 
            !EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape REGISSEUR ou PAIEMENT_EN_ATTENTE");
        }

        // Calculer le montant selon le régime et le type de demande
        int montantDepot = calculerMontantFraisDepot(entreprise);
        
        // Sauvegarder le montant calculé dans l'entreprise
        entreprise.setMontantFraisDepot(montantDepot);
        entrepriseRepository.save(entreprise);

        // Vérifier si un paiement existe déjà (PENDING ou EMITTED)
        List<Payment> existingPayments = paymentRepository.findByEntrepriseId(entrepriseId);
        Optional<Payment> existingPayment = existingPayments.stream()
                .filter(p -> p.getDescription() != null && p.getDescription().startsWith("Frais de dépôt"))
                .filter(p -> "PENDING".equals(p.getStatus()) || "EMITTED".equals(p.getStatus()))
                .findFirst();
        
        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            
            System.out.println("[Agrement] Paiement existant trouve - Statut: " + payment.getStatus() + 
                             ", Reference: " + payment.getTresorPayReference() + 
                             ", Montant existant: " + payment.getAmount() +
                             ", Nouveau montant: " + montantDepot +
                             ", URL: " + (payment.getPaymentUrl() != null ? "Oui" : "Non"));
            
            // Vérifier si le montant a changé - si oui, annuler l'ancien paiement et en créer un nouveau
            if (payment.getAmount() != null && payment.getAmount().intValue() != montantDepot) {
                System.out.println("[Agrement] Montant different! Annulation de l'ancien paiement...");
                payment.setStatus("CANCELLED");
                paymentRepository.save(payment);
                // Continuer pour créer un nouveau paiement (ne pas retourner)
            } else {
                // Montant identique - vérifier si l'URL TresorPay existe déjà
                if (payment.getPaymentUrl() != null && !payment.getPaymentUrl().isEmpty()) {
                    System.out.println("[Agrement] Paiement deja complet avec URL");
                    entreprise.setEtapeValidation(EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT);
                    entrepriseRepository.save(entreprise);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("paymentExists", true);
                    result.put("payment", payment);
                    result.put("montant", montantDepot);
                    return result;
                }
                
                // Paiement existe mais sans URL - générer l'URL
                System.out.println("[Agrement] Paiement existe sans URL TresorPay");
                try {
                    if (payment.getTresorPayReference() != null && !payment.getTresorPayReference().isEmpty()) {
                        String paymentUrl = tresorPayService.generatePaymentUrl(payment.getTresorPayReference());
                        payment.setPaymentUrl(paymentUrl);
                        payment.setStatus("EMITTED");
                        paymentRepository.save(payment);
                        System.out.println("[Agrement] URL generee: " + paymentUrl);
                    }
                } catch (Exception e) {
                    System.err.println("Erreur lors de la generation de l'URL TresorPay: " + e.getMessage());
                }
                
                entreprise.setEtapeValidation(EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT);
                entrepriseRepository.save(entreprise);
                
                Map<String, Object> result = new HashMap<>();
                result.put("paymentExists", true);
                result.put("payment", payment);
                result.put("montant", montantDepot);
                return result;
            }
        }

        // Créer un nouveau paiement (soit pas de paiement existant, soit ancien annulé)
        System.out.println("[Agrement] Creation d'un nouveau paiement avec montant: " + montantDepot);

        // Déterminer la description selon le type
        String description;
        TypeDemandeAgrement typeAgrement = entreprise.getTypeDemandeAgrement();
        if (typeAgrement != null) {
            description = "Frais de dépôt - " + typeAgrement.getLibelle();
            if (typeAgrement.requiresRegime() && entreprise.getRegimeInvestissement() != null) {
                description += " (" + entreprise.getRegimeInvestissement().getLibelle() + ")";
            }
        } else {
            description = "Frais de dépôt - Autorisation d'exercice";
        }

        // Créer le paiement TresorPay
        Payment payment = new Payment();
        payment.setEntrepriseId(entrepriseId);
        payment.setEntrepriseNom(entreprise.getNom());
        payment.setAmount(new BigDecimal(montantDepot));
        payment.setCurrency("XOF");
        payment.setDescription(description);
        payment.setPaymentMethod("TRESOR_PAY");
        payment.setStatus("PENDING");
        payment.setCustomerEmail(""); // Email sera récupéré du user
        payment.setCustomerName(entreprise.getNom());
        payment.setCustomerPhone(""); // Téléphone sera récupéré du user

        Payment savedPayment = paymentRepository.save(payment);
        
        // Créer un avis de recette TresorPay (comme pour création d'entreprise)
        try {
            // Récupérer les informations du gérant pour TresorPay
            String customerFirstName = "";
            String customerLastName = "";
            String customerEmail = "";
            String customerPhone = "";
            
            // Essayer de récupérer les infos du gérant
            try {
                List<abdaty_technologie.API_Invest.Entity.EntrepriseMembre> membres = 
                    entrepriseMembreRepository.findByEntreprise_Id(entrepriseId);
                
                if (!membres.isEmpty()) {
                    abdaty_technologie.API_Invest.Entity.EntrepriseMembre gerant = membres.stream()
                        .filter(m -> "FONDATEUR".equals(m.getRole()) || "GERANT".equals(m.getRole()))
                        .findFirst()
                        .orElse(membres.get(0));
                    
                    abdaty_technologie.API_Invest.Entity.Persons personne = gerant.getPersonne();
                    if (personne != null) {
                        customerFirstName = personne.getPrenom() != null ? personne.getPrenom() : "";
                        customerLastName = personne.getNom() != null ? personne.getNom() : "";
                        customerEmail = personne.getEmail() != null ? personne.getEmail() : "";
                        customerPhone = personne.getTelephone1() != null ? personne.getTelephone1() : "";
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Impossible de récupérer les infos du gérant: " + e.getMessage());
            }
            
            // Construire la requête TresorPay
            abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeRequest tresorPayRequest = 
                tresorPayService.buildNoticeRequest(
                    entrepriseId,
                    entreprise.getReference(),
                    entreprise.getNom(),
                    Long.valueOf(montantDepot),
                    description,
                    customerFirstName,
                    customerLastName,
                    customerEmail,
                    customerPhone
                );
            
            // Créer l'avis de recette TresorPay
            abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeResponse tresorPayResponse = 
                tresorPayService.createNotice(tresorPayRequest);
            
            System.out.println("✅ [Agrément] Avis TresorPay créé avec référence: " + tresorPayResponse.getReference());
            
            // Mettre à jour le paiement avec la vraie référence TresorPay
            savedPayment.setTresorPayReference(tresorPayResponse.getReference());
            savedPayment.setStatus("EMITTED");
            
            // Générer l'URL de paiement
            String paymentUrl = tresorPayService.generatePaymentUrl(tresorPayResponse.getReference());
            savedPayment.setPaymentUrl(paymentUrl);
            
            savedPayment = paymentRepository.save(savedPayment);
            
            System.out.println("✅ [Agrément] URL de paiement générée: " + paymentUrl);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la création de l'avis TresorPay: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Changer l'étape de validation pour indiquer que le paiement est en attente
        entreprise.setEtapeValidation(EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT);
        entrepriseRepository.save(entreprise);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("payment", savedPayment);
        result.put("paymentId", savedPayment.getId());
        result.put("montant", montantDepot);
        result.put("montantFormate", String.format("%,d FCFA", montantDepot));
        result.put("message", "Demande de paiement créée avec succès. L'utilisateur doit maintenant procéder au paiement.");
        result.put("description", description);
        result.put("typeAgrement", typeAgrement != null ? typeAgrement.name() : "TRANSPORT");
        result.put("regime", entreprise.getRegimeInvestissement() != null ? 
            entreprise.getRegimeInvestissement().name() : null);

        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> regenererPaiementTransport(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        // Accepter REGISSEUR_AGREMENT ou PAIEMENT_EN_ATTENTE_AGREMENT
        if (!EtapeValidation.REGISSEUR_AGREMENT.equals(entreprise.getEtapeValidation()) && 
            !EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape REGISSEUR ou PAIEMENT_EN_ATTENTE");
        }

        System.out.println("🗑️ [Agrément] Suppression des anciens paiements...");
        
        // Supprimer TOUS les paiements d'agrément pour cette entreprise (y compris COMPLETED)
        List<Payment> existingPayments = paymentRepository.findByEntrepriseId(entrepriseId);
        List<Payment> paymentsToDelete = existingPayments.stream()
                .filter(p -> p.getDescription() != null && p.getDescription().startsWith("Frais de dépôt"))
                .collect(Collectors.toList());
        
        if (!paymentsToDelete.isEmpty()) {
            System.out.println("🗑️ [Agrément] Suppression de " + paymentsToDelete.size() + " paiement(s)");
            for (Payment p : paymentsToDelete) {
                System.out.println("   - ID: " + p.getId() + ", Statut: " + p.getStatus() + ", Référence: " + p.getTresorPayReference());
            }
            paymentRepository.deleteAll(paymentsToDelete);
            System.out.println("✅ [Agrément] Paiements supprimés");
        } else {
            System.out.println("ℹ️ [Agrément] Aucun paiement à supprimer");
        }

        // Calculer le montant selon le régime et le type de demande
        int montantDepot = calculerMontantFraisDepot(entreprise);
        
        // Sauvegarder le montant calculé dans l'entreprise
        entreprise.setMontantFraisDepot(montantDepot);
        entrepriseRepository.save(entreprise);

        // Déterminer la description selon le type
        String description;
        TypeDemandeAgrement typeAgrement = entreprise.getTypeDemandeAgrement();
        if (typeAgrement != null) {
            description = "Frais de dépôt - " + typeAgrement.getLibelle();
            if (typeAgrement.requiresRegime() && entreprise.getRegimeInvestissement() != null) {
                description += " - " + entreprise.getRegimeInvestissement().getLibelle();
            }
        } else {
            description = "Frais de dépôt d'agrément";
        }

        System.out.println("💰 [Agrément] Création d'un nouveau paiement - Montant: " + montantDepot + " FCFA");

        // Créer un nouveau paiement
        Payment payment = new Payment();
        payment.setEntrepriseId(entrepriseId);
        payment.setEntrepriseNom(entreprise.getNom());
        payment.setAmount(BigDecimal.valueOf(montantDepot));
        payment.setCurrency("XOF");
        payment.setDescription(description);
        payment.setPaymentMethod("TRESOR_PAY");
        payment.setStatus("PENDING");
        payment.setCustomerEmail("");
        payment.setCustomerName(entreprise.getNom());
        payment.setCustomerPhone("");

        Payment savedPayment = paymentRepository.save(payment);
        
        // Créer l'avis de recette TresorPay
        try {
            // Récupérer les informations du gérant
            String customerFirstName = "";
            String customerLastName = "";
            String customerEmail = "";
            String customerPhone = "";
            
            try {
                List<abdaty_technologie.API_Invest.Entity.EntrepriseMembre> membres = 
                    entrepriseMembreRepository.findByEntreprise_Id(entrepriseId);
                
                if (!membres.isEmpty()) {
                    abdaty_technologie.API_Invest.Entity.EntrepriseMembre gerant = membres.stream()
                        .filter(m -> "FONDATEUR".equals(m.getRole()) || "GERANT".equals(m.getRole()))
                        .findFirst()
                        .orElse(membres.get(0));
                    
                    abdaty_technologie.API_Invest.Entity.Persons personne = gerant.getPersonne();
                    if (personne != null) {
                        customerFirstName = personne.getPrenom() != null ? personne.getPrenom() : "";
                        customerLastName = personne.getNom() != null ? personne.getNom() : "";
                        customerEmail = personne.getEmail() != null ? personne.getEmail() : "";
                        customerPhone = personne.getTelephone1() != null ? personne.getTelephone1() : "";
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Impossible de récupérer les infos du gérant: " + e.getMessage());
            }
            
            // Construire la requête TresorPay
            abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeRequest tresorPayRequest = 
                tresorPayService.buildNoticeRequest(
                    entrepriseId,
                    entreprise.getReference(),
                    entreprise.getNom(),
                    Long.valueOf(montantDepot),
                    description,
                    customerFirstName,
                    customerLastName,
                    customerEmail,
                    customerPhone
                );
            
            // Créer l'avis de recette TresorPay
            abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeResponse tresorPayResponse = 
                tresorPayService.createNotice(tresorPayRequest);
            
            System.out.println("✅ [Agrément] Avis TresorPay créé avec référence: " + tresorPayResponse.getReference());
            
            // Mettre à jour le paiement avec la référence TresorPay
            savedPayment.setTresorPayReference(tresorPayResponse.getReference());
            savedPayment.setStatus("EMITTED");
            
            // Générer l'URL de paiement
            String paymentUrl = tresorPayService.generatePaymentUrl(tresorPayResponse.getReference());
            savedPayment.setPaymentUrl(paymentUrl);
            
            savedPayment = paymentRepository.save(savedPayment);
            
            System.out.println("✅ [Agrément] URL de paiement générée: " + paymentUrl);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la création de l'avis TresorPay: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Changer l'étape de validation
        entreprise.setEtapeValidation(EtapeValidation.PAIEMENT_EN_ATTENTE_AGREMENT);
        entrepriseRepository.save(entreprise);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("payment", savedPayment);
        result.put("paymentId", savedPayment.getId());
        result.put("montant", montantDepot);
        
        return result;
    }

    @Override
    @Transactional
    public AgrementAssignment verifierPaiement(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        // Vérifier le statut du paiement
        List<Payment> payments = paymentRepository.findByEntrepriseId(entrepriseId);
        Optional<Payment> paymentOpt = payments.stream()
                .filter(p -> p.getDescription() != null && p.getDescription().startsWith("Frais de dépôt"))
                .findFirst();

        if (paymentOpt.isEmpty()) {
            throw new IllegalStateException("Aucun paiement trouvé pour cette entreprise");
        }

        Payment payment = paymentOpt.get();

        // Si le paiement n'a pas d'URL TresorPay, créer l'avis maintenant
        if ((payment.getPaymentUrl() == null || payment.getPaymentUrl().isEmpty()) && 
            !"COMPLETED".equals(payment.getStatus())) {
            
            System.out.println("⚠️ [Vérification] Paiement sans URL TresorPay, création de l'avis...");
            
            try {
                int montantDepot = entreprise.getMontantFraisDepot() != null ? 
                    entreprise.getMontantFraisDepot() : 125000;
                
                // Récupérer les informations du gérant
                String customerFirstName = "";
                String customerLastName = "";
                String customerEmail = "";
                String customerPhone = "";
                
                try {
                    List<abdaty_technologie.API_Invest.Entity.EntrepriseMembre> membres = 
                        entrepriseMembreRepository.findByEntreprise_Id(entrepriseId);
                    
                    if (!membres.isEmpty()) {
                        abdaty_technologie.API_Invest.Entity.EntrepriseMembre gerant = membres.stream()
                            .filter(m -> "FONDATEUR".equals(m.getRole()) || "GERANT".equals(m.getRole()))
                            .findFirst()
                            .orElse(membres.get(0));
                        
                        abdaty_technologie.API_Invest.Entity.Persons personne = gerant.getPersonne();
                        if (personne != null) {
                            customerFirstName = personne.getPrenom() != null ? personne.getPrenom() : "";
                            customerLastName = personne.getNom() != null ? personne.getNom() : "";
                            customerEmail = personne.getEmail() != null ? personne.getEmail() : "";
                            customerPhone = personne.getTelephone1() != null ? personne.getTelephone1() : "";
                        }
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Impossible de récupérer les infos du gérant: " + e.getMessage());
                }
                
                // Construire la requête TresorPay
                abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeRequest tresorPayRequest = 
                    tresorPayService.buildNoticeRequest(
                        entrepriseId,
                        entreprise.getReference(),
                        entreprise.getNom(),
                        Long.valueOf(montantDepot),
                        payment.getDescription(),
                        customerFirstName,
                        customerLastName,
                        customerEmail,
                        customerPhone
                    );
                
                // Créer l'avis de recette TresorPay
                abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeResponse tresorPayResponse = 
                    tresorPayService.createNotice(tresorPayRequest);
                
                System.out.println("✅ [Vérification] Avis TresorPay créé avec référence: " + tresorPayResponse.getReference());
                
                // Mettre à jour le paiement
                payment.setTresorPayReference(tresorPayResponse.getReference());
                payment.setStatus("EMITTED");
                
                String paymentUrl = tresorPayService.generatePaymentUrl(tresorPayResponse.getReference());
                payment.setPaymentUrl(paymentUrl);
                
                paymentRepository.save(payment);
                
                System.out.println("✅ [Vérification] Paiement mis à jour avec URL: " + paymentUrl);
                
            } catch (Exception e) {
                System.err.println("❌ Erreur lors de la création de l'avis TresorPay: " + e.getMessage());
                e.printStackTrace();
            }
        }

        // Accepter COMPLETED ou PAID comme statuts valides
        if (!"COMPLETED".equals(payment.getStatus()) && !"PAID".equals(payment.getStatus())) {
            throw new IllegalStateException("Le paiement n'est pas encore complété. Statut: " + payment.getStatus());
        }

        System.out.println("✅ [Vérification] Paiement validé - Statut: " + payment.getStatus() + ", Référence: " + payment.getTresorPayReference());

        // Remettre l'entreprise à l'étape REGISSEUR une fois le paiement vérifié
        entreprise.setEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT);
        entrepriseRepository.save(entreprise);

        // Chercher ou créer l'assignation REGISSEUR
        Optional<AgrementAssignment> assignmentOpt = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.REGISSEUR_AGREMENT);
        
        AgrementAssignment assignment;
        if (assignmentOpt.isPresent()) {
            assignment = assignmentOpt.get();
        } else {
            // Créer une nouvelle assignation si elle n'existe pas
            System.out.println("⚠️ [Vérification] Assignation REGISSEUR introuvable, création...");
            assignment = new AgrementAssignment();
            assignment.setEntrepriseId(entrepriseId);
            assignment.setAgentId(agentId);
            assignment.setEtape(EtapeValidation.REGISSEUR_AGREMENT);
            assignment.setStatut("EN_COURS");
            assignment.setDateAssignment(LocalDateTime.now());
        }

        String montantStr = entreprise.getMontantFraisDepot() != null ? 
            String.format("%,d FCFA", entreprise.getMontantFraisDepot()) : "125 000 FCFA";
        assignment.setObservations("Paiement vérifié - " + montantStr + " - Référence: " + payment.getTresorPayReference());
        assignment.setDateTraitement(LocalDateTime.now());

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public AgrementAssignment passerAuMinistere(String entrepriseId, String agentId, String ministereRole) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.REGISSEUR_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape REGISSEUR");
        }

        // Vérifier que le paiement est complété (accepter COMPLETED ou PAID)
        List<Payment> payments = paymentRepository.findByEntrepriseId(entrepriseId);
        Optional<Payment> payment = payments.stream()
                .filter(p -> p.getDescription() != null && p.getDescription().startsWith("Frais de dépôt"))
                .findFirst();
        
        if (payment.isEmpty()) {
            throw new IllegalStateException("Aucun paiement trouvé pour cette entreprise");
        }
        
        String paymentStatus = payment.get().getStatus();
        if (!"COMPLETED".equals(paymentStatus) && !"PAID".equals(paymentStatus)) {
            throw new IllegalStateException("Le paiement doit être complété avant de passer au ministère. Statut actuel: " + paymentStatus);
        }

        // Marquer l'assignation régisseur comme validée
        AgrementAssignment regisseurAssignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.REGISSEUR_AGREMENT)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation régisseur trouvée"));
        
        regisseurAssignment.setStatut("VALIDE");
        regisseurAssignment.setDateTraitement(LocalDateTime.now());
        assignmentRepository.save(regisseurAssignment);

        // Passer à l'étape MINISTERE
        entreprise.setEtapeValidation(EtapeValidation.MINISTERE_AGREMENT);
        entrepriseRepository.save(entreprise);

        // Créer l'assignation ministère
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        
        Persons agent = personsRepository.findById(agentId).orElse(null);
        if (agent != null) {
            assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        }
        
        assignment.setEtape(EtapeValidation.MINISTERE_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setStatut("EN_COURS");
        assignment.setMinistereAssigne(ministereRole);

        return assignmentRepository.save(assignment);
    }

    // ==================== ÉTAPE MINISTERE ====================

    @Override
    public List<String> getMinisteresDisponibles() {
        return Arrays.asList(
            Roles.MINISTERE_TRANSPORT.getValue(),
            Roles.MINISTERE_TOURISME.getValue(),
            Roles.MINISTERE_COMMERCE.getValue(),
            Roles.MINISTERE_INDUSTRIE.getValue(),
            Roles.MINISTERE_ENVIRONNEMENT.getValue(),
            Roles.MINISTERE_URBANISME.getValue()
        );
    }

    @Override
    @Transactional
    public AgrementAssignment validerMinistere(String entrepriseId, String agentId, String observations) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.MINISTERE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape MINISTERE");
        }

        AgrementAssignment assignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.MINISTERE_AGREMENT)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation ministère trouvée"));

        assignment.setStatut("VALIDE");
        assignment.setObservations(observations);
        assignment.setDateTraitement(LocalDateTime.now());

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public AgrementAssignment passerAuRetrait(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        if (!EtapeValidation.MINISTERE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape MINISTERE");
        }

        // Vérifier que le ministère a validé
        AgrementAssignment ministereAssignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.MINISTERE_AGREMENT)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation ministère trouvée"));
        
        if (!"VALIDE".equals(ministereAssignment.getStatut())) {
            throw new IllegalStateException("Le ministère doit valider avant de passer au retrait");
        }

        // Passer à l'étape RETRAIT
        entreprise.setEtapeValidation(EtapeValidation.RETRAIT_AGREMENT);
        entrepriseRepository.save(entreprise);

        // Créer l'assignation retrait
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        
        Persons agent = personsRepository.findById(agentId).orElse(null);
        if (agent != null) {
            assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        }
        
        assignment.setEtape(EtapeValidation.RETRAIT_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setStatut("EN_COURS");

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public AgrementAssignment rejeterMinistereVersAccueil(String entrepriseId, String agentId, String motifRejet) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvee"));

        if (!EtapeValidation.MINISTERE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas a l'etape MINISTERE");
        }

        // Marquer l'assignation ministere comme rejetee
        AgrementAssignment ministereAssignment = assignmentRepository
                .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.MINISTERE_AGREMENT)
                .orElse(null);
        
        if (ministereAssignment != null) {
            ministereAssignment.setStatut("REJETE");
            ministereAssignment.setObservations("REJET MINISTERE: " + motifRejet);
            ministereAssignment.setDateTraitement(LocalDateTime.now());
            assignmentRepository.save(ministereAssignment);
        }

        // Retourner a l'etape ACCUEIL (sans nouveau paiement requis)
        entreprise.setEtapeValidation(EtapeValidation.ACCUEIL_AGREMENT);
        // Marquer que le paiement a deja ete effectue (pas de nouveau paiement)
        entreprise.setPaiementEffectue(true);
        entrepriseRepository.save(entreprise);

        // Creer une assignation pour l'accueil
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        
        Persons agent = personsRepository.findById(agentId).orElse(null);
        if (agent != null) {
            assignment.setAgentNom(agent.getNom() + " " + agent.getPrenom());
        }
        
        assignment.setEtape(EtapeValidation.ACCUEIL_AGREMENT);
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setStatut("RETOUR_MINISTERE");
        assignment.setObservations("Retour du ministere - Motif: " + motifRejet + " (Paiement deja effectue)");

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Map<String, Object> uploadAgrementSigne(String entrepriseId, String agentId, org.springframework.web.multipart.MultipartFile file) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvee"));

        if (!EtapeValidation.MINISTERE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas a l'etape MINISTERE");
        }

        try {
            // Creer le repertoire de stockage si necessaire
            String uploadDir = "uploads/agrements/" + entrepriseId;
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            // Generer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".pdf";
            String filename = "agrement_signe_" + System.currentTimeMillis() + extension;
            
            // Sauvegarder le fichier
            java.nio.file.Path filePath = uploadPath.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // Mettre a jour l'entreprise avec le chemin du fichier
            entreprise.setAgrementSignePath(filePath.toString());
            entrepriseRepository.save(entreprise);

            // Mettre a jour l'assignation ministere
            AgrementAssignment ministereAssignment = assignmentRepository
                    .findByEntrepriseIdAndEtape(entrepriseId, EtapeValidation.MINISTERE_AGREMENT)
                    .orElse(null);
            
            if (ministereAssignment != null) {
                ministereAssignment.setObservations(
                    (ministereAssignment.getObservations() != null ? ministereAssignment.getObservations() + " | " : "") +
                    "Agrement signe uploade: " + filename
                );
                assignmentRepository.save(ministereAssignment);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Agrement signe uploade avec succes");
            result.put("filename", filename);
            result.put("path", filePath.toString());
            
            return result;
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'upload de l'agrement signe: " + e.getMessage(), e);
        }
    }

    // ==================== ÉTAPE RETRAIT ====================

    @Override
    public org.springframework.http.ResponseEntity<?> getAgrementFile(String entrepriseId) {
        System.out.println("📥 [RETRAIT] Demande de téléchargement agrément pour entreprise: " + entrepriseId);
        
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvee"));

        String agrementPath = entreprise.getAgrementSignePath();
        System.out.println("📥 [RETRAIT] agrementSignePath: " + agrementPath);
        
        if (agrementPath == null || agrementPath.isEmpty()) {
            System.out.println("❌ [RETRAIT] Pas de chemin d'agrément défini");
            return org.springframework.http.ResponseEntity.status(404)
                    .body(java.util.Map.of("error", "Aucun agrément n'a été uploadé pour cette entreprise"));
        }

        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(agrementPath);
            System.out.println("📥 [RETRAIT] Chemin fichier: " + filePath.toAbsolutePath());
            
            if (!java.nio.file.Files.exists(filePath)) {
                System.out.println("❌ [RETRAIT] Fichier non trouvé sur le disque");
                return org.springframework.http.ResponseEntity.status(404)
                        .body(java.util.Map.of("error", "Le fichier d'agrément n'existe pas sur le serveur"));
            }

            byte[] fileContent = java.nio.file.Files.readAllBytes(filePath);
            String filename = filePath.getFileName().toString();
            String contentType = "application/pdf";
            
            if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            }

            return org.springframework.http.ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .header("Content-Type", contentType)
                    .body(fileContent);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> autoriserTelechargement(String entrepriseId, String agentId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvee"));

        // Autoriser le téléchargement
        entreprise.setTelechargementAutorise(true);
        entrepriseRepository.save(entreprise);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Telechargement autorise pour l'utilisateur");
        result.put("entrepriseId", entrepriseId);
        
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> marquerTelechargementEffectue(String entrepriseId) {
        System.out.println("📥 [RETRAIT] Marquage téléchargement effectué pour: " + entrepriseId);
        
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvee"));

        // Désactiver l'autorisation après téléchargement
        entreprise.setTelechargementAutorise(false);
        entrepriseRepository.save(entreprise);

        System.out.println("✅ [RETRAIT] Téléchargement marqué - autorisation désactivée");

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Telechargement effectue - autorisation desactivee");
        result.put("entrepriseId", entrepriseId);
        
        return result;
    }

    // ==================== UTILITAIRES ====================

    @Override
    public AgrementAssignment getAssignationActuelle(String entrepriseId) {
        return assignmentRepository
                .findTopByEntrepriseIdOrderByDateAssignmentDesc(entrepriseId)
                .orElse(null);
    }

    @Override
    public List<AgrementAssignment> getHistoriqueAssignations(String entrepriseId) {
        return assignmentRepository
                .findByEntrepriseIdOrderByDateAssignmentDesc(entrepriseId);
    }

    // ==================== NOUVEAUX WORKFLOWS D'AUTORISATION D'EXERCICE ====================

    @Override
    @Transactional
    public AgrementAssignment creerDemandeAvecWorkflow(String entrepriseId, String agentId, TypeDemandeAgrement typedemande) {
        System.out.println("=== CRÉATION DEMANDE AVEC WORKFLOW ===");
        System.out.println("Entreprise: " + entrepriseId);
        System.out.println("Agent: " + agentId);
        System.out.println("Type: " + typedemande);

        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        // Déterminer la première étape selon le type de demande
        EtapeValidation premiereEtape;
        switch (typedemande) {
            case AGREMENT:
                premiereEtape = EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT;
                break;
            case DECISION:
                premiereEtape = EtapeValidation.ACCUEIL_DECISION;
                break;
            case ENREGISTREMENT:
                premiereEtape = EtapeValidation.ACCUEIL_ENREGISTREMENT;
                break;
            default:
                premiereEtape = EtapeValidation.ACCUEIL_AGREMENT;
        }

        // Mettre à jour l'entreprise
        entreprise.setEtapeValidation(premiereEtape);
        entrepriseRepository.save(entreprise);

        // Créer l'assignation
        AgrementAssignment assignment = new AgrementAssignment();
        assignment.setEntrepriseId(entrepriseId);
        assignment.setAgentId(agentId);
        assignment.setEtape(premiereEtape);
        assignment.setStatut("EN_COURS");
        assignment.setDateAssignment(LocalDateTime.now());
        assignment.setObservations("Demande " + typedemande.getLibelle() + " créée");

        assignment = assignmentRepository.save(assignment);
        System.out.println("✅ Assignation créée avec ID: " + assignment.getId());

        return assignment;
    }

    @Override
    @Transactional
    public AgrementAssignment passerEtapeSuivante(String entrepriseId, String agentId, EtapeValidation nouvelleEtape, String observations) {
        System.out.println("=== PASSAGE À L'ÉTAPE SUIVANTE ===");
        System.out.println("Entreprise: " + entrepriseId);
        System.out.println("Nouvelle étape: " + nouvelleEtape);

        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        // Récupérer l'assignation actuelle
        AgrementAssignment currentAssignment = assignmentRepository
                .findTopByEntrepriseIdOrderByDateAssignmentDesc(entrepriseId)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation trouvée"));

        // Mettre à jour l'entreprise
        entreprise.setEtapeValidation(nouvelleEtape);
        entrepriseRepository.save(entreprise);

        // Créer une nouvelle assignation pour tracer l'historique
        AgrementAssignment newAssignment = new AgrementAssignment();
        newAssignment.setEntrepriseId(entrepriseId);
        newAssignment.setAgentId(agentId);
        newAssignment.setEtape(nouvelleEtape);
        newAssignment.setStatut("EN_COURS");
        newAssignment.setDateAssignment(LocalDateTime.now());
        newAssignment.setObservations(observations != null ? observations : "Passage à l'étape " + nouvelleEtape.getValue());

        // Marquer l'ancienne assignation comme terminée
        currentAssignment.setStatut("TERMINE");
        assignmentRepository.save(currentAssignment);

        newAssignment = assignmentRepository.save(newAssignment);
        System.out.println("✅ Nouvelle assignation créée avec ID: " + newAssignment.getId());

        return newAssignment;
    }

    @Override
    @Transactional
    public AgrementAssignment rejeterDemande(String entrepriseId, String agentId, String motifRejet, String etapeRetour) {
        System.out.println("=== REJET DE DEMANDE ===");
        System.out.println("Entreprise: " + entrepriseId);
        System.out.println("Motif: " + motifRejet);
        System.out.println("Étape de retour: " + etapeRetour);

        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));

        // Récupérer l'assignation actuelle
        AgrementAssignment currentAssignment = assignmentRepository
                .findTopByEntrepriseIdOrderByDateAssignmentDesc(entrepriseId)
                .orElseThrow(() -> new IllegalStateException("Aucune assignation trouvée"));

        // Déterminer l'étape de retour
        EtapeValidation etapeRetourEnum;
        if (etapeRetour != null && !etapeRetour.isEmpty()) {
            try {
                etapeRetourEnum = EtapeValidation.valueOf(etapeRetour);
            } catch (IllegalArgumentException e) {
                // Si l'étape spécifiée n'est pas valide, retourner à l'accueil
                etapeRetourEnum = EtapeValidation.ACCUEIL_AGREMENT;
            }
        } else {
            // Par défaut, retourner à l'accueil selon le type de workflow
            EtapeValidation etapeActuelle = currentAssignment.getEtape();
            if (etapeActuelle.name().contains("AGREMENT")) {
                etapeRetourEnum = EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT;
            } else if (etapeActuelle.name().contains("DECISION")) {
                etapeRetourEnum = EtapeValidation.ACCUEIL_DECISION;
            } else if (etapeActuelle.name().contains("ENREGISTREMENT")) {
                etapeRetourEnum = EtapeValidation.ACCUEIL_ENREGISTREMENT;
            } else {
                etapeRetourEnum = EtapeValidation.ACCUEIL_AGREMENT;
            }
        }

        // Mettre à jour l'entreprise
        entreprise.setEtapeValidation(etapeRetourEnum);
        entrepriseRepository.save(entreprise);

        // Marquer l'assignation actuelle comme rejetée
        currentAssignment.setStatut("REJETE");
        currentAssignment.setObservations(motifRejet);
        assignmentRepository.save(currentAssignment);

        // Créer une nouvelle assignation pour l'étape de retour
        AgrementAssignment newAssignment = new AgrementAssignment();
        newAssignment.setEntrepriseId(entrepriseId);
        newAssignment.setAgentId(agentId);
        newAssignment.setEtape(etapeRetourEnum);
        newAssignment.setStatut("EN_COURS");
        newAssignment.setDateAssignment(LocalDateTime.now());
        newAssignment.setObservations("Retour suite au rejet: " + motifRejet);

        newAssignment = assignmentRepository.save(newAssignment);
        System.out.println("✅ Demande rejetée et retournée à l'étape: " + etapeRetourEnum);

        return newAssignment;
    }
}
