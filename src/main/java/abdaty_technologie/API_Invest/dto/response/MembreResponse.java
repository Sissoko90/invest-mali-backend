package abdaty_technologie.API_Invest.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import abdaty_technologie.API_Invest.Entity.Enum.PaysEmissionRccM;

public class MembreResponse {

    //L'ID de la relation EntrepriseMembre (pour les mises à jour)
    public String id;

    //L'ID du personne membre de l'entreprsie
    public String personId;

    //Le nom du personne membre de l'entreprise
    public String nom;

    //Le nom du personne membre de l'entreprise
    public String prenom;

    //Le role du personne membre de l'entreprise
    public EntrepriseRole role;

    //Le pourcentage du personne membre de l'entreprise
    public BigDecimal pourcentageParts;

    //La date du debut du personne membre de l'entreprise
    public LocalDate dateDebut;

    //La date du debut du personne membre de l'entreprise
    public LocalDate dateFin;

    //L'email du membre
    public String email;

    //Le téléphone du membre
    public String telephone;

    //Le téléphone 2 du membre
    public String telephone2;

    //La date de naissance du membre
    public LocalDate dateNaissance;
    
    //Le lieu de naissance du membre
    public String lieuNaissance;
    
    //La localité du membre
    public String localite;
    
    //La civilité du membre (M., Mme, Mlle)
    public String civilite;

    //La situation matrimoniale du membre (MARIE, CELIBATAIRE, etc.)
    public String situationMatrimonialeStr;

    //Le sexe du membre
    public String sexe;

    //La nationalité du membre
    public String nationalite;

    // Champs spécifiques aux personnes morales
    //Le pays d'émission du RCCM pour les personnes morales
    public PaysEmissionRccM paysEmissionRccm;

    //La dénomination de l'entreprise pour les personnes morales
    public String denominationEntreprise;
    
    // Champs des conjoints (si marié - peut avoir plusieurs conjoints)
    public List<ConjointResponse> conjoints;
}
