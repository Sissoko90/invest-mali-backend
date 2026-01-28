package abdaty_technologie.API_Invest.dto.instat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO pour les réponses de l'API INSTAT Mali - Régions
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RegionResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("code_region")
    private String code;
    
    @JsonProperty("nom_region")
    private String nom;
    
    @JsonProperty("libelle")
    private String libelle;
    
    // Constructeurs
    public RegionResponse() {}
    
    public RegionResponse(String id, String code, String nom, String libelle) {
        this.id = id;
        this.code = code;
        this.nom = nom;
        this.libelle = libelle;
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
    
    @Override
    public String toString() {
        return "RegionResponse{" +
                "id='" + id + '\'' +
                ", code='" + code + '\'' +
                ", nom='" + nom + '\'' +
                ", libelle='" + libelle + '\'' +
                '}';
    }
}
