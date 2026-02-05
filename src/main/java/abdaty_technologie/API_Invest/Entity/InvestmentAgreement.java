package abdaty_technologie.API_Invest.Entity;

import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "investment_agreements")
public class InvestmentAgreement {
    
    @Id
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;
    
    private String referenceNumber;
    private String userId;
    private StatutCreation statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    
    // Méthodes pour compatibilité avec Entreprise
    public LocalDateTime getCreatedAt() {
        return dateCreation;
    }
    
    public LocalDateTime getUpdatedAt() {
        return dateModification;
    }
    
    // Getter and setter methods for embedded objects
    public PromoteurInfo getPromoteur() {
        return promoteur;
    }
    
    public void setPromoteur(PromoteurInfo promoteur) {
        this.promoteur = promoteur;
    }
    
    public ProjectIdentification getIdentification() {
        return identification;
    }
    
    public void setIdentification(ProjectIdentification identification) {
        this.identification = identification;
    }
    
    public ProjectCharacteristics getCaracteristiques() {
        return caracteristiques;
    }
    
    public void setCaracteristiques(ProjectCharacteristics caracteristiques) {
        this.caracteristiques = caracteristiques;
    }
    
    // Basic field getter and setter methods
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getReferenceNumber() {
        return referenceNumber;
    }
    
    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public StatutCreation getStatut() {
        return statut;
    }
    
    public void setStatut(StatutCreation statut) {
        this.statut = statut;
    }
    
    public LocalDateTime getDateCreation() {
        return dateCreation;
    }
    
    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
    
