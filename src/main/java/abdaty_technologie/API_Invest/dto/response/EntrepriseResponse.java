package abdaty_technologie.API_Invest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import abdaty_technologie.API_Invest.Entity.Enum.DomaineActivites;
import abdaty_technologie.API_Invest.Entity.Enum.DomaineActiviteNr;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.FormeJuridique;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeEntreprise;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import java.time.LocalDateTime;

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

    /** Domaine d'activité non réglementé */
    public DomaineActiviteNr domaineActiviteNr;

    /** Statut de la société */
    public Boolean statutSociete;

    /** Code et nom de la division (localisation choisie) */
    public String divisionCode;
    public String divisionNom;
    
    /** Champs de localisation spécifique de l'entreprise */
    public String rue;
    public String porte;

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
    @JsonProperty("assignedTo")
    public UtilisateursResponse assignedTo;

    /** Créateur de l'entreprise */
    public CreateurResponse createdBy;

    /** Dates de création et de modification */
    public Instant creation;
    public Instant modification;

    /** Etat de bannissement */
    public Boolean banni;
    public String motifBannissement;
    public Instant dateBannissement;

    /** Montant total de la demande */
    public BigDecimal totalAmount;

    // === INFORMATIONS DE PAIEMENT ===
    
    /** Statut du paiement de l'entreprise */
    public StatutPaiement statutPaiement;
    
    /** Date du paiement (si effectué) */
    public LocalDateTime datePaiement;
    
    /** Montant du paiement */
    public BigDecimal montantPaiement;
    
    /** Référence de la transaction de paiement */
    public String referencePaiement;
    
    /** Indique si l'entreprise a payé les frais */
    public Boolean paiementEffectue;
    
    /** Numéro NINA généré par l'API INSTAT Mali */
    public String numeroNina;
    
    /** Numéro RCCM généré par le service RCCM-OHADA (ex: ML-BKO-01-2025-A-00010) */
    public String numeroRccm;
    
    /** Situation matrimoniale du premier membre/gérant */
    public String situationMatrimoniale;
    
    /** Libellé du domaine d'activité (texte affiché) */
    public String domaineActiviteLabel;
    
    /** Indique si le document RCCM a été téléchargé par l'utilisateur */
    public Boolean rccmTelecharge;
    
    /** Indique si le document NINA a été téléchargé par l'utilisateur */
    public Boolean ninaTelecharge;
    
    /** Date de retrait des documents par l'utilisateur */
    public Instant dateRetrait;
    
    // === INFORMATIONS AGRÉMENT ===
    
    /** Numéro d'autorisation délivré */
    public String numeroAutorisation;
    
    /** Date de délivrance de l'autorisation */
    public Instant dateAutorisation;
    
    /** Chemin vers le fichier d'agrément signé */
    public String agrementSignePath;
    
    /** Indique si le téléchargement de l'agrément est autorisé pour l'utilisateur */
    public Boolean telechargementAutorise;
    
    /** Régime d'investissement pour les demandes d'agrément d'investissement */
    public String regimeInvestissement;
    
    /** Motif de rejet lors du retour d'une étape précédente */
    public String motifRejet;
}
