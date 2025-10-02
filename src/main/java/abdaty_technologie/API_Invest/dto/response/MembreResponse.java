package abdaty_technologie.API_Invest.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;

public class MembreResponse {

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

    //La date de naissance du membre
    public LocalDate dateNaissance;

    //La situation matrimoniale du membre
    public Boolean situationMatrimoniale;
}
