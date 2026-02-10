package abdaty_technologie.API_Invest.Entity;

import java.sql.Blob;
import java.time.LocalDate;

import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
@Entity
public class Documents extends BaseEntity {

    @Column(name="type_piece", nullable = true, length = 50)
    @Enumerated(EnumType.STRING) 
    private TypePieces typePiece;

    @Column(name="type_document", nullable = true, length = 50)
    @Enumerated(EnumType.STRING) 
    private TypeDocuments typeDocument;

    @Column(name="num_piece", nullable = true, length = 50)
    private String numero;

    @Column(name="photo_piece", nullable = false)
    private Blob photoPiece;

    // Description pour les documents de type AUTRES
    @Column(name="description", nullable = true, length = 500)
    private String description;

    // Date d'expiration pour les pièces d'identité (applicable si typePiece != null)
    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @ManyToOne(optional = false)
    @JoinColumn(name = "personne_id")
    private Persons personne;
    
    @ManyToOne(optional = false)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;
    
    @ManyToOne(optional = true)
    @JoinColumn(name = "conjoint_id")
    private Conjoint conjoint;
    
    // Getters and Setters
    public TypePieces getTypePiece() { return typePiece; }
    public void setTypePiece(TypePieces typePiece) { this.typePiece = typePiece; }
    
    public TypeDocuments getTypeDocument() { return typeDocument; }
    public void setTypeDocument(TypeDocuments typeDocument) { this.typeDocument = typeDocument; }
    
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    
    public Blob getPhotoPiece() { return photoPiece; }
    public void setPhotoPiece(Blob photoPiece) { this.photoPiece = photoPiece; }
    
    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }
    
    public Persons getPersonne() { return personne; }
    public void setPersonne(Persons personne) { this.personne = personne; }
    
    public Entreprise getEntreprise() { return entreprise; }
    public void setEntreprise(Entreprise entreprise) { this.entreprise = entreprise; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Conjoint getConjoint() { return conjoint; }
    public void setConjoint(Conjoint conjoint) { this.conjoint = conjoint; }
}

