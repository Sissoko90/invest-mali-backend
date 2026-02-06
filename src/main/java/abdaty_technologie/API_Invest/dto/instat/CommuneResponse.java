package abdaty_technologie.API_Invest.dto.instat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO pour les réponses de l'API INSTAT Mali - Communes
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CommuneResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("code")
    private String code;
    
    @JsonProperty("nom")
    private String nom;
    
    @JsonProperty("libelle")
    private String libelle;
    
    @JsonProperty("cercle_id")
    private String cercleId;
    
    @JsonProperty("cercle_code")
    private String cercleCode;
    
    @JsonProperty("region_id")
    private String regionId;
    
    @JsonProperty("region_code")
    private String regionCode;
    
    // Constructeurs
    public CommuneResponse() {}
    
    public CommuneResponse(String id, String code, String nom, String libelle, 
                          String cercleId, String cercleCode, String regionId, String regionCode) {
        this.id = id;
        this.code = code;
        this.nom = nom;
        this.libelle = libelle;
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
        return "CommuneResponse{" +
                "id='" + id + '\'' +
                ", code='" + code + '\'' +
                ", nom='" + nom + '\'' +
                ", libelle='" + libelle + '\'' +
                ", cercleId='" + cercleId + '\'' +
                ", cercleCode='" + cercleCode + '\'' +
                ", regionId='" + regionId + '\'' +
                ", regionCode='" + regionCode + '\'' +
                '}';
    }
}
