package abdaty_technologie.API_Invest.Entity.Enum;

// Situation familiale
public enum SituationMatrimoniales {
    CELIBATAIRE("Celibataire"),
    MARIE("Marié"),  
    DIVORCE("Divorcé"),
    VEUF("Veuf");

    private final String value;

    SituationMatrimoniales(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}