    public LocalDateTime getDateModification() {
        return dateModification;
    }
    
    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
    }
    
    public String getRegimeSollicite() {
        return regimeSollicite;
    }
    
    public void setRegimeSollicite(String regimeSollicite) {
        this.regimeSollicite = regimeSollicite;
    }
    
    public String getObservations() {
        return observations;
    }
    
    public void setObservations(String observations) {
        this.observations = observations;
    }
    
    public LocalDateTime getDateTraitement() {
        return dateTraitement;
    }
    
    public void setDateTraitement(LocalDateTime dateTraitement) {
        this.dateTraitement = dateTraitement;
    }
    
    public String getAgentTraitant() {
        return agentTraitant;
    }
    
    public void setAgentTraitant(String agentTraitant) {
        this.agentTraitant = agentTraitant;
    }
    
    // Promoteur information
    @Embedded
    private PromoteurInfo promoteur;
    
    // Project identification
    @Embedded
    private ProjectIdentification identification;
    
    // Project characteristics
    @Embedded
    private ProjectCharacteristics caracteristiques;
    
    // Regime sollicité
    private String regimeSollicite; // A, B, C, D, ZONES_ECONOMIQUES
    
    // Administrative fields
    private String observations;
    private LocalDateTime dateTraitement;
    private String agentTraitant;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class PromoteurInfo {
        @Column(name = "promoteur_nom")
        private String nom;
        @Column(name = "promoteur_nationalite")
        private String nationalite;
        @Column(name = "promoteur_adresse")
        private String adresse;
        
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getNationalite() { return nationalite; }
        public void setNationalite(String nationalite) { this.nationalite = nationalite; }
        public String getAdresse() { return adresse; }
        public void setAdresse(String adresse) { this.adresse = adresse; }
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class ProjectIdentification {
        @Column(name = "nom_raison_sociale")
        private String nomRaisonSociale;
        @Column(name = "activite")
        private String activite;
        @Column(name = "forme_juridique")
        private String formeJuridique;
        @Column(name = "localisation")
        private String localisation;
        @Column(name = "adresse")
        private String adresse;
        
        public String getNomRaisonSociale() { return nomRaisonSociale; }
        public void setNomRaisonSociale(String nomRaisonSociale) { this.nomRaisonSociale = nomRaisonSociale; }
        public String getActivite() { return activite; }
        public void setActivite(String activite) { this.activite = activite; }
        public String getFormeJuridique() { return formeJuridique; }
        public void setFormeJuridique(String formeJuridique) { this.formeJuridique = formeJuridique; }
        public String getLocalisation() { return localisation; }
        public void setLocalisation(String localisation) { this.localisation = localisation; }
        public String getAdresse() { return adresse; }
        public void setAdresse(String adresse) { this.adresse = adresse; }
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class ProjectCharacteristics {
        @Embedded
        private InvestmentDetails investissements;
        @Embedded
        private FinancingPlan planFinancement;
        @Embedded
        private ParticipationRates participation;
        @Embedded
        private Employment emplois;
        @Column(name = "taux_valeur_ajoutee")
        private Double tauxValeurAjoutee;
        @Column(name = "capacite_production")
        private String capaciteProduction;
        @Embedded
        private MarketTargets marche;
        
        public InvestmentDetails getInvestissements() { return investissements; }
        public void setInvestissements(InvestmentDetails investissements) { this.investissements = investissements; }
        public FinancingPlan getPlanFinancement() { return planFinancement; }
        public void setPlanFinancement(FinancingPlan planFinancement) { this.planFinancement = planFinancement; }
        public ParticipationRates getParticipation() { return participation; }
        public void setParticipation(ParticipationRates participation) { this.participation = participation; }
        public Employment getEmplois() { return emplois; }
        public void setEmplois(Employment emplois) { this.emplois = emplois; }
        public Double getTauxValeurAjoutee() { return tauxValeurAjoutee; }
        public void setTauxValeurAjoutee(Double tauxValeurAjoutee) { this.tauxValeurAjoutee = tauxValeurAjoutee; }
        public String getCapaciteProduction() { return capaciteProduction; }
        public void setCapaciteProduction(String capaciteProduction) { this.capaciteProduction = capaciteProduction; }
        public MarketTargets getMarche() { return marche; }
        public void setMarche(MarketTargets marche) { this.marche = marche; }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Embeddable
        public static class InvestmentDetails {
            @Column(name = "investissement_total")
            private Double total;
            @Column(name = "investissement_immobilisations")
            private Double immobilisations;
            @Column(name = "investissement_fonds_roulement")
            private Double fondsRoulement;
            
            public Double getTotal() { return total; }
            public void setTotal(Double total) { this.total = total; }
            public Double getImmobilisations() { return immobilisations; }
            public void setImmobilisations(Double immobilisations) { this.immobilisations = immobilisations; }
            public Double getFondsRoulement() { return fondsRoulement; }
            public void setFondsRoulement(Double fondsRoulement) { this.fondsRoulement = fondsRoulement; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Embeddable
        public static class FinancingPlan {
            @Column(name = "financement_fonds_propres")
            private Double fondsPropres;
            @Column(name = "financement_credits")
            private Double credits;
            @Column(name = "financement_autres")
            private Double autres;
            
            public Double getFondsPropres() { return fondsPropres; }
            public void setFondsPropres(Double fondsPropres) { this.fondsPropres = fondsPropres; }
            public Double getCredits() { return credits; }
            public void setCredits(Double credits) { this.credits = credits; }
            public Double getAutres() { return autres; }
            public void setAutres(Double autres) { this.autres = autres; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Embeddable
        public static class ParticipationRates {
            @Column(name = "participation_taux_nationaux")
            private Double tauxNationaux;
            @Column(name = "participation_taux_expatries")
            private Double tauxExpatries;
            
            public Double getTauxNationaux() { return tauxNationaux; }
            public void setTauxNationaux(Double tauxNationaux) { this.tauxNationaux = tauxNationaux; }
            public Double getTauxExpatries() { return tauxExpatries; }
            public void setTauxExpatries(Double tauxExpatries) { this.tauxExpatries = tauxExpatries; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Embeddable
        public static class Employment {
            @Column(name = "emploi_nationaux")
            private Integer nationaux;
            @Column(name = "emploi_expatries")
            private Integer expatries;
            
            public Integer getNationaux() { return nationaux; }
            public void setNationaux(Integer nationaux) { this.nationaux = nationaux; }
            public Integer getExpatries() { return expatries; }
            public void setExpatries(Integer expatries) { this.expatries = expatries; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Embeddable
        public static class MarketTargets {
            @Column(name = "marche_local")
            private Double local;
            @Column(name = "marche_exterieur")
            private Double exterieur;
            
            public Double getLocal() { return local; }
            public void setLocal(Double local) { this.local = local; }
            public Double getExterieur() { return exterieur; }
            public void setExterieur(Double exterieur) { this.exterieur = exterieur; }
        }
    }
}
