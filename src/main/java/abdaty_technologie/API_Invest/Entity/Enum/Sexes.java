package abdaty_technologie.API_Invest.Entity.Enum;

public enum Sexes {
    MASCULIN("Masculin"),
    FEMININ("Féminin");

    private final String value;

    Sexes(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}
