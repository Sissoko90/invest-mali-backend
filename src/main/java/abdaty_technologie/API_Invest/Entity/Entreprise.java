package abdaty_technologie.API_Invest.Entity;

import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.time.Instant;

import abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites;
import abdaty_technologie.API_Invest.Entity.Enum.DomaineActiviteNr;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.FormeJuridique;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;
import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
@Entity
public class Entreprise extends BaseEntity {
  @Column(name="reference", nullable = false, unique = true, length = 50)
  private String reference;

  @Column(name="capital", nullable = false)
  private BigDecimal capitale;

  @Column(name="activiteSecondaire", nullable = false,  length = 5000)
  private String activiteSecondaire;

  @Column(name="nom", nullable = true, unique = true, length = 150)
  private String nom;

  @Column(name="sigle", nullable = true, unique = true, length = 50)
  private String sigle;

  @Column(name="adresse_different_identite", nullable = false)
  private Boolean adresseDifferentIdentite;

  @Column(name="extrait_judiciaire", nullable = false)
  private Boolean extraitJudiciaire;

  @Column(name="autorisation_gerant", nullable = false)
  private Boolean autorisationGerant;

  @Column(name="autorisation_exercice", nullable = false)
  private Boolean autorisationExercice;

  @Column(name="import_export", nullable = false)
  private Boolean importExport;

  @Column(name="type_entreprise", nullable = false, length = 50)
  @Enumerated(EnumType.STRING) 
  private TypeEntreprise typeEntreprise;
  
  @Column(name="statut_societe", nullable = false)
  private Boolean StatutSociete;
  
  @Column(name="statut_creation", nullable = false, length = 50)
  @Enumerated(EnumType.STRING) 
  private StatutCreation statutCreation;
  
  @Column(name="etape_validation", nullable = false, length = 50)
  @Enumerated(EnumType.STRING) 
  private EtapeValidation etapeValidation;
  
  @Column(name="forme_juridique", nullable = false, length = 10)
  @Enumerated(EnumType.STRING) 
  private FormeJuridique formeJuridique;
  
  @Column(name="domaine_activite", nullable = true, length = 150)
  @Enumerated(EnumType.STRING)  
  private DomaineActivites domaineActivite;

  @Column(name="domaine_activite_nr", nullable = true, length = 500)
  @Enumerated(EnumType.STRING)  
  private DomaineActiviteNr domaineActiviteNr;

