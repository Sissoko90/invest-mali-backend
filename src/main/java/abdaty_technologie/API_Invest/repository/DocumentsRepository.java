package abdaty_technologie.API_Invest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Documents;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;

@Repository
public interface DocumentsRepository extends JpaRepository<Documents, String> {
    
    // Recherche par type de pièce
    List<Documents> findByTypePiece(TypePieces typePiece);
    
    // Recherche par type de document
    List<Documents> findByTypeDocument(TypeDocuments typeDocument);
    
    // Recherche par numéro de pièce
    List<Documents> findByNumero(String numero);
    
    // Recherche par personne
    @Query("SELECT d FROM Documents d WHERE d.personne.id = :personneId")
    List<Documents> findByPersonneId(@Param("personneId") String personneId);
    
    // Recherche par entreprise
    @Query("SELECT d FROM Documents d WHERE d.entreprise.id = :entrepriseId")
    List<Documents> findByEntrepriseId(@Param("entrepriseId") String entrepriseId);
    
    // Recherche par type de pièce et personne
    @Query("SELECT d FROM Documents d WHERE d.typePiece = :typePiece AND d.personne.id = :personneId")
    List<Documents> findByTypePieceAndPersonneId(@Param("typePiece") TypePieces typePiece, @Param("personneId") String personneId);
    
    // Recherche par type de document et entreprise
    @Query("SELECT d FROM Documents d WHERE d.typeDocument = :typeDocument AND d.entreprise.id = :entrepriseId")
    List<Documents> findByTypeDocumentAndEntrepriseId(@Param("typeDocument") TypeDocuments typeDocument, @Param("entrepriseId") String entrepriseId);
    
    // Vérifier l'existence par numéro de pièce
    boolean existsByNumero(String numero);
    
    // Vérifier l'existence par numéro et type de pièce
    boolean existsByNumeroAndTypePiece(String numero, TypePieces typePiece);
}
