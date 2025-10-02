package abdaty_technologie.API_Invest.dto.request;


import abdaty_technologie.API_Invest.Entity.Enum.*;

/**
 * Requête de mise à jour partielle d'une entreprise.
 * Les champs non fournis (null) ne sont pas modifiés.
 */
public class UpdateEntrepriseRequest {

    // Le nom de l'entreprise 
    public String nom;

    // Sigle de l'entreprise 
    public String sigle;

    // Activité secondaire (texte libre)
    public String activiteSecondaire;

    public Boolean adresseDifferentIdentite;
    public Boolean extraitJudiciaire;
    public Boolean autorisationGerant;
    public Boolean autorisationExercice;
    public Boolean importExport;
    public Boolean statutSociete;

    public TypeEntreprise typeEntreprise;
    public StatutCreation statutCreation;
    public EtapeValidation etapeValidation;
    public FormeJuridique formeJuridique;
    public DomaineActivites domaineActivite;

    // Mise à jour de la localisation via code de division
    public String divisionCode;
}
