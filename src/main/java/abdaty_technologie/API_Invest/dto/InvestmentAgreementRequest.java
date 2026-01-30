<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentAgreementRequest {
    
    @Valid
    @NotNull(message = "Les informations du promoteur sont requises")
    private PromoteurDto promoteur;
    
    @Valid
    @NotNull(message = "L'identification du projet est requise")
    private IdentificationDto identification;
    
    @Valid
    @NotNull(message = "Les caractéristiques du projet sont requises")
    private CaracteristiquesDto caracteristiques;
    
    @NotBlank(message = "Le régime sollicité est requis")
    @Pattern(regexp = "A|B|C|D|ZONES_ECONOMIQUES", message = "Régime invalide")
    private String regimeSollicite;
    
    private String statut = "EN_COURS";
    private String dateCreation;
    
    // Getter and setter methods
    public PromoteurDto getPromoteur() {
        return promoteur;
    }
    
    public void setPromoteur(PromoteurDto promoteur) {
        this.promoteur = promoteur;
    }
    
    public IdentificationDto getIdentification() {
        return identification;
    }
    
    public void setIdentification(IdentificationDto identification) {
        this.identification = identification;
    }
    
    public CaracteristiquesDto getCaracteristiques() {
        return caracteristiques;
    }
    
    public void setCaracteristiques(CaracteristiquesDto caracteristiques) {
        this.caracteristiques = caracteristiques;
    }
    
    public String getRegimeSollicite() {
        return regimeSollicite;
    }
    
    public void setRegimeSollicite(String regimeSollicite) {
        this.regimeSollicite = regimeSollicite;
    }
    
    public String getStatut() {
        return statut;
    }
    
    public void setStatut(String statut) {
        this.statut = statut;
    }
    
    public String getDateCreation() {
        return dateCreation;
    }
    
    public void setDateCreation(String dateCreation) {
        this.dateCreation = dateCreation;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromoteurDto {
        @NotBlank(message = "Le nom du promoteur est requis")
        private String nom;
        
        @NotBlank(message = "La nationalité est requise")
        private String nationalite;
        
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
    public static class IdentificationDto {
        @NotBlank(message = "Le nom ou raison sociale est requis")
        private String nomRaisonSociale;
        
        @NotBlank(message = "L'activité est requise")
        private String activite;
        
        @NotBlank(message = "La forme juridique est requise")
        private String formeJuridique;
        
        @NotBlank(message = "La localisation est requise")
        private String localisation;
        
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
    public static class CaracteristiquesDto {
        @Valid
        @NotNull(message = "Les détails d'investissement sont requis")
        private InvestissementsDto investissements;
        
        @Valid
        @NotNull(message = "Le plan de financement est requis")
        private PlanFinancementDto planFinancement;
        
        @Valid
        @NotNull(message = "Les taux de participation sont requis")
        private ParticipationDto participation;
        
        @Valid
        @NotNull(message = "Les informations d'emploi sont requises")
        private EmploisDto emplois;
        
        @DecimalMin(value = "0.0", message = "Le taux de valeur ajoutée doit être positif")
        @DecimalMax(value = "100.0", message = "Le taux de valeur ajoutée ne peut pas dépasser 100%")
        private Double tauxValeurAjoutee;
        
        private String capaciteProduction;
        
        @Valid
        @NotNull(message = "Les informations de marché sont requises")
        private MarcheDto marche;
        
        public InvestissementsDto getInvestissements() { return investissements; }
        public void setInvestissements(InvestissementsDto investissements) { this.investissements = investissements; }
        public PlanFinancementDto getPlanFinancement() { return planFinancement; }
        public void setPlanFinancement(PlanFinancementDto planFinancement) { this.planFinancement = planFinancement; }
        public ParticipationDto getParticipation() { return participation; }
        public void setParticipation(ParticipationDto participation) { this.participation = participation; }
        public EmploisDto getEmplois() { return emplois; }
        public void setEmplois(EmploisDto emplois) { this.emplois = emplois; }
        public Double getTauxValeurAjoutee() { return tauxValeurAjoutee; }
        public void setTauxValeurAjoutee(Double tauxValeurAjoutee) { this.tauxValeurAjoutee = tauxValeurAjoutee; }
        public String getCapaciteProduction() { return capaciteProduction; }
        public void setCapaciteProduction(String capaciteProduction) { this.capaciteProduction = capaciteProduction; }
        public MarcheDto getMarche() { return marche; }
        public void setMarche(MarcheDto marche) { this.marche = marche; }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class InvestissementsDto {
            @NotNull(message = "L'investissement total est requis")
            @DecimalMin(value = "0.0", message = "L'investissement total doit être positif")
            private Double total;
            
            @NotNull(message = "Les immobilisations sont requises")
            @DecimalMin(value = "0.0", message = "Les immobilisations doivent être positives")
            private Double immobilisations;
            
            @NotNull(message = "Le fonds de roulement est requis")
            @DecimalMin(value = "0.0", message = "Le fonds de roulement doit être positif")
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
        public static class PlanFinancementDto {
            @NotNull(message = "Les fonds propres sont requis")
            @DecimalMin(value = "0.0", message = "Les fonds propres doivent être positifs")
            private Double fondsPropres;
            
            @DecimalMin(value = "0.0", message = "Les crédits doivent être positifs")
            private Double credits = 0.0;
            
            @DecimalMin(value = "0.0", message = "Les autres financements doivent être positifs")
            private Double autres = 0.0;
            
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
        public static class ParticipationDto {
            @NotNull(message = "Le taux de participation des nationaux est requis")
            @DecimalMin(value = "0.0", message = "Le taux de participation des nationaux doit être positif")
            @DecimalMax(value = "100.0", message = "Le taux de participation des nationaux ne peut pas dépasser 100%")
            private Double tauxNationaux;
            
            @DecimalMin(value = "0.0", message = "Le taux de participation des expatriés doit être positif")
            @DecimalMax(value = "100.0", message = "Le taux de participation des expatriés ne peut pas dépasser 100%")
            private Double tauxExpatries = 0.0;
            
            public Double getTauxNationaux() { return tauxNationaux; }
            public void setTauxNationaux(Double tauxNationaux) { this.tauxNationaux = tauxNationaux; }
            public Double getTauxExpatries() { return tauxExpatries; }
            public void setTauxExpatries(Double tauxExpatries) { this.tauxExpatries = tauxExpatries; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class EmploisDto {
            @Min(value = 0, message = "Le nombre d'emplois nationaux doit être positif")
            private Integer nationaux = 0;
            
            @Min(value = 0, message = "Le nombre d'emplois expatriés doit être positif")
            private Integer expatries = 0;
            
            public Integer getNationaux() { return nationaux; }
            public void setNationaux(Integer nationaux) { this.nationaux = nationaux; }
            public Integer getExpatries() { return expatries; }
            public void setExpatries(Integer expatries) { this.expatries = expatries; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class MarcheDto {
            @NotNull(message = "La part de marché local est requise")
            @DecimalMin(value = "0.0", message = "La part de marché local doit être positive")
            @DecimalMax(value = "100.0", message = "La part de marché local ne peut pas dépasser 100%")
            private Double local;
            
            @DecimalMin(value = "0.0", message = "La part de marché extérieur doit être positive")
            @DecimalMax(value = "100.0", message = "La part de marché extérieur ne peut pas dépasser 100%")
            private Double exterieur = 0.0;
            
            public Double getLocal() { return local; }
            public void setLocal(Double local) { this.local = local; }
            public Double getExterieur() { return exterieur; }
            public void setExterieur(Double exterieur) { this.exterieur = exterieur; }
        }
    }
}
=======
package abdaty_technologie.API_Invest.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentAgreementRequest {
    
    @Valid
    @NotNull(message = "Les informations du promoteur sont requises")
    private PromoteurDto promoteur;
    
    @Valid
    @NotNull(message = "L'identification du projet est requise")
    private IdentificationDto identification;
    
    @Valid
    @NotNull(message = "Les caractéristiques du projet sont requises")
    private CaracteristiquesDto caracteristiques;
    
    @NotBlank(message = "Le régime sollicité est requis")
    @Pattern(regexp = "A|B|C|D|ZONES_ECONOMIQUES", message = "Régime invalide")
    private String regimeSollicite;
    
    private String statut = "EN_COURS";
    private String dateCreation;
    
    // Getter and setter methods
    public PromoteurDto getPromoteur() {
        return promoteur;
    }
    
    public void setPromoteur(PromoteurDto promoteur) {
        this.promoteur = promoteur;
    }
    
    public IdentificationDto getIdentification() {
        return identification;
    }
    
    public void setIdentification(IdentificationDto identification) {
        this.identification = identification;
    }
    
    public CaracteristiquesDto getCaracteristiques() {
        return caracteristiques;
    }
    
    public void setCaracteristiques(CaracteristiquesDto caracteristiques) {
        this.caracteristiques = caracteristiques;
    }
    
    public String getRegimeSollicite() {
        return regimeSollicite;
    }
    
    public void setRegimeSollicite(String regimeSollicite) {
        this.regimeSollicite = regimeSollicite;
    }
    
    public String getStatut() {
        return statut;
    }
    
    public void setStatut(String statut) {
        this.statut = statut;
    }
    
    public String getDateCreation() {
        return dateCreation;
    }
    
    public void setDateCreation(String dateCreation) {
        this.dateCreation = dateCreation;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromoteurDto {
        @NotBlank(message = "Le nom du promoteur est requis")
        private String nom;
        
        @NotBlank(message = "La nationalité est requise")
        private String nationalite;
        
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
    public static class IdentificationDto {
        @NotBlank(message = "Le nom ou raison sociale est requis")
        private String nomRaisonSociale;
        
        @NotBlank(message = "L'activité est requise")
        private String activite;
        
        @NotBlank(message = "La forme juridique est requise")
        private String formeJuridique;
        
        @NotBlank(message = "La localisation est requise")
        private String localisation;
        
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
    public static class CaracteristiquesDto {
        @Valid
        @NotNull(message = "Les détails d'investissement sont requis")
        private InvestissementsDto investissements;
        
        @Valid
        @NotNull(message = "Le plan de financement est requis")
        private PlanFinancementDto planFinancement;
        
        @Valid
        @NotNull(message = "Les taux de participation sont requis")
        private ParticipationDto participation;
        
        @Valid
        @NotNull(message = "Les informations d'emploi sont requises")
        private EmploisDto emplois;
        
        @DecimalMin(value = "0.0", message = "Le taux de valeur ajoutée doit être positif")
        @DecimalMax(value = "100.0", message = "Le taux de valeur ajoutée ne peut pas dépasser 100%")
        private Double tauxValeurAjoutee;
        
        private String capaciteProduction;
        
        @Valid
        @NotNull(message = "Les informations de marché sont requises")
        private MarcheDto marche;
        
        public InvestissementsDto getInvestissements() { return investissements; }
        public void setInvestissements(InvestissementsDto investissements) { this.investissements = investissements; }
        public PlanFinancementDto getPlanFinancement() { return planFinancement; }
        public void setPlanFinancement(PlanFinancementDto planFinancement) { this.planFinancement = planFinancement; }
        public ParticipationDto getParticipation() { return participation; }
        public void setParticipation(ParticipationDto participation) { this.participation = participation; }
        public EmploisDto getEmplois() { return emplois; }
        public void setEmplois(EmploisDto emplois) { this.emplois = emplois; }
        public Double getTauxValeurAjoutee() { return tauxValeurAjoutee; }
        public void setTauxValeurAjoutee(Double tauxValeurAjoutee) { this.tauxValeurAjoutee = tauxValeurAjoutee; }
        public String getCapaciteProduction() { return capaciteProduction; }
        public void setCapaciteProduction(String capaciteProduction) { this.capaciteProduction = capaciteProduction; }
        public MarcheDto getMarche() { return marche; }
        public void setMarche(MarcheDto marche) { this.marche = marche; }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class InvestissementsDto {
            @NotNull(message = "L'investissement total est requis")
            @DecimalMin(value = "0.0", message = "L'investissement total doit être positif")
            private Double total;
            
            @NotNull(message = "Les immobilisations sont requises")
            @DecimalMin(value = "0.0", message = "Les immobilisations doivent être positives")
            private Double immobilisations;
            
            @NotNull(message = "Le fonds de roulement est requis")
            @DecimalMin(value = "0.0", message = "Le fonds de roulement doit être positif")
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
        public static class PlanFinancementDto {
            @NotNull(message = "Les fonds propres sont requis")
            @DecimalMin(value = "0.0", message = "Les fonds propres doivent être positifs")
            private Double fondsPropres;
            
            @DecimalMin(value = "0.0", message = "Les crédits doivent être positifs")
            private Double credits = 0.0;
            
            @DecimalMin(value = "0.0", message = "Les autres financements doivent être positifs")
            private Double autres = 0.0;
            
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
        public static class ParticipationDto {
            @NotNull(message = "Le taux de participation des nationaux est requis")
            @DecimalMin(value = "0.0", message = "Le taux de participation des nationaux doit être positif")
            @DecimalMax(value = "100.0", message = "Le taux de participation des nationaux ne peut pas dépasser 100%")
            private Double tauxNationaux;
            
            @DecimalMin(value = "0.0", message = "Le taux de participation des expatriés doit être positif")
            @DecimalMax(value = "100.0", message = "Le taux de participation des expatriés ne peut pas dépasser 100%")
            private Double tauxExpatries = 0.0;
            
            public Double getTauxNationaux() { return tauxNationaux; }
            public void setTauxNationaux(Double tauxNationaux) { this.tauxNationaux = tauxNationaux; }
            public Double getTauxExpatries() { return tauxExpatries; }
            public void setTauxExpatries(Double tauxExpatries) { this.tauxExpatries = tauxExpatries; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class EmploisDto {
            @Min(value = 0, message = "Le nombre d'emplois nationaux doit être positif")
            private Integer nationaux = 0;
            
            @Min(value = 0, message = "Le nombre d'emplois expatriés doit être positif")
            private Integer expatries = 0;
            
            public Integer getNationaux() { return nationaux; }
            public void setNationaux(Integer nationaux) { this.nationaux = nationaux; }
            public Integer getExpatries() { return expatries; }
            public void setExpatries(Integer expatries) { this.expatries = expatries; }
        }
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class MarcheDto {
            @NotNull(message = "La part de marché local est requise")
            @DecimalMin(value = "0.0", message = "La part de marché local doit être positive")
            @DecimalMax(value = "100.0", message = "La part de marché local ne peut pas dépasser 100%")
            private Double local;
            
            @DecimalMin(value = "0.0", message = "La part de marché extérieur doit être positive")
            @DecimalMax(value = "100.0", message = "La part de marché extérieur ne peut pas dépasser 100%")
            private Double exterieur = 0.0;
            
            public Double getLocal() { return local; }
            public void setLocal(Double local) { this.local = local; }
            public Double getExterieur() { return exterieur; }
            public void setExterieur(Double exterieur) { this.exterieur = exterieur; }
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
