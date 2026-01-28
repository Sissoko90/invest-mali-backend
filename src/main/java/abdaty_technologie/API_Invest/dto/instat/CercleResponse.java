package abdaty_technologie.API_Invest.dto.instat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO pour les réponses de l'API INSTAT Mali - Cercles
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CercleResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("code")
    private String code;
    
    @JsonProperty("nom")
    private String nom;
    
    @JsonProperty("libelle")
    private String libelle;
    
    @JsonProperty("region_id")
    private String regionId;
    
    @JsonProperty("region_code")
    private String regionCode;
    
    // Constructeurs
    public CercleResponse() {}
    
    public CercleResponse(String id, String code, String nom, String libelle, String regionId, String regionCode) {
        this.id = id;
        this.code = code;
        this.nom = nom;
        this.libelle = libelle;
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
        return "CercleResponse{" +
                "id='" + id + '\'' +
                ", code='" + code + '\'' +
                ", nom='" + nom + '\'' +
                ", libelle='" + libelle + '\'' +
                ", regionId='" + regionId + '\'' +
                ", regionCode='" + regionCode + '\'' +
                '}';
    }
}
