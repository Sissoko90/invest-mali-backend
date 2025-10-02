package abdaty_technologie.API_Invest.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.FormeJuridique;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;

/**
 * Réponse API pour l'entité Entreprise.
 * Ne contient que les champs nécessaires au front et projette la hiérarchie de localisation.
 */
public class EntrepriseResponse {

    /** Identifiant unique (UUID) */
    public String id;

    /** Référence générée par le serveur (CE-YYYY-MM-DD-#####) */
    public String reference;

    /** Nom légal */
    public String nom;

    /** Sigle */
    public String sigle;

    public BigDecimal capitale;

    public String activiteSecondaire;

    /** Type d'entreprise (SOCIETE / ENTREPRISE_INDIVIDUELLE) */
    public TypeEntreprise typeEntreprise;

    /** Statut du processus de création */
    public StatutCreation statutCreation;

    /** Étape de validation */
    public EtapeValidation etapeValidation;

    /** Forme juridique (SARL, SA, ... ) */
    public FormeJuridique formeJuridique;

    /** Domaine d'activité principal */
    public DomaineActivites domaineActivite;

    /** Statut de la société */
    public Boolean statutSociete;

    /** Code et nom de la division (localisation choisie) */
    public String divisionCode;
    public String divisionNom;

    // Hiérarchie localisation
    /** Région */
    public String regionCode;
    public String regionNom;

    /** Cercle */
    public String cercleCode;
    public String cercleNom;

    /** Arrondissement */
    public String arrondissementCode;
    public String arrondissementNom;

    /** Commune */
    public String communeCode;
    public String communeNom;
    
    /** Quartier/Village/Fraction (VFQ) */
    public String quartierCode;
    public String quartierNom;

    // Membres liés (personnes) avec leur rôle et parts
    public List<MembreResponse> membres;

    /** Agent assigné pour traiter cette demande */
    public UtilisateursResponse assignedTo;

    /** Dates de création et de modification */
    public Instant creation;
    public Instant modification;

    /** Etat de bannissement */
    public Boolean banni;
    public String motifBannissement;
    public Instant dateBannissement;
}
