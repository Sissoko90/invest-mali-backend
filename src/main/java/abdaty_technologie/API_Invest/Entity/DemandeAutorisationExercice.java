package abdaty_technologie.API_Invest.Entity;

import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "demande_autorisation_exercice")
public class DemandeAutorisationExercice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_demande", unique = true)
    private String numeroDemande;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_demande", nullable = false)
    private TypeDemandeAgrement typeDemande;

    @Enumerated(EnumType.STRING)
    @Column(name = "etape_actuelle", nullable = false)
    private EtapeValidation etapeActuelle;

    @Column(name = "statut", nullable = false)
    private String statut; // EN_COURS, VALIDE, REJETE, SUSPENDU

    // Informations du demandeur
    @Column(name = "nom_demandeur", nullable = false)
    private String nomDemandeur;

    @Column(name = "prenom_demandeur", nullable = false)
    private String prenomDemandeur;

    @Column(name = "email_demandeur", nullable = false)
    private String emailDemandeur;

    @Column(name = "telephone_demandeur")
    private String telephoneDemandeur;
    
    @Column(name = "adresse_demandeur")
    private String adresseDemandeur;
    
    // Informations de l'entreprise
    @Column(name = "nom_entreprise", nullable = false)
    private String nomEntreprise;

    @Column(name = "sigle_entreprise")
    private String sigleEntreprise;

    @Column(name = "secteur_activite", nullable = false)
    private String secteurActivite;

    @Column(name = "description_activite", columnDefinition = "TEXT")
    private String descriptionActivite;

    @Column(name = "adresse_entreprise")
    private String adresseEntreprise;

    @Column(name = "ville_entreprise")
    private String villeEntreprise;

    @Column(name = "region_entreprise")
    private String regionEntreprise;

    // Informations financières
    @Column(name = "capital_social", precision = 15, scale = 2)
    private BigDecimal capitalSocial;

    @Column(name = "chiffre_affaires_previsionnel", precision = 15, scale = 2)
    private BigDecimal chiffreAffairesPrevisionnel;

    @Column(name = "nombre_employes_prevus")
    private Integer nombreEmployesPrevus;

    // Montant et paiement
    @Column(name = "montant_demande", precision = 10, scale = 2, nullable = false)
    private BigDecimal montantDemande;

    @Column(name = "paiement_effectue")
    private Boolean paiementEffectue = false;

    @Column(name = "reference_paiement")
    private String referencePaiement;

    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    // Dates importantes
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_derniere_modification")
    private LocalDateTime dateDerniereModification;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "delai_traitement_estime")
    private Integer delaiTraitementEstime; // en jours

    // Agent assigné
    @Column(name = "agent_assigne_id")
    private String agentAssigneId;

    @Column(name = "antenne_traitement")
    private String antenneTraitement;

    // Observations et commentaires
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "motif_rejet", columnDefinition = "TEXT")
    private String motifRejet;

    // Documents associés
    @Column(name = "documents_requis", columnDefinition = "JSON")
    private String documentsRequis; // JSON array des documents nécessaires

    @Column(name = "documents_fournis", columnDefinition = "JSON")
    private String documentsFournis; // JSON array des documents fournis

    // Workflow tracking
    @Column(name = "historique_etapes", columnDefinition = "JSON")
    private String historiqueEtapes; // JSON array de l'historique des étapes

    @Column(name = "prochaine_etape")
    private String prochaineEtape;

    @Column(name = "responsable_etape_actuelle")
    private String responsableEtapeActuelle;

    // Méthodes utilitaires
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateDerniereModification = LocalDateTime.now();
        if (numeroDemande == null) {
            generateNumeroDemande();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        dateDerniereModification = LocalDateTime.now();
    }

    private void generateNumeroDemande() {
        String prefix = switch (typeDemande) {
            case AGREMENT -> "AGR";
            case DECISION -> "DEC";
            case ENREGISTREMENT -> "ENR";
            default -> "AUT";
        };
        
        String timestamp = String.valueOf(System.currentTimeMillis());
        this.numeroDemande = prefix + "-" + timestamp.substring(timestamp.length() - 8);
    }

    // Méthodes de gestion du statut
    public boolean isEnCours() {
        return "EN_COURS".equals(statut);
    }

    public boolean isValide() {
        return "VALIDE".equals(statut);
    }

    public boolean isRejete() {
        return "REJETE".equals(statut);
    }

    public boolean isSuspendu() {
        return "SUSPENDU".equals(statut);
    }

    // Méthodes de gestion du paiement
    public boolean isPaiementRequis() {
        return typeDemande == TypeDemandeAgrement.AGREMENT;
    }

    public boolean isPaiementComplete() {
        return !isPaiementRequis() || (paiementEffectue != null && paiementEffectue);
    }
    
    // Constructors
    public DemandeAutorisationExercice() {}
    
    public DemandeAutorisationExercice(String numeroDemande, TypeDemandeAgrement typeDemande, 
                                     EtapeValidation etapeActuelle, String statut, String nomDemandeur, 
                                     String prenomDemandeur, String emailDemandeur) {
        this.numeroDemande = numeroDemande;
        this.typeDemande = typeDemande;
        this.etapeActuelle = etapeActuelle;
        this.statut = statut;
        this.nomDemandeur = nomDemandeur;
        this.prenomDemandeur = prenomDemandeur;
        this.emailDemandeur = emailDemandeur;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNumeroDemande() { return numeroDemande; }
    public void setNumeroDemande(String numeroDemande) { this.numeroDemande = numeroDemande; }
    
    public TypeDemandeAgrement getTypeDemande() { return typeDemande; }
    public void setTypeDemande(TypeDemandeAgrement typeDemande) { this.typeDemande = typeDemande; }
    
    public EtapeValidation getEtapeActuelle() { return etapeActuelle; }
    public void setEtapeActuelle(EtapeValidation etapeActuelle) { this.etapeActuelle = etapeActuelle; }
    
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    
    public String getNomDemandeur() { return nomDemandeur; }
    public void setNomDemandeur(String nomDemandeur) { this.nomDemandeur = nomDemandeur; }
    
    public String getPrenomDemandeur() { return prenomDemandeur; }
    public void setPrenomDemandeur(String prenomDemandeur) { this.prenomDemandeur = prenomDemandeur; }
    
    public String getEmailDemandeur() { return emailDemandeur; }
    public void setEmailDemandeur(String emailDemandeur) { this.emailDemandeur = emailDemandeur; }
    
    public String getTelephoneDemandeur() { return telephoneDemandeur; }
    public void setTelephoneDemandeur(String telephoneDemandeur) { this.telephoneDemandeur = telephoneDemandeur; }
    
    // Getters/setters pour tous les autres champs manquants
    public String getAdresseDemandeur() { return adresseDemandeur; }
    public void setAdresseDemandeur(String adresseDemandeur) { this.adresseDemandeur = adresseDemandeur; }
    
    public String getNomEntreprise() { return nomEntreprise; }
    public void setNomEntreprise(String nomEntreprise) { this.nomEntreprise = nomEntreprise; }
    
    public String getSigleEntreprise() { return sigleEntreprise; }
    public void setSigleEntreprise(String sigleEntreprise) { this.sigleEntreprise = sigleEntreprise; }
    
    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }
    
    public String getDescriptionActivite() { return descriptionActivite; }
    public void setDescriptionActivite(String descriptionActivite) { this.descriptionActivite = descriptionActivite; }
    
    public String getAdresseEntreprise() { return adresseEntreprise; }
    public void setAdresseEntreprise(String adresseEntreprise) { this.adresseEntreprise = adresseEntreprise; }
    
    public String getVilleEntreprise() { return villeEntreprise; }
    public void setVilleEntreprise(String villeEntreprise) { this.villeEntreprise = villeEntreprise; }
    
    public String getRegionEntreprise() { return regionEntreprise; }
    public void setRegionEntreprise(String regionEntreprise) { this.regionEntreprise = regionEntreprise; }
    
    public BigDecimal getCapitalSocial() { return capitalSocial; }
    public void setCapitalSocial(BigDecimal capitalSocial) { this.capitalSocial = capitalSocial; }
    
    public BigDecimal getChiffreAffairesPrevisionnel() { return chiffreAffairesPrevisionnel; }
    public void setChiffreAffairesPrevisionnel(BigDecimal chiffreAffairesPrevisionnel) { this.chiffreAffairesPrevisionnel = chiffreAffairesPrevisionnel; }
    
    public Integer getNombreEmployesPrevus() { return nombreEmployesPrevus; }
    public void setNombreEmployesPrevus(Integer nombreEmployesPrevus) { this.nombreEmployesPrevus = nombreEmployesPrevus; }
    
    public BigDecimal getMontantDemande() { return montantDemande; }
    public void setMontantDemande(BigDecimal montantDemande) { this.montantDemande = montantDemande; }
    
    public Boolean getPaiementEffectue() { return paiementEffectue; }
    public void setPaiementEffectue(Boolean paiementEffectue) { this.paiementEffectue = paiementEffectue; }
    
    public String getReferencePaiement() { return referencePaiement; }
    public void setReferencePaiement(String referencePaiement) { this.referencePaiement = referencePaiement; }
    
    public LocalDateTime getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDateTime datePaiement) { this.datePaiement = datePaiement; }
    
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    
    public LocalDateTime getDateDerniereModification() { return dateDerniereModification; }
    public void setDateDerniereModification(LocalDateTime dateDerniereModification) { this.dateDerniereModification = dateDerniereModification; }
    
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime dateValidation) { this.dateValidation = dateValidation; }
    
    public Integer getDelaiTraitementEstime() { return delaiTraitementEstime; }
    public void setDelaiTraitementEstime(Integer delaiTraitementEstime) { this.delaiTraitementEstime = delaiTraitementEstime; }
    
    public String getAgentAssigneId() { return agentAssigneId; }
    public void setAgentAssigneId(String agentAssigneId) { this.agentAssigneId = agentAssigneId; }
    
    public String getAntenneTraitement() { return antenneTraitement; }
    public void setAntenneTraitement(String antenneTraitement) { this.antenneTraitement = antenneTraitement; }
    
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    
    public String getMotifRejet() { return motifRejet; }
    public void setMotifRejet(String motifRejet) { this.motifRejet = motifRejet; }
    
    public String getDocumentsRequis() { return documentsRequis; }
    public void setDocumentsRequis(String documentsRequis) { this.documentsRequis = documentsRequis; }
    
    public String getDocumentsFournis() { return documentsFournis; }
    public void setDocumentsFournis(String documentsFournis) { this.documentsFournis = documentsFournis; }
    
    public String getHistoriqueEtapes() { return historiqueEtapes; }
    public void setHistoriqueEtapes(String historiqueEtapes) { this.historiqueEtapes = historiqueEtapes; }
    
    public String getProchaineEtape() { return prochaineEtape; }
    public void setProchaineEtape(String prochaineEtape) { this.prochaineEtape = prochaineEtape; }
    
    public String getResponsableEtapeActuelle() { return responsableEtapeActuelle; }
    public void setResponsableEtapeActuelle(String responsableEtapeActuelle) { this.responsableEtapeActuelle = responsableEtapeActuelle; }
}
