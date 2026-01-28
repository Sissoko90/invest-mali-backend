package abdaty_technologie.API_Invest.constants;

/**
 * Classe contenant tous les messages de validation utilisés dans l'application
 */
public final class ValidationMessages {
    
    // Messages d'authentification
    public static final String USERNAME_REQUIRED = "Le nom d'utilisateur est obligatoire";
    public static final String PASSWORD_REQUIRED = "Le mot de passe est obligatoire";
    
    // Messages de validation des paiements
    public static final String PAYMENT_TYPE_REQUIRED = "Le type de paiement est obligatoire";
    public static final String PAYMENT_AMOUNT_REQUIRED = "Le montant est obligatoire";
    public static final String PAYMENT_AMOUNT_POSITIVE = "Le montant doit être positif";
    public static final String PAYMENT_PERSON_REQUIRED = "La personne est obligatoire";
    public static final String PAYMENT_DESCRIPTION_REQUIRED = "La description est obligatoire";
    public static final String PAYMENT_PHONE_INVALID = "Le numéro de téléphone n'est pas valide";
    public static final String PAYMENT_ACCOUNT_INVALID = "Le numéro de compte n'est pas valide";
    
    // Messages de validation des entreprises
    public static final String ENTERPRISE_NAME_REQUIRED = "Le nom de l'entreprise est obligatoire";
    public static final String ENTERPRISE_REFERENCE_REQUIRED = "La référence de l'entreprise est obligatoire";
    public static final String ENTERPRISE_SIGLE_REQUIRED = "Le sigle de l'entreprise est obligatoire";
    public static final String ENTERPRISE_TYPE_REQUIRED = "Le type d'entreprise est obligatoire";
    public static final String ENTERPRISE_JURIDICAL_FORM_REQUIRED = "La forme juridique est obligatoire";
    public static final String ENTERPRISE_ACTIVITY_DOMAIN_REQUIRED = "Le domaine d'activité est obligatoire";
    
    // Messages de validation des personnes
    public static final String PERSON_FIRSTNAME_REQUIRED = "Le prénom est obligatoire";
    public static final String PERSON_LASTNAME_REQUIRED = "Le nom de famille est obligatoire";
    public static final String PERSON_EMAIL_REQUIRED = "L'adresse email est obligatoire";
    public static final String PERSON_EMAIL_INVALID = "L'adresse email n'est pas valide";
    public static final String PERSON_PHONE_REQUIRED = "Le numéro de téléphone est obligatoire";
    public static final String PERSON_PHONE_INVALID = "Le numéro de téléphone n'est pas valide";
    
    // Messages de validation des utilisateurs
    public static final String USER_USERNAME_REQUIRED = "Le nom d'utilisateur est obligatoire";
    public static final String USER_PASSWORD_REQUIRED = "Le mot de passe est obligatoire";
    public static final String USER_PASSWORD_MIN_LENGTH = "Le mot de passe doit contenir au moins 6 caractères";
    public static final String USER_ROLE_REQUIRED = "Le rôle est obligatoire";
    
    // Messages de validation des divisions
    public static final String DIVISION_NAME_REQUIRED = "Le nom de la division est obligatoire";
    public static final String DIVISION_CODE_REQUIRED = "Le code de la division est obligatoire";
    public static final String DIVISION_TYPE_REQUIRED = "Le type de division est obligatoire";
    
    // Messages génériques
    public static final String FIELD_REQUIRED = "Ce champ est obligatoire";
    public static final String FIELD_INVALID = "Ce champ n'est pas valide";
    public static final String ID_REQUIRED = "L'identifiant est obligatoire";
    public static final String ID_POSITIVE = "L'identifiant doit être positif";
    
    // Messages d'erreur d'authentification
    public static final String INVALID_CREDENTIALS = "Nom d'utilisateur ou mot de passe incorrect";
    public static final String ACCOUNT_DISABLED = "Compte utilisateur désactivé";
    
    // Messages d'erreur de données
    public static final String PERSON_NOT_FOUND = "Personne non trouvée avec l'ID: ";
    public static final String ENTERPRISE_NOT_FOUND = "Entreprise non trouvée avec l'ID: ";
    public static final String PAYMENT_NOT_FOUND = "Paiement non trouvé avec l'ID: ";
    public static final String PAYMENT_NOT_FOUND_BY_REFERENCE = "Paiement non trouvé avec la référence: ";
    

    
    // Constructeur privé pour empêcher l'instanciation
    private ValidationMessages() {
        throw new UnsupportedOperationException(Messages.CLASS_CANNOT_BE_INSTANTIATED);
    }
}
