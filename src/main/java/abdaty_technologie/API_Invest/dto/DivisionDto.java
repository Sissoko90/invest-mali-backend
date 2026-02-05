package abdaty_technologie.API_Invest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO unifié pour les divisions administratives
 * Compatible avec l'ancien système basé sur la table divisions
 * Utilise maintenant l'API INSTAT Mali comme source de données
 */
public class DivisionDto {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("code")
    private String code;
    
    @JsonProperty("nom")
    private String nom;
    
    @JsonProperty("libelle")
    private String libelle;
    
    @JsonProperty("type")
    private String type; // REGION, CERCLE, COMMUNE, QUARTIER
    
    @JsonProperty("parentId")
    private String parentId;
    
    @JsonProperty("parentCode")
    private String parentCode;
    
    @JsonProperty("parentNom")
    private String parentNom;
    
    // Hiérarchie complète pour compatibilité
    @JsonProperty("regionId")
    private String regionId;
    
    @JsonProperty("regionCode")
    private String regionCode;
    
    @JsonProperty("regionNom")
    private String regionNom;
    
    @JsonProperty("cercleId")
    private String cercleId;
    
    @JsonProperty("cercleCode")
    private String cercleCode;
    
    @JsonProperty("cercleNom")
    private String cercleNom;
    
    @JsonProperty("communeId")
    private String communeId;
    
    @JsonProperty("communeCode")
    private String communeCode;
    
    @JsonProperty("communeNom")
    private String communeNom;
    
    // Constructeurs
    public DivisionDto() {}
    
    public DivisionDto(String id, String code, String nom, String type) {
        this.id = id;
        this.code = code;
        this.nom = nom;
        this.libelle = nom;
        this.type = type;
    }
    
    // Getters et Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getNom() {
        return nom;
    }
    
    public void setNom(String nom) {
        this.nom = nom;
    }
    
    public String getLibelle() {
        return libelle;
    }
    
    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getParentId() {
        return parentId;
    }
    
    public void setParentId(String parentId) {
        this.parentId = parentId;
    }
    
    public String getParentCode() {
        return parentCode;
    }
    
    public void setParentCode(String parentCode) {
        this.parentCode = parentCode;
    }
    
    public String getParentNom() {
        return parentNom;
    }
    
    public void setParentNom(String parentNom) {
        this.parentNom = parentNom;
    }
    
    public String getRegionId() {
        return regionId;
    }
    
    public void setRegionId(String regionId) {
        this.regionId = regionId;
    }
    
    public String getRegionCode() {
        return regionCode;
    }
    
    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }
    
    public String getRegionNom() {
        return regionNom;
    }
    
    public void setRegionNom(String regionNom) {
        this.regionNom = regionNom;
    }
    
    public String getCercleId() {
        return cercleId;
    }
    
    public void setCercleId(String cercleId) {
        this.cercleId = cercleId;
    }
    
    public String getCercleCode() {
        return cercleCode;
    }
    
    public void setCercleCode(String cercleCode) {
        this.cercleCode = cercleCode;
    }
    
    public String getCercleNom() {
        return cercleNom;
    }
    
    public void setCercleNom(String cercleNom) {
        this.cercleNom = cercleNom;
    }
    
    public String getCommuneId() {
        return communeId;
    }
    
    public void setCommuneId(String communeId) {
        this.communeId = communeId;
    }
    
    public String getCommuneCode() {
        return communeCode;
    }
    
    public void setCommuneCode(String communeCode) {
        this.communeCode = communeCode;
    }
    
    public String getCommuneNom() {
        return communeNom;
    }
    
    public void setCommuneNom(String communeNom) {
        this.communeNom = communeNom;
    }
    
    @Override
    public String toString() {
        return "DivisionDto{" +
                "id='" + id + '\'' +
                ", code='" + code + '\'' +
                ", nom='" + nom + '\'' +
                ", type='" + type + '\'' +
                ", parentId='" + parentId + '\'' +
                '}';
    }
}
