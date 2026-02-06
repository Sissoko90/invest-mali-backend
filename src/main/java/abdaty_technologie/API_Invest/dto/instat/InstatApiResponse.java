package abdaty_technologie.API_Invest.dto.instat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * DTO wrapper pour les réponses de l'API INSTAT Mali
 * L'API retourne toujours un objet avec "value" et "Count"
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class InstatApiResponse<T> {
    
    @JsonProperty("value")
    private List<T> value;
    
    @JsonProperty("Count")
    private Integer count;
    
    // Constructeurs
    public InstatApiResponse() {}
    
    public InstatApiResponse(List<T> value, Integer count) {
        this.value = value;
        this.count = count;
    }
    
    // Getters et Setters
    public List<T> getValue() {
        return value;
    }
    
    public void setValue(List<T> value) {
        this.value = value;
    }
    
    public Integer getCount() {
        return count;
    }
    
    public void setCount(Integer count) {
        this.count = count;
    }
    
    @Override
    public String toString() {
        return "InstatApiResponse{" +
                "value=" + (value != null ? value.size() : 0) + " items" +
                ", count=" + count +
                '}';
    }
}
