package abdaty_technologie.API_Invest.dto.tresorpay;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * DTO pour l'annulation d'un avis de recette TresorPay
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TresorPayCancelRequest {
    private String referenceClient;
    private String codeClient;
    private String codeStructure;
}
