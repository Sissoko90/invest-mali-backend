package abdaty_technologie.API_Invest.Entity.Enum;

public enum PaymentStatus {
    PENDING("En attente"),
    COMPLETED("Complété"),
    FAILED("Échoué"),
    CANCELLED("Annulé"),
    REFUNDED("Remboursé");

    private final String value;

    PaymentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
