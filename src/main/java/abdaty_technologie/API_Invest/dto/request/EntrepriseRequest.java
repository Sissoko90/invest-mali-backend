package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.FormeJuridique;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Requête de création d'une entreprise.
 * La référence n'est pas fournie par le client: elle est générée par le serveur
 * avec la nomenclature CE-YYYY-MM-DD-#####.
 */
public class EntrepriseRequest {
    /** Nom légal de l'entreprise (obligatoire) */
    @NotBlank
    public String nom;
    /** Sigle de l'entreprise (obligatoire) */
    @NotBlank
    public String sigle;

    /** Adresse différente de celle d'identité (optionnel) */
    @NotNull
    public Boolean adresseDifferentIdentite;

    /** Extrait judiciaire fourni (optionnel) */
    @NotNull
    public Boolean extraitJudiciaire;

    /** Autorisation du gérant fournie (optionnel) */
    @NotNull
    public Boolean autorisationGerant;

    /** Autorisation d'exercice fournie (optionnel) */
    @NotNull
    public Boolean autorisationExercice;

    /** Compte import/export (optionnel) */
    @NotNull
    public Boolean importExport;

    /** Statut de société: si true, un document devra être uploadé (géré côté workflow/documents) */
    @NotNull
    public Boolean statutSociete;

    /** Type d'entreprise (ex: SOCIETE, ENTREPRISE_INDIVIDUELLE) */
    @NotNull
    public TypeEntreprise typeEntreprise;

    /** Statut du processus de création (workflow interne) */
    @NotNull
    public StatutCreation statutCreation;
    /** Étape de validation (workflow interne) */

    @NotNull
    public EtapeValidation etapeValidation;
    /** Forme juridique (ex: SARL, SA, ...) */

    @NotNull
    public FormeJuridique formeJuridique;

    /** Domaine d'activité principal */
    @NotNull
    public DomaineActivites domaineActivite;

    // Code de la division obligatoire
    /** Code de la division (localisation la plus précise connue) */
    @NotBlank
    public String divisionCode;

    /**
     * Participants à l'entreprise (obligatoire): chaque entrée précise le rôle, le pourcentage de parts,
     * ainsi que l'intervalle de validité (dateDebut/dateFin).
     * Règles:
     * - Un seul GERANT (sur l'intervalle courant)
     * - Au moins un FONDATEUR
     * - Somme des parts (FONDATEUR + ASSOCIE) = 100
     * - dateDebut <= dateFin (pour relation courante, utiliser 9999-12-31 en dateFin)
     */
    @NotEmpty
    public List<ParticipantRequest> participants;
}
