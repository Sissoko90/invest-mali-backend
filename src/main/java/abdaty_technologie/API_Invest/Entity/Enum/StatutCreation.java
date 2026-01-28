package abdaty_technologie.API_Invest.Entity.Enum;

// Statut d’avancement de la création
public enum StatutCreation {
    EN_ATTENTE("En attente"),
    EN_COURS("En cours"),
    VALIDEE("Validée"),
    REFUSEE("Refusée");

    private final String value;

    StatutCreation(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}