  // Relation membres via table de jointure EntrepriseMembre
  @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL, orphanRemoval = true)
  @com.fasterxml.jackson.annotation.JsonIgnore
  private List<EntrepriseMembre> membres = new ArrayList<>();

  @ManyToOne(optional = true)  // Permettre division NULL temporairement
  @JoinColumn(name = "division_id")
  @com.fasterxml.jackson.annotation.JsonIgnore
  private Divisions division;
  
  // Code de division INSTAT (remplace progressivement division_id)
  @Column(name="division_code", nullable = true, length = 20)
  private String divisionCode;
  
  // Champs de localisation spécifique de l'entreprise
  @Column(name="rue", nullable = true, length = 255)
  private String rue;
  
  @Column(name="porte", nullable = true, length = 50)
  private String porte;

  @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL)
  @com.fasterxml.jackson.annotation.JsonIgnore
  private List<Documents> documents = new ArrayList<>();
  
  @OneToOne(mappedBy = "entreprise", cascade = CascadeType.ALL)
  @com.fasterxml.jackson.annotation.JsonIgnore
  private Paiement paiement;

  // Agent assigné pour traiter cette demande
  @ManyToOne
  @JoinColumn(name = "assigned_to")
  private Utilisateurs assignedTo;

  // Utilisateur qui a créé cette entreprise (peut être différent du fondateur)
  @ManyToOne
  @JoinColumn(name = "created_by")
  @com.fasterxml.jackson.annotation.JsonIgnore
  private Utilisateurs createdBy;

  // Etat de bannissement
  @Column(name="banni", nullable = false)
  private Boolean banni = false;

  @Column(name="motif_bannissement", length = 255)
  private String motifBannissement;

  @Column(name="date_bannissement")
  private Instant dateBannissement;

  // Montant total de la demande
  @Column(name="total_amount")
  private BigDecimal totalAmount;
  
  // Antenne responsable de cette entreprise (basée sur la localisation)
  @Column(name="antenne_agent")
  @Enumerated(EnumType.STRING)
  private AntenneAgents antenneAgent;
  
  // Numéro NINA généré par l'API INSTAT Mali
  @Column(name="numero_nina", nullable = true, length = 50)
  private String numeroNina;
  
  // Numéro RCCM généré par le service RCCM-OHADA (ex: ML-BKO-01-2025-A-00010)
  @Column(name="numero_rccm", nullable = true, length = 50)
  private String numeroRccm;

  // Champs pour le workflow d'agrément (autorisation d'exercice)
  @Column(name="numero_autorisation", nullable = true, length = 50)
  private String numeroAutorisation;
  
  @Column(name="date_autorisation", nullable = true)
  private Instant dateAutorisation;
  
  @Column(name="type_agrement", nullable = true, length = 50)
  @Enumerated(EnumType.STRING)
  private abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement typeAgrement;
  
  @Column(name="delai_traitement", nullable = true)
  private Integer delaiTraitement;
  
  @Column(name="avantages_fiscaux", nullable = true)
  private Boolean avantagesFiscaux;
  
  @Column(name="observations", nullable = true, length = 1000)
  private String observations;
  
  // Motif de rejet lors du retour d'une étape précédente
  @Column(name="motif_rejet", nullable = true, length = 1000)
  private String motifRejet;
  
  @Column(name="date_retrait_agrement", nullable = true)
  private Instant dateRetraitAgrement;
  
  // Champs pour tracker les téléchargements de documents par l'utilisateur
  @Column(name="rccm_telecharge", nullable = false)
  private Boolean rccmTelecharge = false;
  
  @Column(name="nina_telecharge", nullable = false)
  private Boolean ninaTelecharge = false;
  
  @Column(name="date_retrait", nullable = true)
  private Instant dateRetrait;
  
  // Champs pour le Code des Investissements - Régime et Type de demande
  @Column(name="regime_investissement", nullable = true, length = 20)
  @Enumerated(EnumType.STRING)
  private abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement regimeInvestissement;
  
  @Column(name="type_demande_agrement", nullable = true, length = 30)
  @Enumerated(EnumType.STRING)
  private abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement typeDemandeAgrement;
  
  @Column(name="montant_frais_depot", nullable = true)
  private Integer montantFraisDepot;
  
  @Column(name="paiement_effectue", nullable = true)
  private Boolean paiementEffectue = false;
  
  @Column(name="agrement_signe_path", nullable = true, length = 500)
  private String agrementSignePath;
  
  @Column(name="telechargement_autorise", nullable = true)
  private Boolean telechargementAutorise = false;

  // Getter et Setter pour telechargementAutorise
  public Boolean getTelechargementAutorise() {
    return telechargementAutorise;
  }

  public void setTelechargementAutorise(Boolean telechargementAutorise) {
    this.telechargementAutorise = telechargementAutorise;
  }

  // Getter et Setter pour paiementEffectue
  public Boolean getPaiementEffectue() {
    return paiementEffectue;
  }

  public void setPaiementEffectue(Boolean paiementEffectue) {
    this.paiementEffectue = paiementEffectue;
  }

  // Getter et Setter pour agrementSignePath
  public String getAgrementSignePath() {
    return agrementSignePath;
  }

  public void setAgrementSignePath(String agrementSignePath) {
    this.agrementSignePath = agrementSignePath;
  }

  // Getter et Setter pour numeroRccm
  public String getNumeroRccm() {
    return numeroRccm;
  }

  public void setNumeroRccm(String numeroRccm) {
    this.numeroRccm = numeroRccm;
  }

  // Getters/Setters manquants
  public TypeEntreprise getTypeEntreprise() { return typeEntreprise; }
  public void setTypeEntreprise(TypeEntreprise typeEntreprise) { this.typeEntreprise = typeEntreprise; }
  
  public FormeJuridique getFormeJuridique() { return formeJuridique; }
  public void setFormeJuridique(FormeJuridique formeJuridique) { this.formeJuridique = formeJuridique; }
  
  public DomaineActivites getDomaineActivite() { return domaineActivite; }
  public void setDomaineActivite(DomaineActivites domaineActivite) { this.domaineActivite = domaineActivite; }
  
  public DomaineActiviteNr getDomaineActiviteNr() { return domaineActiviteNr; }
  public void setDomaineActiviteNr(DomaineActiviteNr domaineActiviteNr) { 
    // Solution de contournement: vérifier la longueur de la valeur enum
    if (domaineActiviteNr != null) {
      String enumValue = domaineActiviteNr.name();
      if (enumValue.length() > 500) {
        System.err.println("⚠️ [ENTREPRISE] domaineActiviteNr trop long (" + enumValue.length() + " chars): " + enumValue);
        // Pour l'instant, on accepte la valeur mais on log l'erreur
        // La troncature sera gérée par la contrainte DB mise à jour
      }
    }
    this.domaineActiviteNr = domaineActiviteNr; 
  }
  
  public StatutCreation getStatutCreation() { return statutCreation; }
  public void setStatutCreation(StatutCreation statutCreation) { this.statutCreation = statutCreation; }
  
  public EtapeValidation getEtapeValidation() { return etapeValidation; }
  public void setEtapeValidation(EtapeValidation etapeValidation) { this.etapeValidation = etapeValidation; }
  
  public Divisions getDivision() { return division; }
  public void setDivision(Divisions division) { this.division = division; }
  
  public String getDivisionCode() { return divisionCode; }
  public void setDivisionCode(String divisionCode) { this.divisionCode = divisionCode; }
  
  public String getNom() { return nom; }
  public void setNom(String nom) { this.nom = nom; }
  
  public String getSigle() { return sigle; }
  public void setSigle(String sigle) { this.sigle = sigle; }
  
  public List<EntrepriseMembre> getMembres() { return membres; }
  public void setMembres(List<EntrepriseMembre> membres) { this.membres = membres; }
  
  public List<Documents> getDocuments() { return documents; }
  public void setDocuments(List<Documents> documents) { this.documents = documents; }
  
  // Getters/Setters supplémentaires manquants
  public String getReference() { return reference; }
  public void setReference(String reference) { this.reference = reference; }
  
  public BigDecimal getCapitale() { return capitale; }
  public void setCapitale(BigDecimal capitale) { this.capitale = capitale; }
  
  public String getActiviteSecondaire() { return activiteSecondaire; }
  public void setActiviteSecondaire(String activiteSecondaire) { this.activiteSecondaire = activiteSecondaire; }
  
  public Boolean getStatutSociete() { return StatutSociete; }
  public void setStatutSociete(Boolean statutSociete) { StatutSociete = statutSociete; }
  
  public Boolean getAdresseDifferentIdentite() { return adresseDifferentIdentite; }
  public void setAdresseDifferentIdentite(Boolean adresseDifferentIdentite) { this.adresseDifferentIdentite = adresseDifferentIdentite; }
  
  public Boolean getExtraitJudiciaire() { return extraitJudiciaire; }
  public void setExtraitJudiciaire(Boolean extraitJudiciaire) { this.extraitJudiciaire = extraitJudiciaire; }
  
  public Boolean getAutorisationExercice() { return autorisationExercice; }
  public void setAutorisationExercice(Boolean autorisationExercice) { this.autorisationExercice = autorisationExercice; }
  
  public Boolean getImportExport() { return importExport; }
  public void setImportExport(Boolean importExport) { this.importExport = importExport; }
  
  // Champs temporaires supprimés pour éviter les doublons
  
  public Utilisateurs getAssignedTo() { return assignedTo; }
  public void setAssignedTo(Utilisateurs assignedTo) { this.assignedTo = assignedTo; }
  
  public Boolean getBanni() { return banni; }
  public void setBanni(Boolean banni) { this.banni = banni; }
  
  public String getMotifBannissement() { return motifBannissement; }
  public void setMotifBannissement(String motifBannissement) { this.motifBannissement = motifBannissement; }
  
  public Instant getDateBannissement() { return dateBannissement; }
  public void setDateBannissement(Instant dateBannissement) { this.dateBannissement = dateBannissement; }
  
  public AntenneAgents getAntenneAgent() { return antenneAgent; }
  public void setAntenneAgent(AntenneAgents antenneAgent) { this.antenneAgent = antenneAgent; }
  
  public String getNumeroNina() { return numeroNina; }
  public void setNumeroNina(String numeroNina) { this.numeroNina = numeroNina; }
  
  public Paiement getPaiement() { return paiement; }
  public void setPaiement(Paiement paiement) { this.paiement = paiement; }
  
  public Boolean getRccmTelecharge() { return rccmTelecharge; }
  public void setRccmTelecharge(Boolean rccmTelecharge) { this.rccmTelecharge = rccmTelecharge; }
  
  // Getters/setters supplémentaires pour les champs manquants (suppression des doublons)
  
  public Boolean getNinaTelecharge() { return ninaTelecharge; }
  public void setNinaTelecharge(Boolean ninaTelecharge) { this.ninaTelecharge = ninaTelecharge; }
  
  public String getNumeroAutorisation() { return numeroAutorisation; }
  public void setNumeroAutorisation(String numeroAutorisation) { this.numeroAutorisation = numeroAutorisation; }
  
  public java.time.Instant getDateAutorisation() { return dateAutorisation; }
  public void setDateAutorisation(java.time.Instant dateAutorisation) { this.dateAutorisation = dateAutorisation; }
  
  public abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement getTypeAgrement() { return typeAgrement; }
  public void setTypeAgrement(abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement typeAgrement) { this.typeAgrement = typeAgrement; }
  
  public Integer getDelaiTraitement() { return delaiTraitement; }
  public void setDelaiTraitement(Integer delaiTraitement) { this.delaiTraitement = delaiTraitement; }
  
  public Boolean getAvantagesFiscaux() { return avantagesFiscaux; }
  public void setAvantagesFiscaux(Boolean avantagesFiscaux) { this.avantagesFiscaux = avantagesFiscaux; }
  
  public String getObservations() { return observations; }
  public void setObservations(String observations) { this.observations = observations; }
  
  public Instant getDateRetraitAgrement() { return dateRetraitAgrement; }
  public void setDateRetraitAgrement(Instant dateRetraitAgrement) { this.dateRetraitAgrement = dateRetraitAgrement; }
  
  // Getters/setters pour typeDemandeAgrement et autres champs manquants
  public abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement getTypeDemandeAgrement() { 
    return typeDemandeAgrement; 
  }
  public void setTypeDemandeAgrement(abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement typeDemandeAgrement) { 
    this.typeDemandeAgrement = typeDemandeAgrement; 
  }
  
  public abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement getRegimeInvestissement() { 
    return regimeInvestissement; 
  }
  public void setRegimeInvestissement(abdaty_technologie.API_Invest.Entity.Enum.RegimeInvestissement regimeInvestissement) { 
    this.regimeInvestissement = regimeInvestissement; 
  }
  
  public Integer getMontantFraisDepot() { return montantFraisDepot; }
  public void setMontantFraisDepot(Integer montantFraisDepot) { this.montantFraisDepot = montantFraisDepot; }
  
  public Boolean getAutorisationGerant() { return autorisationGerant; }
  public void setAutorisationGerant(Boolean autorisationGerant) { this.autorisationGerant = autorisationGerant; }

  // Getters/setters pour les champs existants (pas de duplication)
  public Utilisateurs getCreatedBy() { return createdBy; }
  public void setCreatedBy(Utilisateurs createdBy) { this.createdBy = createdBy; }
  
  public java.time.Instant getDateRetrait() { return dateRetrait; }
  public void setDateRetrait(java.time.Instant dateRetrait) { this.dateRetrait = dateRetrait; }
  
  public BigDecimal getTotalAmount() { return totalAmount; }
  public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
  
  // Override des méthodes héritées de BaseEntity pour éviter les erreurs
  @Override
  public String getId() { return super.getId(); }
  
  @Override
  public void setId(String id) { super.setId(id); }
  
  @Override
  public Instant getCreation() { return super.getCreation(); }
  
  @Override
  public void setCreation(Instant creation) { super.setCreation(creation); }
  
  @Override
  public Instant getModification() { return super.getModification(); }
  
  @Override
  public void setModification(Instant modification) { super.setModification(modification); }
  
  // Getters/setters pour les champs rue et porte
  public String getRue() { return rue; }
  public void setRue(String rue) { this.rue = rue; }
  
  public String getMotifRejet() { return motifRejet; }
  public void setMotifRejet(String motifRejet) { this.motifRejet = motifRejet; }
  
  public String getPorte() { return porte; }
  public void setPorte(String porte) { this.porte = porte; }
}

