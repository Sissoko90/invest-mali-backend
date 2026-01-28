package abdaty_technologie.API_Invest.dto.responses;

import java.math.BigDecimal;

/**
 * Classe de réponse pour les totaux de paiements
 */
public class TotalResponse {
    private BigDecimal total;
    private String statut;
    
    public TotalResponse() {}
    
    public TotalResponse(BigDecimal total, String statut) {
        this.total = total;
        this.statut = statut;
    }
    
    public BigDecimal getTotal() {
        return total;
    }
    
    public void setTotal(BigDecimal total) {
        this.total = total;
    }
    
    public String getStatut() {
        return statut;
    }
    
    public void setStatut(String statut) {
        this.statut = statut;
    }
}
