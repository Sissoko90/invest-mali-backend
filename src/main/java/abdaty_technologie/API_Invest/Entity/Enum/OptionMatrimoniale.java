package abdaty_technologie.API_Invest.Entity.Enum;

public enum OptionMatrimoniale {
    MONOGAMIE("Monogamie"),
    POLYGAMIE("Polygamie"),
    SEPARATION_DE_BIENS("Séparation de biens"),
    CHOIX_OBLIGATOIRE("Choix obligatoire");

    private final String label;

    OptionMatrimoniale(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
