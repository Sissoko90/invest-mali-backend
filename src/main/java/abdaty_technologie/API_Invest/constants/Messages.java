package abdaty_technologie.API_Invest.constants;

public final class Messages {
    private Messages() {}


    // Validation messages
    public static final String REQ_INVALIDE = "Requête invalide";
    public static final String REF_OBLIGATOIRE = "reference est obligatoire";
    public static final String NOM_OBLIGATOIRE = "nom est obligatoire";
    public static final String SIGLE_OBLIGATOIRE = "sigle est obligatoire";
    public static final String TYPE_ENTREPRISE_OBLIGATOIRE = "typeEntreprise est obligatoire";
    public static final String STATUT_CREATION_OBLIGATOIRE = "statutCreation est obligatoire";
    public static final String ETAPE_VALIDATION_OBLIGATOIRE = "etapeValidation est obligatoire";
    public static final String FORME_JURIDIQUE_OBLIGATOIRE = "formeJuridique est obligatoire";
    public static final String DOMAINE_ACTIVITE_OBLIGATOIRE = "domaineActivite est obligatoire";
    public static final String DIVISION_CODE_OBLIGATOIRE = "divisionCode est obligatoire";

    public static final String ENTREPRISE_REF_EXISTE = "Une entreprise avec cette référence existe déjà";
    public static final String ENTREPRISE_NOM_EXISTE = "Une entreprise avec ce nom existe déjà";
    public static final String ENTREPRISE_SIGLE_EXISTE = "Une entreprise avec ce sigle existe déjà";
    public static final String ENTREPRISE_INTROUVABLE = "Entreprise introuvable";

    public static String divisionIntrouvable(String code) {
        return "Division avec code '" + code + "' introuvable. Assurez-vous que les données de divisions sont importées.";
    }

    // GlobalExceptionHandler helpers
    public static String invalidEnumValue(String field, String allowedValuesCsv) {
        return "Valeur invalide pour le champ '" + field + "'. Valeurs acceptées: [" + allowedValuesCsv + "]";
    }

    public static String invalidFieldFormat(String field) {
        return "Format invalide pour le champ '" + field + "'";
    }

    public static String invalidParamEnum(String param, String allowedValuesCsv) {
        return "Paramètre '" + param + "' invalide. Valeurs acceptées: [" + allowedValuesCsv + "]";
    }

    public static String invalidParamType(String param) {
        return "Paramètre '" + param + "' a un type invalide";
    }


    // Messages d'erreur d'authentification
    public static final String INVALID_CREDENTIALS = "Nom d'utilisateur ou mot de passe incorrect";
    public static final String UTILISATEUR_NON_TROUVE = "Utilisateur non trouvé";
    public static final String MOT_DE_PASSE_INCORRECT = "Mot de passe incorrect";
    public static final String ACCOUNT_DISABLED = "Compte utilisateur désactivé";
    
    // Messages d'erreur de données
    public static final String PERSON_NOT_FOUND = "Personne non trouvée avec l'ID: ";
    public static final String ENTERPRISE_NOT_FOUND = "Entreprise non trouvée avec l'ID: ";
    public static final String PAYMENT_NOT_FOUND = "Paiement non trouvé avec l'ID: ";
    public static final String PAYMENT_NOT_FOUND_BY_REFERENCE = "Paiement non trouvé avec la référence: ";
    public static final String USER_NOT_FOUND = "Utilisateur non trouvé avec l'ID: ";
    
    // Messages d'erreur de fichier
    public static final String FILE_EMPTY = "Le fichier est vide";
    public static final String FILE_MUST_BE_EXCEL = "Le fichier doit être au format Excel (.xlsx)";
    public static final String FILE_READ_ERROR = "Erreur lors de la lecture du fichier Excel: ";
    
    // Messages d'erreur système
    public static final String CLASS_CANNOT_BE_INSTANTIATED = "Cette classe ne peut pas être instanciée";
    public static final String ERROR_PREFIX = "Erreur: ";
    public static final String FILE_PROCESSING_ERROR = "Erreur lors du traitement du fichier: ";
    public static final String INTERNAL_ERROR = "Erreur interne: ";
    public static final String INTERNAL_SERVER_ERROR = "Erreur interne du serveur";
    public static final String AUTHENTICATION_SUCCESS = "Authentification fonctionnelle !";
    public static final String USER_NOT_FOUND_OR_ERROR = "Utilisateur non trouvé ou erreur: ";
    public static final String ERROR_RETRIEVING_USERS = "Erreur lors de la récupération des utilisateurs: ";
    public static final String PAYMENT_DELETED_SUCCESS = "Paiement supprimé avec succès";
    public static final String DELETION_ERROR = "Erreur lors de la suppression: ";
    public static final String CALCULATION_ERROR = "Erreur lors du calcul: ";
    public static final String PAYMENT_CREATION_ERROR = "Erreur lors de la création du paiement: ";
    public static final String PAYMENT_RETRIEVAL_ERROR = "Erreur lors de la récupération des paiements: ";
    public static final String PAYMENT_NOT_FOUND_ERROR = "Paiement non trouvé: ";
    public static final String VALIDATION_ERROR = "Erreur lors de la validation: ";
    public static final String REFUSAL_ERROR = "Erreur lors du refus: ";
    public static final String CANCELLATION_ERROR = "Erreur lors de l'annulation: ";

