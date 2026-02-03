package abdaty_technologie.API_Invest.Entity;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import abdaty_technologie.API_Invest.Entity.Enum.Nationalites;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales;
import abdaty_technologie.API_Invest.Entity.Enum.PaysEmissionRccM;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.validation.constraints.NotEmpty;
@Entity
public class Persons extends BaseEntity {

    @Column(name="nom", nullable = false, length = 100)
    @NotEmpty
    private String nom; 
    
    @Column(name="prenom", nullable = false)
    @NotEmpty
    private String prenom; 
    
    @Column(name="email", nullable = true, unique = true)
    private String email;
    
    @Column(name="telephone1", nullable = false, unique = true)
    private String telephone1; 
    
    @Column(name="telephone2", nullable = true, unique = true)
    private String telephone2;

    @Column(name="date_naissance", nullable = true)
    private Date dateNaissance;
    
    @Column(name="lieu_naissance", nullable = true)
    private String lieuNaissance;

    @Column(name="localite", nullable = true, length = 255)
    private String localite;

    @Column(name="porte", nullable = true, length = 50)
    private String porte;

    @Column(name="adresse_libre", nullable = true, length = 500)
    private String adresseLibre;

    @Column(name="est_autoriser", nullable = true)
    private Boolean estAutoriser;

    @Column(name="nationalite", nullable = true)
    @Enumerated(EnumType.STRING) 
    private Nationalites nationalite;
    
    @Column(name="entreprise_role", nullable = true, length = 20)
    @Enumerated(EnumType.STRING)
    private EntrepriseRole entrepriseRole;
    
    @Column(name = "antenne_agent", nullable = true)
    @Enumerated(EnumType.STRING)
    private AntenneAgents antenneAgent;
    
    @Column(name="sexe", nullable = true)
    @Enumerated(EnumType.STRING)
    private Sexes sexe;
    
    @Column(name="situation_matrimoniale", nullable = true)
    @Enumerated(EnumType.STRING)
    private SituationMatrimoniales situationMatrimoniale;
    
    @Column(name="civilite", nullable = true, length = 20)
    @Enumerated(EnumType.STRING)
    private Civilites civilite;
    
    @Column(name="role", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Roles role;

    @ManyToOne(optional = true)
    @JoinColumn(name = "division_id")
    private Divisions division;
    
    // Code de division INSTAT (remplace progressivement division_id)
    @Column(name="division_code", nullable = true, length = 20)
    private String divisionCode;
    
    // Champs spécifiques aux personnes morales
    @Column(name="pays_emission_rccm", nullable = true)
    @Enumerated(EnumType.STRING)
    private PaysEmissionRccM paysEmissionRccm;
    
    @Column(name="denomination_entreprise", nullable = true, length = 255)
    private String denominationEntreprise;

    @JsonIgnore
    @OneToMany(mappedBy = "personne", cascade = CascadeType.ALL) 
    private List<Documents> documents = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "personne", cascade = CascadeType.ALL) 
    private List<Paiement> paiements = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "personne", cascade = CascadeType.ALL) 
    private Utilisateurs utilisateur;
    
    // Liens d'appartenance à des entreprises via la table de jointure
    @OneToMany(mappedBy = "personne", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntrepriseMembre> entreprises = new ArrayList<>();

    // Conjoints (pour les personnes mariées)
    @JsonIgnore
    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Conjoint> conjoints = new ArrayList<>();

    // Getters and Setters
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getTelephone1() { return telephone1; }
    public void setTelephone1(String telephone1) { this.telephone1 = telephone1; }
    
    public String getTelephone2() { return telephone2; }
    public void setTelephone2(String telephone2) { this.telephone2 = telephone2; }
    
    public Date getDateNaissance() { return dateNaissance; }
    public void setDateNaissance(Date dateNaissance) { this.dateNaissance = dateNaissance; }
    
    public String getLieuNaissance() { return lieuNaissance; }
    public void setLieuNaissance(String lieuNaissance) { this.lieuNaissance = lieuNaissance; }
    
    public String getLocalite() { return localite; }
    public void setLocalite(String localite) { this.localite = localite; }
    
    public String getPorte() { return porte; }
    public void setPorte(String porte) { this.porte = porte; }
    
    public String getAdresseLibre() { return adresseLibre; }
    public void setAdresseLibre(String adresseLibre) { this.adresseLibre = adresseLibre; }
    
    public Boolean getEstAutoriser() { return estAutoriser; }
    public void setEstAutoriser(Boolean estAutoriser) { this.estAutoriser = estAutoriser; }
    
    public Nationalites getNationalite() { return nationalite; }
    public void setNationalite(Nationalites nationalite) { this.nationalite = nationalite; }
    
    public EntrepriseRole getEntrepriseRole() { return entrepriseRole; }
    public void setEntrepriseRole(EntrepriseRole entrepriseRole) { this.entrepriseRole = entrepriseRole; }
    
    public AntenneAgents getAntenneAgent() { return antenneAgent; }
    public void setAntenneAgent(AntenneAgents antenneAgent) { this.antenneAgent = antenneAgent; }
    
    public Sexes getSexe() { return sexe; }
    public void setSexe(Sexes sexe) { this.sexe = sexe; }
    
    public SituationMatrimoniales getSituationMatrimoniale() { return situationMatrimoniale; }
    public void setSituationMatrimoniale(SituationMatrimoniales situationMatrimoniale) { this.situationMatrimoniale = situationMatrimoniale; }
    
    public Civilites getCivilite() { return civilite; }
    public void setCivilite(Civilites civilite) { this.civilite = civilite; }
    
    public Roles getRole() { return role; }
    public void setRole(Roles role) { this.role = role; }
    
    public Divisions getDivision() { return division; }
    public void setDivision(Divisions division) { this.division = division; }
    
    public String getDivisionCode() { return divisionCode; }
    public void setDivisionCode(String divisionCode) { this.divisionCode = divisionCode; }
    
    public PaysEmissionRccM getPaysEmissionRccm() { return paysEmissionRccm; }
    public void setPaysEmissionRccm(PaysEmissionRccM paysEmissionRccm) { this.paysEmissionRccm = paysEmissionRccm; }
    
    public String getDenominationEntreprise() { return denominationEntreprise; }
    public void setDenominationEntreprise(String denominationEntreprise) { this.denominationEntreprise = denominationEntreprise; }
    
    public List<Documents> getDocuments() { return documents; }
    public void setDocuments(List<Documents> documents) { this.documents = documents; }
    
    public List<Paiement> getPaiements() { return paiements; }
    public void setPaiements(List<Paiement> paiements) { this.paiements = paiements; }
    
    public Utilisateurs getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateurs utilisateur) { this.utilisateur = utilisateur; }
    
    public List<EntrepriseMembre> getEntreprises() { return entreprises; }
    public void setEntreprises(List<EntrepriseMembre> entreprises) { this.entreprises = entreprises; }
    
    public List<Conjoint> getConjoints() { return conjoints; }
    public void setConjoints(List<Conjoint> conjoints) { this.conjoints = conjoints; }
}

