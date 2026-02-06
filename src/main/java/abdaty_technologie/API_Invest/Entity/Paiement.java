package abdaty_technologie.API_Invest.Entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
@Entity
public class Paiement extends BaseEntity {

    @Column(name="type_paiement", nullable = false)
    @Enumerated(EnumType.STRING) 
    private TypePaiement typePaiement;
    
    @Column(name="statut", nullable = false)
    @Enumerated(EnumType.STRING) 
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;
    
    @Column(name = "montant", nullable = false, precision=18, scale=2) 
    private BigDecimal montant;

    @Column(name = "reference_transaction", unique = true)
    private String referenceTransaction;

    @Column(name = "description")
    private String description;

    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    @Column(name = "numero_telephone")
    private String numeroTelephone; // Pour mobile money

    @Column(name = "numero_compte")
    private String numeroCompte; // Pour virements bancaires

    @Column(name = "pay_token")
    private String payToken; // Token de paiement Orange Money V2

    @ManyToOne(optional = true)
    @JoinColumn(name = "entreprise_id", nullable = true)
    private Entreprise entreprise;

    @ManyToOne(optional = true)
    @JoinColumn(name = "personne_id", nullable = true)
    private Persons personne;
    
    // Getters and Setters
    public TypePaiement getTypePaiement() { return typePaiement; }
    public void setTypePaiement(TypePaiement typePaiement) { this.typePaiement = typePaiement; }
    
    public StatutPaiement getStatut() { return statut; }
    public void setStatut(StatutPaiement statut) { this.statut = statut; }
    
    public BigDecimal getMontant() { return montant; }
    public void setMontant(BigDecimal montant) { this.montant = montant; }
    
    public String getReferenceTransaction() { return referenceTransaction; }
    public void setReferenceTransaction(String referenceTransaction) { this.referenceTransaction = referenceTransaction; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDateTime getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDateTime datePaiement) { this.datePaiement = datePaiement; }
    
    public String getNumeroTelephone() { return numeroTelephone; }
    public void setNumeroTelephone(String numeroTelephone) { this.numeroTelephone = numeroTelephone; }
    
    public String getNumeroCompte() { return numeroCompte; }
    public void setNumeroCompte(String numeroCompte) { this.numeroCompte = numeroCompte; }
    
    public String getPayToken() { return payToken; }
    public void setPayToken(String payToken) { this.payToken = payToken; }
    
    public Entreprise getEntreprise() { return entreprise; }
    public void setEntreprise(Entreprise entreprise) { this.entreprise = entreprise; }
    
    public Persons getPersonne() { return personne; }
    public void setPersonne(Persons personne) { this.personne = personne; }
}

