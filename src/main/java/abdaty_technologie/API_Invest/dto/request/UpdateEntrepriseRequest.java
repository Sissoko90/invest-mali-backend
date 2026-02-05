package abdaty_technologie.API_Invest.dto.request;

import com.fasterxml.jackson.annotation.JsonSetter;
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
    
    // Champs de localisation spécifique de l'entreprise
    public String rue;
    public String porte;
    
    /**
     * Setter personnalisé pour domaineActivite qui accepte les chaînes vides
     * et les convertit en null pour éviter les erreurs de désérialisation.
     */
    @JsonSetter("domaineActivite")
    public void setDomaineActivite(String value) {
        if (value == null || value.trim().isEmpty()) {
            this.domaineActivite = null;
        } else {
            try {
                this.domaineActivite = DomaineActivites.valueOf(value.trim());
            } catch (IllegalArgumentException e) {
                // Si la valeur n'est pas valide, on met null plutôt que de lever une exception
                System.out.println("⚠️ Valeur domaineActivite invalide ignorée: '" + value + "'");
                this.domaineActivite = null;
            }
        }
    }
}
