package abdaty_technologie.API_Invest.Entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/**
 * Lien entre une Entreprise et une Personne, avec rôle et parts sur un intervalle.
 */
@Entity
public class EntrepriseMembre extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Persons personne;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private EntrepriseRole role;

    @Column(name = "pourcentage_parts", nullable = false, precision = 10, scale = 2)
    private BigDecimal pourcentageParts;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    public Entreprise getEntreprise() { return entreprise; }
    public void setEntreprise(Entreprise entreprise) { this.entreprise = entreprise; }
    public Persons getPersonne() { return personne; }
    public void setPersonne(Persons personne) { this.personne = personne; }
    public EntrepriseRole getRole() { return role; }
    public void setRole(EntrepriseRole role) { this.role = role; }
    public BigDecimal getPourcentageParts() { return pourcentageParts; }
    public void setPourcentageParts(BigDecimal pourcentageParts) { this.pourcentageParts = pourcentageParts; }
    public LocalDate getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDate dateDebut) { this.dateDebut = dateDebut; }
    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate dateFin) { this.dateFin = dateFin; }
}
