package abdaty_technologie.API_Invest.Entity.Enum;

// Étapes de validation du circuit
public enum EtapeValidation {
    // Étapes du workflow de création d'entreprise
    ACCUEIL("Accueil"),
    PAIEMENT_AGENT("Paiement Agent"),
    REGISSEUR("Regisseur"),
    REVISION("Revision"),
    IMPOTS("Impots"),
    RCCM1("RCCM1"),
    TCOM("TCOM"),
    RCCM2("RCCM2"),
    NINA("NINA"),
    RETRAIT("Retrait"),
    
    // Étapes du workflow d'agrément (autorisation d'exercice) - Anciennes
    ACCUEIL_AGREMENT("Accueil Agrément"),
    REVISION_AGREMENT("Révision Agrément"),
    REGISSEUR_AGREMENT("Régisseur Agrément"),
    PAIEMENT_EN_ATTENTE_AGREMENT("Paiement en Attente"),
    MINISTERE_AGREMENT("Ministère Agrément"),
    RETRAIT_AGREMENT("Retrait Agrément"),
    AGREMENT_COMPLETE("Agrément Complet"),
    
    // Nouvelles étapes pour les workflows d'autorisation d'exercice
    // Workflow Agrément complet: Accueil(paiement) -> MIC -> MF -> SGG -> Présidence -> SGG -> MIC -> Accueil -> Usager
    ACCUEIL_AGREMENT_PAIEMENT("Accueil Agrément - Paiement"),
    MIC_PREMIERE_VALIDATION("MIC - Première Validation"),
    MINISTERE_FINANCES("Ministère des Finances"),
    SGG_PREMIERE_VALIDATION("SGG - Première Validation"),
    PRESIDENCE("Présidence de la République"),
    SGG_SECONDE_VALIDATION("SGG - Seconde Validation"),
    MIC_SECONDE_VALIDATION("MIC - Seconde Validation"),
    ACCUEIL_RETOUR_AGREMENT("Accueil - Retour Agrément"),
    
    // Workflow Décision: Accueil -> MIC -> SGG -> MIC -> Accueil -> Usager
    ACCUEIL_DECISION("Accueil Décision"),
    MIC_DECISION("MIC - Décision"),
    SGG_DECISION("SGG - Décision"),
    MIC_RETOUR_DECISION("MIC - Retour Décision"),
    ACCUEIL_RETOUR_DECISION("Accueil - Retour Décision"),
    
    // Workflow Enregistrement: Accueil -> Usager (direct)
    ACCUEIL_ENREGISTREMENT("Accueil Enregistrement"),
    ENREGISTREMENT_COMPLETE("Enregistrement Complet");

    private final String value;

    EtapeValidation(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

