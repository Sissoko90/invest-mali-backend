package abdaty_technologie.API_Invest.Entity.Enum;

public enum PaymentMethod {
    TRESOR_PAY("TresorPay"),
    CASH("Espèces"),
    BANK_TRANSFER("Virement bancaire");

    private final String value;

    PaymentMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
