package abdaty_technologie.API_Invest.Entity.Enum;

// Forme juridique
public enum FormeJuridique {
    SARL("Société à Responsabilité Limitée"),
    SARL_UNI( "Société à Responsabilité Limitée Unipersonnelle"),
    SUC_SARL( "Succursale de SARL"),
    FIL_SARL( "Filiale de SARL"),
    SA("Société Anonyme"),
    SUC_SA( "Succursale de SA"),
    FIL_SA( "Filiale de SA"),
    SASU( "Société par Actions Simplifiées Unipersonnelle"),
    SAS( "Société par Actions Simplifiées"),
    BR( "Bureau de Représentation"),
    FIL_SAS( "Filiale de SAS"),
    SUC_SAS( "Succursale de SAS"),
    SNC( "Société en Nom Collectif"),
    SCS( "Société en Commandite Simple"),
    SCI( "Société Civile Immobilière"),
    SCP( "Société Civile Professionnelle"),
    GIE( "Groupement d’Intérêt Economique"),
    E_I( "Entreprise Individuelle");
    
    
    private final String value;

    FormeJuridique(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

