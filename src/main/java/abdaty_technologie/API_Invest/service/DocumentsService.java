<<<<<<< HEAD
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
     * Met à jour uniquement le fichier d'un document existant
     */
    Documents updateDocumentFile(String documentId, MultipartFile file);
    
    /**
     * Vérifie si un numéro de pièce est déjà utilisé
     */
    boolean isPieceNumeroAlreadyUsed(String numero, String typePiece);
    
    /**
     * Supprime un document par son ID
     */
    void deleteDocument(String documentId);
    
    /**
     * Upload un document supplémentaire de type AUTRES avec description
     */
    Documents uploadAutresDocument(String personneId, String entrepriseId, String nom, String description, MultipartFile file);
}
=======
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
     * Met à jour uniquement le fichier d'un document existant
     */
    Documents updateDocumentFile(String documentId, MultipartFile file);
    
    /**
     * Vérifie si un numéro de pièce est déjà utilisé
     */
    boolean isPieceNumeroAlreadyUsed(String numero, String typePiece);
    
    /**
     * Supprime un document par son ID
     */
    void deleteDocument(String documentId);
    
    /**
     * Upload un document supplémentaire de type AUTRES avec description
     */
    Documents uploadAutresDocument(String personneId, String entrepriseId, String nom, String description, MultipartFile file);
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
