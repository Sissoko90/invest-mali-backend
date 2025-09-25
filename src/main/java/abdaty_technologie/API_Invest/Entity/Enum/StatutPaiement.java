package abdaty_technologie.API_Invest.Entity.Enum;

public enum StatutPaiement {
    EN_ATTENTE("En attente"),
    VALIDE("Valide"),
    REFUSE("Refuse"),
    ANNULE("Annule"),
    REMBOURSE("Rembourse"),
    EXPIRE("Expire");

    private final String value;

    StatutPaiement(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}
