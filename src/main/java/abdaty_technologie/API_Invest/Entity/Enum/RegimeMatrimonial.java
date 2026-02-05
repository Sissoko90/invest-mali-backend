package abdaty_technologie.API_Invest.Entity.Enum;

public enum RegimeMatrimonial {
    SEPARATION_DE_BIENS("Séparation de biens"),
    COMMUNAUTE_DE_BIENS("Communauté de biens");

    private final String label;

    RegimeMatrimonial(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
