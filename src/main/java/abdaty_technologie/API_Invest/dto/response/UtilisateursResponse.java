package abdaty_technologie.API_Invest.dto.response;

/**
 * Réponse API pour l'entité Utilisateurs.
 * Contient les informations essentielles d'un utilisateur/agent.
 */
public class UtilisateursResponse {
    
    /** Identifiant unique */
    public String id;
    
    /** Nom d'utilisateur */
    public String utilisateur;
    
    /** Email de l'utilisateur */
    public String email;
    
    /** Nom de famille */
    public String nom;
    
    /** Prénom */
    public String prenom;
    
    /** Constructeur par défaut */
    public UtilisateursResponse() {}
}
