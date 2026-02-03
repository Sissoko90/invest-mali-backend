package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.ClauseRestrictive;
import abdaty_technologie.API_Invest.Entity.Enum.RegimeMatrimonial;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConjointRequest {

    @NotBlank(message = "Le prénom du conjoint est obligatoire")
    public String prenom;

    @NotBlank(message = "Le nom du conjoint est obligatoire")
    public String nom;

    @NotNull(message = "La date de mariage est obligatoire")
    public LocalDate dateMariage;

    @NotBlank(message = "Le lieu de mariage est obligatoire")
    public String lieuMariage;

    @NotNull(message = "Le régime matrimonial est obligatoire")
    public RegimeMatrimonial regimeMatrimonial;

    @NotNull(message = "La clause restrictive est obligatoire")
    public ClauseRestrictive clauseRestrictive;
}
