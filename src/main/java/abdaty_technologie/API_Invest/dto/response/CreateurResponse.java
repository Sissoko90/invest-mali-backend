package abdaty_technologie.API_Invest.dto.response;

/**
 * Réponse API pour les informations du créateur d'une entreprise.
 * Contient les informations essentielles pour les statistiques.
 */
public class CreateurResponse {

    /** Identifiant unique du créateur */
    public String id;

    /** Nom complet du créateur */
    public String nom;

    /** Prénom du créateur */
    public String prenom;

    /** Sexe du créateur (M/F) */
    public String sexe;

    /** Nationalité du créateur */
    public String nationalite;

    /** Email du créateur */
    public String email;

    /** Téléphone du créateur */
    public String telephone;

    /** Code de division du créateur */
    public String divisionCode;

    /** Nom de la division du créateur */
    public String divisionNom;
}
