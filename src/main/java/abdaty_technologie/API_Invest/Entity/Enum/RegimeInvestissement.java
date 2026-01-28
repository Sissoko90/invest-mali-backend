package abdaty_technologie.API_Invest.Entity.Enum;

public enum RegimeInvestissement {
    REGIME_A("Régime A", 350000),
    REGIME_B("Régime B", 450000),
    REGIME_C("Régime C", 550000),
    REGIME_D("Régime D", 600000);

    private final String libelle;
    private final int montantDepot;

    RegimeInvestissement(String libelle, int montantDepot) {
        this.libelle = libelle;
        this.montantDepot = montantDepot;
    }

    public String getLibelle() {
        return libelle;
    }

    public int getMontantDepot() {
        return montantDepot;
    }

    public String getDescription() {
        return libelle + " - " + montantDepot + " FCFA";
    }
}
