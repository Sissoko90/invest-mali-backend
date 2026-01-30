<<<<<<< HEAD
package abdaty_technologie.API_Invest.Entity.Enum;

public enum TypeDemandeAgrement {
    // Nouveaux types de demandes d'autorisation d'exercice
    AGREMENT("Demande d'Agrément", 300000, "WORKFLOW_COMPLET"),
    DECISION("Demande de Décision", 150000, "WORKFLOW_DECISION"),
    ENREGISTREMENT("Enregistrement", 50000, "WORKFLOW_SIMPLE"),
    
    // Anciens types conservés pour compatibilité
    NOUVEAU("Nouvelle demande", "REGIME", "WORKFLOW_ANCIEN"),
    EXTENSION("Extension - Code des Investissements", 600000, "WORKFLOW_ANCIEN"),
    RENOUVELLEMENT("Renouvellement - Code des Investissements", 600000, "WORKFLOW_ANCIEN"),
    PROROGATION("Prorogation - Code des Investissements", 200000, "WORKFLOW_ANCIEN");

    private final String libelle;
    private final Object montantOuRegime;
    private final String workflowType;

    TypeDemandeAgrement(String libelle, Object montantOuRegime, String workflowType) {
        this.libelle = libelle;
        this.montantOuRegime = montantOuRegime;
        this.workflowType = workflowType;
    }

    public String getLibelle() {
        return libelle;
    }

    public String getWorkflowType() {
        return workflowType;
    }

    public boolean requiresRegime() {
        return "REGIME".equals(montantOuRegime);
    }

    public Integer getMontantFixe() {
        return montantOuRegime instanceof Integer ? (Integer) montantOuRegime : null;
    }

    public String getDescription() {
        if (requiresRegime()) {
            return libelle + " - Montant selon régime";
        }
        return libelle + " - " + montantOuRegime + " FCFA";
    }

    // Méthodes pour déterminer le workflow à utiliser
    public boolean isWorkflowComplet() {
        return "WORKFLOW_COMPLET".equals(workflowType);
    }

    public boolean isWorkflowDecision() {
        return "WORKFLOW_DECISION".equals(workflowType);
    }

    public boolean isWorkflowSimple() {
        return "WORKFLOW_SIMPLE".equals(workflowType);
    }
}
=======
package abdaty_technologie.API_Invest.Entity.Enum;

public enum TypeDemandeAgrement {
    // Nouveaux types de demandes d'autorisation d'exercice
    AGREMENT("Demande d'Agrément", 300000, "WORKFLOW_COMPLET"),
    DECISION("Demande de Décision", 150000, "WORKFLOW_DECISION"),
    ENREGISTREMENT("Enregistrement", 50000, "WORKFLOW_SIMPLE"),
    
    // Anciens types conservés pour compatibilité
    NOUVEAU("Nouvelle demande", "REGIME", "WORKFLOW_ANCIEN"),
    EXTENSION("Extension - Code des Investissements", 600000, "WORKFLOW_ANCIEN"),
    RENOUVELLEMENT("Renouvellement - Code des Investissements", 600000, "WORKFLOW_ANCIEN"),
    PROROGATION("Prorogation - Code des Investissements", 200000, "WORKFLOW_ANCIEN");

    private final String libelle;
    private final Object montantOuRegime;
    private final String workflowType;

    TypeDemandeAgrement(String libelle, Object montantOuRegime, String workflowType) {
        this.libelle = libelle;
        this.montantOuRegime = montantOuRegime;
        this.workflowType = workflowType;
    }

    public String getLibelle() {
        return libelle;
    }

    public String getWorkflowType() {
        return workflowType;
    }

    public boolean requiresRegime() {
        return "REGIME".equals(montantOuRegime);
    }

    public Integer getMontantFixe() {
        return montantOuRegime instanceof Integer ? (Integer) montantOuRegime : null;
    }

    public String getDescription() {
        if (requiresRegime()) {
            return libelle + " - Montant selon régime";
        }
        return libelle + " - " + montantOuRegime + " FCFA";
    }

    // Méthodes pour déterminer le workflow à utiliser
    public boolean isWorkflowComplet() {
        return "WORKFLOW_COMPLET".equals(workflowType);
    }

    public boolean isWorkflowDecision() {
        return "WORKFLOW_DECISION".equals(workflowType);
    }

    public boolean isWorkflowSimple() {
        return "WORKFLOW_SIMPLE".equals(workflowType);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
