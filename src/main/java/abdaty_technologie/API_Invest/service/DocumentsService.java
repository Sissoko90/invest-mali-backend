package abdaty_technologie.API_Invest.service;

import java.time.LocalDate;
import org.springframework.web.multipart.MultipartFile;

import abdaty_technologie.API_Invest.Entity.Documents;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;

public interface DocumentsService {
    Documents uploadPiece(String personneId, String entrepriseId, TypePieces typePiece, String numero, LocalDate dateExpiration, MultipartFile file);
    Documents uploadDocument(String personneId, String entrepriseId, TypeDocuments typeDocument, String numero, MultipartFile file);
    
    /**
     * Vérifie si un numéro de pièce est déjà utilisé
     */
    boolean isPieceNumeroAlreadyUsed(String numero, String typePiece);
}
