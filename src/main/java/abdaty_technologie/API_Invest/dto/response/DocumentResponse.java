package abdaty_technologie.API_Invest.dto.response;

import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;
import java.time.LocalDate;

public class DocumentResponse {

    //l'ID du document 
    public String id;

    //Type de piece 
    public TypePieces typePiece;

    //Type de document
    public TypeDocuments typeDocument;

    //Numero du piece
    public String numero;

    //l'ID du personne lier au document
    public String personneId;

    //l'ID du l'entreprise lier au document
    public String entrepriseId;

    //L'url de l'image du document
    public String url;

    //La date d'expiration du document
    public LocalDate dateExpiration;

    //Description pour les documents de type AUTRES
    public String description;
}
