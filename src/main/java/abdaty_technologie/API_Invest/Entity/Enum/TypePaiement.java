package abdaty_technologie.API_Invest.Entity.Enum;

public enum TypePaiement {
    TRESORPAY("TresorPay"),
    CARTE_BANCAIRE("Carte bancaire"),
    MOBILE_MONEY("Mobile Money"),
    // VIREMENT_BANCAIRE("Virement bancaire"),
    ESPECES("Espèces");
    // CHEQUE("Cheque"),
    // PAYPAL("Paypal");
   

    private final String value;

    TypePaiement(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
