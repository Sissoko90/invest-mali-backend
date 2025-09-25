package abdaty_technologie.API_Invest.Entity.Enum;

// Type de pièce d'identité
public enum TypePieces {
    CNI("Carte Nationale d’Identité"),                // Carte Nationale d’Identité
    PASSEPORT("Passeport"),
    PERMIS_CONDUIRE("Permis de conduire"),
    CARTE_CONSULAIRE("Carte consulatère"),
    CARTE_ELECTEUR("Carte électorale");
    
    private final String value;

    TypePieces(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }

}
