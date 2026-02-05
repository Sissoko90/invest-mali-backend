package abdaty_technologie.API_Invest.dto.tresorpay;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * DTO pour la création d'un avis de recette TresorPay
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TresorPayNoticeRequest {
    
    private String reference;
    private String codeClient;
    private String codeStructure;
    private String callback;
    private String redirectUrl;
    private Long netTotal;
    private TaxPayer taxPayer;
    private List<Item> items;
    private List<AuthorizedPaymentMode> authorizedPaymentModes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaxPayer {
        private String name;
        private String firstName;
        private String companyName;
        private String address;
        private String phoneNumber;
        private String email;
        private String nif;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {
        private String name;
        private Integer quantity;
        private Long unitPrice;
        private String description;
        private String codeNatureRecette;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorizedPaymentMode {
        private String codeProvider;
        private String paymentNumber;
        private String cardNumber;
        private Long amount;
    }
}
