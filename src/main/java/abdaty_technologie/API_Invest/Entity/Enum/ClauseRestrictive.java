package abdaty_technologie.API_Invest.Entity.Enum;

public enum ClauseRestrictive {
    MONOGAMIE("Monogamie"),
    POLYGAMIE("Polygamie");

    private final String label;

    ClauseRestrictive(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
