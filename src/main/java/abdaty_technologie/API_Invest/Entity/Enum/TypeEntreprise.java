package abdaty_technologie.API_Invest.Entity.Enum;

// Type d’entreprise (NB: ton code référencait EnumEntreprise pour "typeEntreprise")


public enum TypeEntreprise {
    SOCIETE("Société"),
    ENTREPRISE_INDIVIDUELLE("Entreprise individuelle");
  
    private final String value;
  
    TypeEntreprise(String value) {
        this.value = value;
    }
  
    public String getValue() {
        return value;
    }
  }