package abdaty_technologie.API_Invest.dto.responses;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaiementResponse {
    
    private String id;
    private TypePaiement typePaiement;
    private StatutPaiement statut;
    private BigDecimal montant;
    private String referenceTransaction;
    private String description;
    private LocalDateTime datePaiement;
    private LocalDateTime dateCreation;
    private String numeroTelephone;
    private String numeroCompte;
    
    // Informations de la personne
    private String personneId;
    private String personneNom;
    private String personnePrenom;
    
    // Informations de l'entreprise (optionnel)
    private String entrepriseId;
    private String entrepriseNom;
}
