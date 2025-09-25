package abdaty_technologie.API_Invest.Entity.Enum;

// Forme juridique
public enum FormeJuridique {
    SARL("SARL", "Société à Responsabilité Limitée"),
    SARL_UNI("SARL-UNI", "Société à Responsabilité Limitée Unipersonnelle"),
    SUC_SARL("SUC/SARL", "Succursale de SARL"),
    FIL_SARL("FIL/SARL", "Filiale de SARL"),
    SA("SA", "Société Anonyme"),
    SUC_SA("SUC/SA", "Succursale de SA"),
    FIL_SA("FIL/SA", "Filiale de SA"),
    SASU("SASU", "Société par Actions Simplifiées Unipersonnelle"),
    SAS("SAS", "Société par Actions Simplifiées"),
    BR("BR", "Bureau de Représentation"),
    FIL_SAS("FIL/SAS", "Filiale de SAS"),
    SUC_SAS("SUC/SAS", "Succursale de SAS"),
    SNC("SNC", "Société en Nom Collectif"),
    SCS("SCS", "Société en Commandite Simple"),
    SCI("SCI", "Société Civile Immobilière"),
    SCP("SCP", "Société Civile Professionnelle"),
    GIE("GIE", "Groupement d’Intérêt Economique"),
    E_I("E_I", "Entreprise Individuelle");
    
    
    private final String value;
    private final String label;

    FormeJuridique(String value, String label) {
        this.value = value; 
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}

