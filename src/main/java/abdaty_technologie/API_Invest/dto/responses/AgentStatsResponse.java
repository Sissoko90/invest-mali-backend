package abdaty_technologie.API_Invest.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AgentStatsResponse {
    
    private int enCours;
    private int valides;
    private int enAttente;
    private int total;
    private int progressionPourcentage;
    
    public AgentStatsResponse(int enCours, int valides, int enAttente) {
        this.enCours = enCours;
        this.valides = valides;
        this.enAttente = enAttente;
        this.total = enCours + valides + enAttente;
        
        // Calculer le pourcentage de progression basé sur les validés
        if (this.total > 0) {
            this.progressionPourcentage = Math.round((float) valides / this.total * 100);
        } else {
            this.progressionPourcentage = 0;
        }
    }
    
    @Override
    public String toString() {
        return String.format("AgentStats{enCours=%d, valides=%d, enAttente=%d, total=%d, progression=%d%%}", 
                           enCours, valides, enAttente, total, progressionPourcentage);
    }
}
