package abdaty_technologie.API_Invest.Entity.Enum;

// Types d'agrément selon les procédures du guichet unique
public enum TypeAgrement {
    BTP_TOURISME("BTP, Tourisme & Transport", 1, false),
    ETABLISSEMENT_CLASSE("Établissements Classés", 5, false),
    CODE_INVESTISSEMENT("Code des Investissements", 20, true);

    private final String label;
    private final int delaiJours;
    private final boolean avantagesFiscaux;

    TypeAgrement(String label, int delaiJours, boolean avantagesFiscaux) {
        this.label = label;
        this.delaiJours = delaiJours;
        this.avantagesFiscaux = avantagesFiscaux;
    }

    public String getLabel() {
        return label;
    }

    public int getDelaiJours() {
        return delaiJours;
    }

    public boolean hasAvantagesFiscaux() {
        return avantagesFiscaux;
    }
}
