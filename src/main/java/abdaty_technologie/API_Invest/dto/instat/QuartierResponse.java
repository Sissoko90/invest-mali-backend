package abdaty_technologie.API_Invest.dto.instat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO pour les réponses de l'API INSTAT Mali - Quartiers/Villages/Fractions (VFQ)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuartierResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("code")
    private String code;
    
    @JsonProperty("nom")
    private String nom;
    
    @JsonProperty("libelle")
    private String libelle;
    
    @JsonProperty("type")
    private String type; // QUARTIER, VILLAGE, FRACTION
    
    @JsonProperty("commune_id")
    private String communeId;
    
    @JsonProperty("commune_code")
    private String communeCode;
    
    @JsonProperty("cercle_id")
    private String cercleId;
    
    @JsonProperty("cercle_code")
    private String cercleCode;
    
    @JsonProperty("region_id")
    private String regionId;
    
    @JsonProperty("region_code")
    private String regionCode;
    
    // Constructeurs
    public QuartierResponse() {}
    
    public QuartierResponse(String id, String code, String nom, String libelle, String type,
                           String communeId, String communeCode, String cercleId, String cercleCode,
                           String regionId, String regionCode) {
        this.id = id;
        this.code = code;
        this.nom = nom;
        this.libelle = libelle;
        this.type = type;
        this.communeId = communeId;
        this.communeCode = communeCode;
        this.cercleId = cercleId;
        this.cercleCode = cercleCode;
        this.regionId = regionId;
        this.regionCode = regionCode;
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
    
    @Override
    public String toString() {
        return "QuartierResponse{" +
                "id='" + id + '\'' +
                ", code='" + code + '\'' +
                ", nom='" + nom + '\'' +
                ", libelle='" + libelle + '\'' +
                ", type='" + type + '\'' +
                ", communeId='" + communeId + '\'' +
                ", communeCode='" + communeCode + '\'' +
                ", cercleId='" + cercleId + '\'' +
                ", cercleCode='" + cercleCode + '\'' +
                ", regionId='" + regionId + '\'' +
                ", regionCode='" + regionCode + '\'' +
                '}';
    }
}
