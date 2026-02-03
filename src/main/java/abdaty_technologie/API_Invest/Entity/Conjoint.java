package abdaty_technologie.API_Invest.Entity;

import abdaty_technologie.API_Invest.Entity.Enum.ClauseRestrictive;
import abdaty_technologie.API_Invest.Entity.Enum.RegimeMatrimonial;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "conjoints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Conjoint extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Persons person;

    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "date_mariage", nullable = false)
    private LocalDate dateMariage;

    @Column(name = "lieu_mariage", nullable = false, length = 255)
    private String lieuMariage;

    @Enumerated(EnumType.STRING)
    @Column(name = "regime_matrimonial", nullable = false, length = 255)
    private RegimeMatrimonial regimeMatrimonial;

    @Enumerated(EnumType.STRING)
    @Column(name = "clause_restrictive", nullable = false, length = 255)
    private ClauseRestrictive clauseRestrictive;
}
