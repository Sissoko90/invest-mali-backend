package abdaty_technologie.API_Invest.Entity.Enum;

// Hiérarchie administrative du Mali
public enum DivisionType {
    REGION("Region"),          // Régions du Mali (ex: Kayes, Koulikoro, Sikasso...)
    CERCLE("Cercle"),          // Cercles dans chaque région
    ARRONDISSEMENT("Arrondissement"),  // Arrondissements dans chaque cercle
    COMMUNE("Commune"),         // Communes dans chaque arrondissement
    QUARTIER("Quartier")         // Quartiers dans chaque commune
    ;

    private final String value;

    DivisionType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

