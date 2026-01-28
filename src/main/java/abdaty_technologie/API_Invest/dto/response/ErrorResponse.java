package abdaty_technologie.API_Invest.dto.response;

import java.time.Instant;


/**
 * Réponse des erreurs de l'API.
 * Ne contient que les champs nécessaires pour les erreurs.
 */
public class ErrorResponse {

    // la date et l'heure de l'erreur
    public Instant timestamp;

    //Le statut de l'erreur (400, 500, 404 etc)
    public int status;

    //Description de l'erreur
    public String error;

    //Message d'erreur personalisé
    public String message;

    //Le chemin de l'API
    public String path;

    public static ErrorResponse of(int status, String error, String message, String path) {
        ErrorResponse r = new ErrorResponse();
        r.timestamp = Instant.now();
        r.status = status;
        r.error = error;
        r.message = message;
        r.path = path;
        return r;
    }
}
