<<<<<<< HEAD
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
=======
package abdaty_technologie.API_Invest.Entity.Enum;

// Type de document du dossier
public enum TypeDocuments {
    ACTE_MARIAGE("Acte de mariage"),
    CERTIFICAT_RESIDENCE("Certificat de résidence"),
    DECLARATION_HONNEUR("Déclaration d'honneur"),
    REGISTRE_COMMERCE("Registre de commerce"),
    STATUS_SOCIETE("Status de société"),
    JUSTIFICATIF_CAPITAL("Justificatif de libération de capital"),
    CASIER_JUDICIAIRE("Casier judiciaire"),
    EXTRAIT_NAISSANCE("Extrait de naissance"),
    PIECE_NATIONALITE("Pièce de nationalité"),
    NIF("Numéro d'Identification Fiscale"),
    RCCM("Registre de Commerce et du Crédit Mobilier"),
    NINA("Numéro d'Identification National des Entreprises et Associations"),
    STATUTS_SOCIETE_MERE("Statuts de la société mère"),
    RCCM_SOCIETE_MERE("RCCM de la société mère"),
    PV_OUVERTURE_SUCCURSALE("PV assemblée générale - décision ouverture succursale/filiale"),
    PV_DESIGNATION_GERANT("PV assemblée générale - désignation gérant au Mali"),
    AUTRES("Autres documents");
    
    
    private final String value;

    TypeDocuments(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }

}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
