package abdaty_technologie.API_Invest.dto.response;

import abdaty_technologie.API_Invest.Entity.Enum.ClauseRestrictive;
import abdaty_technologie.API_Invest.Entity.Enum.RegimeMatrimonial;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConjointResponse {

    private String id;
    
    private String prenom;
    
    private String nom;
    
    private LocalDate dateMariage;
    
    private String lieuMariage;
    
    private RegimeMatrimonial regimeMatrimonial;
    
    private ClauseRestrictive clauseRestrictive;
}
