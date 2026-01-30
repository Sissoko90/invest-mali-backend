<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites;
import abdaty_technologie.API_Invest.Entity.Enum.DomaineActiviteNr;
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
    /** Nom légal de l'entreprise (optionnel pour les entreprises individuelles) */
    public String nom;
    /** Sigle de l'entreprise (optionnel) */
    public String sigle;

    /** Capitale de l'entreprise (obligatoire) */
    @NotNull
    public String capitale;


    public String activiteSecondaire;

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

    /** Domaine d'activité principal (optionnel - seulement si le domaine non réglementé nécessite une réglementation) */
    public DomaineActivites domaineActivite;

    /** Domaine d'activité réglementé (optionnel) */
    public DomaineActiviteNr domaineActiviteNr;

    // Code de la division obligatoire
    /** Code de la division (localisation la plus précise connue) */
    @NotBlank
    public String divisionCode;
    
    /** Nom de la rue où est située l'entreprise (optionnel) */
    public String rue;
    
    /** Numéro de porte/portail de l'entreprise (optionnel) */
    public String porte;

    /** Adresse libre du représentant/promoteur (optionnel) */
    public String representativeAdresseLibre;

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
=======
package abdaty_technologie.API_Invest.dto.request;

import abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites;
import abdaty_technologie.API_Invest.Entity.Enum.DomaineActiviteNr;
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
    /** Sigle de l'entreprise (optionnel) */
    public String sigle;

    /** Capitale de l'entreprise (obligatoire) */
    @NotNull
    public String capitale;


    public String activiteSecondaire;

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

    /** Domaine d'activité principal (optionnel - seulement si le domaine non réglementé nécessite une réglementation) */
    public DomaineActivites domaineActivite;

    /** Domaine d'activité réglementé (optionnel) */
    public DomaineActiviteNr domaineActiviteNr;

    // Code de la division obligatoire
    /** Code de la division (localisation la plus précise connue) */
    @NotBlank
    public String divisionCode;
    
    /** Nom de la rue où est située l'entreprise (optionnel) */
    public String rue;
    
    /** Numéro de porte/portail de l'entreprise (optionnel) */
    public String porte;

    /** Adresse libre du représentant/promoteur (optionnel) */
    public String representativeAdresseLibre;
    
    /** Informations du déposant (pour les sociétés) */
    public String nomDeposant;
    public String prenomDeposant;
    public String telephoneDeposant;
    public String nomCabinet;

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
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
