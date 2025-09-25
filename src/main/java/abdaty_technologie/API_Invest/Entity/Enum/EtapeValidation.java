package abdaty_technologie.API_Invest.Entity.Enum;

// Étapes de validation du circuit
public enum EtapeValidation {
    ACCUEIL("Accueil"),
    REGISSEUR("Regisseur"),
    REVISION("Revision"),
    IMPOTS("Impots"),
    RCCM1("RCCM1"),
    RCCM2("RCCM2"),
    NINA("NINA"),
    RETRAIT("Retrait");

    private final String value;

    EtapeValidation(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

