package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import abdaty_technologie.API_Invest.repository.DemandeAutorisationExerciceRepository;
import abdaty_technologie.API_Invest.service.DemandeAutorisationExerciceService;
import abdaty_technologie.API_Invest.service.WorkflowDefinitionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DemandeAutorisationExerciceServiceImpl implements DemandeAutorisationExerciceService {

    private final DemandeAutorisationExerciceRepository repository;
    private final WorkflowDefinitionService workflowDefinitionService;
    private final ObjectMapper objectMapper;

    // ==================== CRÉATION ET GESTION DES DEMANDES ====================

    @Override
    @Transactional
    public DemandeAutorisationExercice creerDemande(DemandeAutorisationExercice demande) {
        System.out.println("=== CRÉATION DEMANDE INDÉPENDANTE ===");
        System.out.println("Type: " + demande.getTypeDemande());
        System.out.println("Demandeur: " + demande.getNomDemandeur() + " " + demande.getPrenomDemandeur());

        // Initialiser les valeurs par défaut
        demande.setStatut("EN_COURS");
        demande.setEtapeActuelle(getEtapeInitiale(demande.getTypeDemande()));
        demande.setMontantDemande(getMontantParType(demande.getTypeDemande()));
        demande.setDelaiTraitementEstime(calculerDelaiTraitementEstime(demande.getTypeDemande()));
        demande.setPaiementEffectue(false);

        // Initialiser l'historique des étapes
        List<Map<String, Object>> historique = new ArrayList<>();
        Map<String, Object> etapeInitiale = new HashMap<>();
        etapeInitiale.put("etape", demande.getEtapeActuelle().name());
        etapeInitiale.put("date", LocalDateTime.now().toString());
        etapeInitiale.put("statut", "EN_COURS");
        etapeInitiale.put("observations", "Demande créée");
        historique.add(etapeInitiale);

        try {
            demande.setHistoriqueEtapes(objectMapper.writeValueAsString(historique));
        } catch (JsonProcessingException e) {
            System.err.println("Erreur lors de la sérialisation de l'historique: " + e.getMessage());
        }

        // Définir les documents requis selon le type
        demande.setDocumentsRequis(getDocumentsRequisParType(demande.getTypeDemande()));

        DemandeAutorisationExercice savedDemande = repository.save(demande);
        System.out.println("✅ Demande créée avec ID: " + savedDemande.getId() + " et numéro: " + savedDemande.getNumeroDemande());

        return savedDemande;
    }

    @Override
    @Transactional
    public DemandeAutorisationExercice mettreAJourDemande(Long demandeId, DemandeAutorisationExercice demande) {
        DemandeAutorisationExercice existante = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        // Mettre à jour les champs modifiables
        existante.setNomDemandeur(demande.getNomDemandeur());
        existante.setPrenomDemandeur(demande.getPrenomDemandeur());
        existante.setEmailDemandeur(demande.getEmailDemandeur());
        existante.setTelephoneDemandeur(demande.getTelephoneDemandeur());
        existante.setAdresseDemandeur(demande.getAdresseDemandeur());
        
        existante.setNomEntreprise(demande.getNomEntreprise());
        existante.setSigleEntreprise(demande.getSigleEntreprise());
        existante.setSecteurActivite(demande.getSecteurActivite());
        existante.setDescriptionActivite(demande.getDescriptionActivite());
        existante.setAdresseEntreprise(demande.getAdresseEntreprise());
        existante.setVilleEntreprise(demande.getVilleEntreprise());
        existante.setRegionEntreprise(demande.getRegionEntreprise());
        
        existante.setCapitalSocial(demande.getCapitalSocial());
        existante.setChiffreAffairesPrevisionnel(demande.getChiffreAffairesPrevisionnel());
        existante.setNombreEmployesPrevus(demande.getNombreEmployesPrevus());

        return repository.save(existante);
    }

    @Override
    @Transactional
    public void supprimerDemande(Long demandeId, String motif) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        demande.setStatut("SUPPRIME");
        demande.setMotifRejet(motif);
        repository.save(demande);
    }

    // ==================== RECHERCHE ET CONSULTATION ====================

    @Override
    public Optional<DemandeAutorisationExercice> getDemandeById(Long demandeId) {
        return repository.findById(demandeId);
    }

    @Override
    public Optional<DemandeAutorisationExercice> getDemandeByNumero(String numeroDemande) {
        return repository.findByNumeroDemande(numeroDemande);
    }

    @Override
    public List<DemandeAutorisationExercice> getDemandesByDemandeur(String emailDemandeur) {
        return repository.findByEmailDemandeur(emailDemandeur);
    }

    @Override
    public List<DemandeAutorisationExercice> getDemandesByType(TypeDemandeAgrement typeDemande) {
        return repository.findByTypeDemande(typeDemande);
    }

    @Override
    public List<DemandeAutorisationExercice> getDemandesByStatut(String statut) {
        return repository.findByStatut(statut);
    }

    // ==================== WORKFLOW ET ASSIGNATION ====================

    @Override
    @Transactional
    public DemandeAutorisationExercice assignerDemande(Long demandeId, String agentId, String antenneTraitement) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        demande.setAgentAssigneId(agentId);
        demande.setAntenneTraitement(antenneTraitement);
        
        ajouterEtapeHistorique(demande, "ASSIGNATION", "Demande assignée à l'agent " + agentId);
        
        return repository.save(demande);
    }

    @Override
    @Transactional
    public DemandeAutorisationExercice passerEtapeSuivante(Long demandeId, String agentId, String observations) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        EtapeValidation prochaineEtape = getProchaineEtape(demande.getTypeDemande(), demande.getEtapeActuelle());
        
        if (prochaineEtape == null) {
            throw new IllegalStateException("Aucune étape suivante définie");
        }

        demande.setEtapeActuelle(prochaineEtape);
        ajouterEtapeHistorique(demande, prochaineEtape.name(), observations);

        return repository.save(demande);
    }

    @Override
    @Transactional
    public DemandeAutorisationExercice rejeterDemande(Long demandeId, String agentId, String motifRejet) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        demande.setStatut("REJETE");
        demande.setMotifRejet(motifRejet);
        
        ajouterEtapeHistorique(demande, "REJET", motifRejet);

        return repository.save(demande);
    }

    @Override
    @Transactional
    public DemandeAutorisationExercice validerDemande(Long demandeId, String agentId, String observations) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        demande.setStatut("VALIDE");
        demande.setDateValidation(LocalDateTime.now());
        
        ajouterEtapeHistorique(demande, "VALIDATION", observations);

        return repository.save(demande);
    }

    @Override
    @Transactional
    public DemandeAutorisationExercice suspendreDemande(Long demandeId, String agentId, String motif) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        demande.setStatut("SUSPENDU");
        demande.setMotifRejet(motif);
        
        ajouterEtapeHistorique(demande, "SUSPENSION", motif);

        return repository.save(demande);
    }

    // ==================== GESTION DES PAIEMENTS ====================

    @Override
    @Transactional
    public DemandeAutorisationExercice marquerPaiementEffectue(Long demandeId, String referencePaiement) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        demande.setPaiementEffectue(true);
        demande.setReferencePaiement(referencePaiement);
        demande.setDatePaiement(LocalDateTime.now());
        
        ajouterEtapeHistorique(demande, "PAIEMENT", "Paiement effectué - Référence: " + referencePaiement);

        return repository.save(demande);
    }

    @Override
    public Map<String, Object> genererDemandePaiement(Long demandeId) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        Map<String, Object> demandePaiement = new HashMap<>();
        demandePaiement.put("demandeId", demandeId);
        demandePaiement.put("numeroDemande", demande.getNumeroDemande());
        demandePaiement.put("montant", demande.getMontantDemande());
        demandePaiement.put("libelle", "Paiement " + demande.getTypeDemande().getLibelle());
        demandePaiement.put("demandeur", demande.getNomDemandeur() + " " + demande.getPrenomDemandeur());
        demandePaiement.put("email", demande.getEmailDemandeur());

        return demandePaiement;
    }

    @Override
    public Map<String, Object> verifierStatutPaiement(Long demandeId) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        Map<String, Object> statutPaiement = new HashMap<>();
        statutPaiement.put("demandeId", demandeId);
        statutPaiement.put("paiementEffectue", demande.getPaiementEffectue());
        statutPaiement.put("referencePaiement", demande.getReferencePaiement());
        statutPaiement.put("datePaiement", demande.getDatePaiement());
        statutPaiement.put("montant", demande.getMontantDemande());

        return statutPaiement;
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    private EtapeValidation getEtapeInitiale(TypeDemandeAgrement typeDemande) {
        return switch (typeDemande) {
            case AGREMENT -> EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT;
            case DECISION -> EtapeValidation.ACCUEIL_DECISION;
            case ENREGISTREMENT -> EtapeValidation.ACCUEIL_ENREGISTREMENT;
            default -> EtapeValidation.ACCUEIL_AGREMENT;
        };
    }

    private BigDecimal getMontantParType(TypeDemandeAgrement typeDemande) {
        return switch (typeDemande) {
            case AGREMENT -> new BigDecimal("300000");
            case DECISION -> new BigDecimal("150000");
            case ENREGISTREMENT -> new BigDecimal("50000");
            default -> new BigDecimal("0");
        };
    }

    private String getDocumentsRequisParType(TypeDemandeAgrement typeDemande) {
        List<String> documents = switch (typeDemande) {
            case AGREMENT -> Arrays.asList(
                "Certificat d'incorporation",
                "Statuts de l'entreprise",
                "CV du dirigeant",
                "Justificatif de domicile",
                "Attestation bancaire",
                "Plan d'affaires"
            );
            case DECISION -> Arrays.asList(
                "Certificat d'incorporation",
                "Statuts de l'entreprise",
                "CV du dirigeant",
                "Justificatif de domicile"
            );
            case ENREGISTREMENT -> Arrays.asList(
                "Certificat d'incorporation",
                "CV du dirigeant"
            );
            default -> Arrays.asList("Document de base");
        };

        try {
            return objectMapper.writeValueAsString(documents);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @Override
    public EtapeValidation getProchaineEtape(TypeDemandeAgrement typeDemande, EtapeValidation etapeActuelle) {
        List<EtapeValidation> workflow = workflowDefinitionService.getWorkflowSteps(typeDemande);
        int currentIndex = workflow.indexOf(etapeActuelle);
        
        if (currentIndex >= 0 && currentIndex < workflow.size() - 1) {
            return workflow.get(currentIndex + 1);
        }
        
        return null; // Fin du workflow
    }

    @Override
    public boolean peutFranchirEtape(Long demandeId, EtapeValidation nouvelleEtape) {
        DemandeAutorisationExercice demande = repository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande non trouvée"));

        // Vérifier si le paiement est requis et effectué pour les agréments
        if (demande.getTypeDemande() == TypeDemandeAgrement.AGREMENT && 
            !demande.isPaiementComplete() && 
            nouvelleEtape != EtapeValidation.ACCUEIL_AGREMENT_PAIEMENT) {
            return false;
        }

        // Vérifier si c'est la prochaine étape logique
        EtapeValidation prochaineEtape = getProchaineEtape(demande.getTypeDemande(), demande.getEtapeActuelle());
        return nouvelleEtape.equals(prochaineEtape);
    }

    @Override
    public int calculerDelaiTraitementEstime(TypeDemandeAgrement typeDemande) {
        return switch (typeDemande) {
            case AGREMENT -> 90; // 90 jours
            case DECISION -> 45; // 45 jours
            case ENREGISTREMENT -> 10; // 10 jours
            default -> 30;
        };
    }

    private void ajouterEtapeHistorique(DemandeAutorisationExercice demande, String etape, String observations) {
        try {
            List<Map<String, Object>> historique = new ArrayList<>();
            
            if (demande.getHistoriqueEtapes() != null) {
                historique = objectMapper.readValue(demande.getHistoriqueEtapes(), List.class);
            }

            Map<String, Object> nouvelleEtape = new HashMap<>();
            nouvelleEtape.put("etape", etape);
            nouvelleEtape.put("date", LocalDateTime.now().toString());
            nouvelleEtape.put("observations", observations);
            historique.add(nouvelleEtape);

            demande.setHistoriqueEtapes(objectMapper.writeValueAsString(historique));
        } catch (JsonProcessingException e) {
            System.err.println("Erreur lors de la mise à jour de l'historique: " + e.getMessage());
        }
    }

    // ==================== IMPLÉMENTATIONS SIMPLIFIÉES DES AUTRES MÉTHODES ====================

    @Override
    public DemandeAutorisationExercice ajouterDocument(Long demandeId, String typeDocument, String cheminDocument) {
        // Implémentation simplifiée
        return repository.findById(demandeId).orElse(null);
    }

    @Override
    public List<Map<String, Object>> getDocumentsDemande(Long demandeId) {
        return new ArrayList<>();
    }

    @Override
    public boolean documentsComplets(Long demandeId) {
        return true; // Implémentation simplifiée
    }

    @Override
    public Map<String, Long> getStatistiquesParType() {
        List<Object[]> results = repository.countByTypeDemande();
        return results.stream().collect(Collectors.toMap(
            result -> result[0].toString(),
            result -> (Long) result[1]
        ));
    }

    @Override
    public Map<String, Long> getStatistiquesParStatut() {
        List<Object[]> results = repository.countByStatut();
        return results.stream().collect(Collectors.toMap(
            result -> result[0].toString(),
            result -> (Long) result[1]
        ));
    }

    @Override
    public List<DemandeAutorisationExercice> getDemandesEnRetard() {
        return repository.findDemandesEnRetard();
    }

    @Override
    public Map<String, Object> getTableauDeBordAgent(String agentId) {
        List<DemandeAutorisationExercice> demandes = repository.findByAgentAssigneId(agentId);
        Map<String, Object> tableau = new HashMap<>();
        tableau.put("totalDemandes", demandes.size());
        tableau.put("demandesEnCours", demandes.stream().filter(d -> "EN_COURS".equals(d.getStatut())).count());
        tableau.put("demandesValidees", demandes.stream().filter(d -> "VALIDE".equals(d.getStatut())).count());
        return tableau;
    }

    @Override
    public List<DemandeAutorisationExercice> rechercherDemandes(Map<String, Object> criteres) {
        // Implémentation simplifiée - retourner toutes les demandes
        return repository.findAll();
    }

    @Override
    public List<DemandeAutorisationExercice> rechercheTextuelle(String searchTerm) {
        return repository.searchInObservationsAndDescription(searchTerm);
    }

    @Override
    public void envoyerNotificationDemandeur(Long demandeId, String message) {
        // Implémentation simplifiée
        System.out.println("Notification envoyée au demandeur pour la demande " + demandeId + ": " + message);
    }

    @Override
    public void envoyerNotificationAgent(Long demandeId, String agentId, String message) {
        // Implémentation simplifiée
        System.out.println("Notification envoyée à l'agent " + agentId + " pour la demande " + demandeId + ": " + message);
    }

    @Override
    public List<Map<String, Object>> getHistoriqueEtapes(Long demandeId) {
        DemandeAutorisationExercice demande = repository.findById(demandeId).orElse(null);
        if (demande != null && demande.getHistoriqueEtapes() != null) {
            try {
                return objectMapper.readValue(demande.getHistoriqueEtapes(), List.class);
            } catch (JsonProcessingException e) {
                System.err.println("Erreur lors de la lecture de l'historique: " + e.getMessage());
            }
        }
        return new ArrayList<>();
    }
}
