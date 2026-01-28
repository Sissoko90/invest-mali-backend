package abdaty_technologie.API_Invest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Réponse API pour l'entité Utilisateurs.
 * Contient les informations essentielles d'un utilisateur/agent.
 */
public class UtilisateursResponse {
    
    /** Identifiant unique */
    @JsonProperty("id")
    public String id;
    
    /** Nom d'utilisateur */
    @JsonProperty("utilisateur")
    public String utilisateur;
    
    /** Email de l'utilisateur */
    @JsonProperty("email")
    public String email;
    
    /** Nom de famille */
    @JsonProperty("nom")
    public String nom;
    
    /** Prénom */
    @JsonProperty("prenom")
    public String prenom;
    
    /** Constructeur par défaut */
    public UtilisateursResponse() {}
}
