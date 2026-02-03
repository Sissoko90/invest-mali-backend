package abdaty_technologie.API_Invest.Entity.Enum;

// Civilité
public enum Civilites {
    MONSIEUR("Monsieur"),      
    MADAME("Madame"),
    PERSONNE_MORALE("Personne Morale");

    private final String value;

    Civilites(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

