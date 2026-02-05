package abdaty_technologie.API_Invest.Entity.Enum;

// Type de document du dossier
public enum TypeDocuments {
    ACTE_MARIAGE("Acte de mariage"),
    CERTIFICAT_RESIDENCE("Certificat de résidence"),
    DECLARATION_HONNEUR("Déclaration d'honneur"),
    REGISTRE_COMMERCE("Registre de commerce"),
    STATUS_SOCIETE("Status de société"),     
    CASIER_JUDICIAIRE("Casier judiciaire"),
    EXTRAIT_NAISSANCE("Extrait de naissance"),
    PIECE_NATIONALITE("Certificat de nationalité"),
    NIF("Numéro d'Identification Fiscale"),
    RCCM("Registre de Commerce et du Crédit Mobilier"),
    NINA("Numéro d'Identification National des Entreprises et Associations"),
    AUTRES("Autres documents");
    
    
    private final String value;

    TypeDocuments(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }

}