    // Participants / Entreprise validations
    public static final String PARTICIPANTS_OBLIGATOIRES = "La liste des participants est obligatoire";
    public static final String UN_SEUL_GERANT_AUTORISE = "Un seul gérant est autorisé par entreprise";
    public static final String AU_MOINS_UN_FONDATEUR = "Au moins un fondateur est requis";
    public static String personneIntrouvable(String personId) {
        return "Personne avec identifiant '" + personId + "' introuvable";
    }
    public static String personneNonAutorisee(String personId) {
        return "La personne '" + personId + "' n'est pas autorisée à créer/participer à une entreprise";
    }
    public static String personneMineure(String personId) {
        return "La personne '" + personId + "' est mineure (âge < 18 ans)";
    }
    public static String datesInvalides(String personId) {
        return "Intervalle de dates invalide pour la personne '" + personId + "' (dateDebut > dateFin)";
    }
    public static String sommePartsInvalide(String valeur) {
        return "La somme des pourcentages (fondateurs + associés) doit être exactement 100 (actuelle: " + valeur + ")";
    }

    // Documents validations
    public static final String PERSONNE_ID_OBLIGATOIRE = "personneId est obligatoire";
    public static final String ENTREPRISE_ID_OBLIGATOIRE = "entrepriseId est obligatoire";
    public static final String TYPE_PIECE_OBLIGATOIRE = "type_piece est obligatoire";
    public static final String NUMERO_OBLIGATOIRE_PIECE = "numero est obligatoire pour une pièce";
    public static final String NUMERO_PIECE_TROP_COURT = "Le numéro de la pièce doit contenir au moins 6 caractères";
    public static final String PHOTO_PIECE_OBLIGATOIRE = "photoPiece est obligatoire";
    public static final String DATE_EXPIRATION_OBLIGATOIRE = "dateExpiration est obligatoire pour une pièce";
    public static final String DATE_EXPIRATION_INVALIDE = "dateExpiration doit être supérieure ou égale à la date du jour";
    public static final String NUMERO_PIECE_DEJA_UTILISE = "Ce numéro de pièce est invalid";
    public static final String PIECE_DEJA_EXISTANTE_POUR_PERSONNE = "Cette meme pièce est déjà utiliser";
    public static final String TYPE_DOCUMENT_OBLIGATOIRE = "type_document est obligatoire";
    public static final String PHOTO_DOCUMENT_OBLIGATOIRE = "photo_piece est obligatoire";
    public static final String EXTRAIT_JUDICIAIRE_REQUIS = "extraitJudiciaire requis au niveau de l'entreprise pour déposer un Casier Judiciaire";
    public static final String DOCUMENT_POUR_GERANT_SEULEMENT = "Le document demandé doit appartenir au gérant de l'entreprise";
    public static final String ACTE_MARIAGE_REQUIS_SI_MARIE = "ACTE_MARIAGE autorisé uniquement si la personne est mariée";
    public static final String STATUT_SOCIETE_REQUIS = "statutSociete doit être à true pour déposer STATUS_SOCIETE";
    public static final String LECTURE_FICHIER_IMPOSSIBLE = "Impossible de lire le fichier uploadé";
    public static final String DOCUMENT_RESERVE_FONDATEURS = "Ce document est réservé aux fondateurs de l'entreprise";

    // Persons validations
    public static final String PERSON_NOM_OBLIGATOIRE = "Le nom est obligatoire";
    public static final String PERSON_PRENOM_OBLIGATOIRE = "Le prénom est obligatoire";
    public static final String PERSON_EMAIL_OBLIGATOIRE = "L'email est obligatoire";
    public static final String PERSON_TEL1_OBLIGATOIRE = "Le téléphone principal est obligatoire";
    public static final String PERSON_DATE_NAISSANCE_OBLIGATOIRE = "La date de naissance est obligatoire";
    public static final String PERSON_LIEU_NAISSANCE_OBLIGATOIRE = "Le lieu de naissance est obligatoire";
    public static final String PERSON_ANTENNE_AGENT_OBLIGATOIRE = "antenneAgent est obligatoire pour ce rôle";
    public static final String PERSON_EMAIL_DEJA_UTILISE = "Cet email est déjà utilisé";
    public static final String PERSON_TEL_DEJA_UTILISE = "Ce numéro de téléphone est déjà utilisé";
    public static final String PERSON_ENTREPRISE_ROLE_OBLIGATOIRE_POUR_USER = "entrepriseRole est obligatoire pour le rôle USER";
    public static final String PERSON_EMAIL_OBLIGATOIRE_SI_NON_USER = "L'email est obligatoire pour les rôles autres que USER";
    public static final String PERSON_MINEUR_NON_AUTORISE = "La personne est mineure (moins de 18 ans) et ne peut pas être créée";
    public static final String PERSON_TELEPHONE_INVALIDE = "Le format du téléphone est invalide. Format international E.164 requis (ex: +22377000001)";
    public static final String PERSON_CIVILITE_INVALIDE_POUR_SEXE = "La civilité ne correspond pas au sexe fourni";
    public static final String PERSON_AGENT_DOIT_PAS_AVOIR_ENTREPRISEROLE = "Un agent ne peut pas avoir un rôle d'entreprise";
    public static final String PERSONNE_NON_TROUVE = "Aucune personne associée à ce compte utilisateur";
    
}
