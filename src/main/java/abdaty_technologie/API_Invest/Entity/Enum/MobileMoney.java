package abdaty_technologie.API_Invest.Entity.Enum;

// Opérateur Mobile Money (si TypePaiement == MOBILE_MONEY)
public enum MobileMoney {
    ORANGE_MONEY("Orange Money"),
    MOOV_MONEY("Moov Money");
    
    private final String value;

    MobileMoney(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
