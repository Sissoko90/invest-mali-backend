<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto.requests;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.constants.ValidationMessages;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaiementRequest {
    
    @NotNull(message = ValidationMessages.PAYMENT_TYPE_REQUIRED)
    private TypePaiement typePaiement;
    
    @NotNull(message = ValidationMessages.PAYMENT_AMOUNT_REQUIRED)
    @DecimalMin(value = "0.01", message = ValidationMessages.PAYMENT_AMOUNT_POSITIVE)
    private BigDecimal montant;
    
    @NotBlank(message = ValidationMessages.PAYMENT_PERSON_REQUIRED)
    private String personneId;
    
    private String entrepriseId; // Optionnel
    
    private String description;
    
    private String numeroTelephone; // Pour mobile money
    
    private String numeroCompte; // Pour virements bancaires
    
    private String referenceTransaction; // Référence de la transaction (Stripe Payment Intent ID, etc.)
    
    private StatutPaiement statut; // Statut du paiement
    
    private LocalDateTime datePaiement; // Date du paiement

  
}
=======
package abdaty_technologie.API_Invest.dto.requests;

import java.math.BigDecimal;

import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.constants.ValidationMessages;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaiementRequest {
    
    @NotNull(message = ValidationMessages.PAYMENT_TYPE_REQUIRED)
    private TypePaiement typePaiement;
    
    @NotNull(message = ValidationMessages.PAYMENT_AMOUNT_REQUIRED)
    @DecimalMin(value = "0.01", message = ValidationMessages.PAYMENT_AMOUNT_POSITIVE)
    private BigDecimal montant;
    
    @NotBlank(message = ValidationMessages.PAYMENT_PERSON_REQUIRED)
    private String personneId;
    
    private String entrepriseId; // Optionnel
    
    private String description;
    
    private String numeroTelephone; // Pour mobile money
    
    private String numeroCompte; // Pour virements bancaires
    
    private String referenceTransaction; // Référence de la transaction (Stripe Payment Intent ID, etc.)

  
}
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
