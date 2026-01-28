package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;

public class ParticipantRequest {

    // L'ID du membre de la creation de l'entreprise
    @NotBlank
    public String personId;

    //Role du membre de l'entreprise (FONDATEUR, ASSOCIE, GERANT)
    @NotBlank
    public EntrepriseRole role;

    //Le part de pourcentage du membre
    @NotBlank
    @DecimalMin(value = "0.00")
    public BigDecimal pourcentageParts;

    //La date de debut de l'affectation du membre a l'entreprise
    @NotBlank
    public LocalDate dateDebut;

    // La date de fin de fin du membre a l'entreprise
    @NotBlank
    public LocalDate dateFin;
    
    // ========== CHAMPS OPTIONNELS POUR MISE À JOUR PERSONNE ==========
    // Ces champs permettent de mettre à jour les informations personnelles si elles sont manquantes
    
    /** Date de naissance (optionnel - pour mise à jour si null en base) */
    public Date dateNaissance;
    
    /** Lieu de naissance (optionnel - pour mise à jour si null en base) */
    public String lieuNaissance;
}
