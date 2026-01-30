<<<<<<< HEAD
package abdaty_technologie.API_Invest.Entity.Enum;

// Rôles des utilisateurs
public enum Roles {
    USER("User"),   
    AGENT_ACCEUIL("Agent accueil"),  
    AGENT_REGISTER("Agent register"),
    AGENT_REVISION("Agent revision"),
    AGENT_IMPOT("Agent impot"),
    AGENT_RCCM1("Agent RCCM1"),
    AGENT_RCCM2("Agent RCCM2"),
    AGENT_NINA("Agent NINA"),
    AGENT_RETRAIT("Agent retrait"),
    AGENT_NOTAIRE("Agent notaire"),
    AGENT_TCOM("Agent T-COM"),
    REGISSEUR("Régisseur"),
    
    // Rôles pour le processus d'agrément
    AGENT_AGREMENT_ACCUEIL("Agent Agrément Accueil"),
    AGENT_AGREMENT_REVISION("Agent Agrément Révision"),
    AGENT_REGISSEUR("Agent Régisseur"),
    AGENT_AGREMENT_RETRAIT("Agent Agrément Retrait"),
    
    // Rôles ministères (créés par SUPER_ADMIN)
    MINISTERE_TRANSPORT("Ministère des Transports"),
    MINISTERE_TOURISME("Ministère du Tourisme"),
    MINISTERE_COMMERCE("Ministère du Commerce"),
    MINISTERE_INDUSTRIE("Ministère de l'Industrie"),
    MINISTERE_ENVIRONNEMENT("Ministère de l'Environnement"),
    MINISTERE_URBANISME("Ministère de l'Urbanisme"),
    
    SUPER_ADMIN("Super admin");

    private final String value;

    Roles(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}
=======
package abdaty_technologie.API_Invest.Entity.Enum;

// Rôles des utilisateurs
public enum Roles {
    USER("User"),   
    AGENT_ACCEUIL("Agent accueil"),  
    AGENT_REGISTER("Agent register"),
    AGENT_REVISION("Agent revision"),
    AGENT_IMPOT("Agent impot"),
    AGENT_RCCM1("Agent RCCM1"),
    AGENT_RCCM2("Agent RCCM2"),
    AGENT_NINA("Agent NINA"),
    AGENT_RETRAIT("Agent retrait"),
    AGENT_NOTAIRE("Agent notaire"),
    AGENT_TCOM("Agent T-COM"),
    REGISSEUR("Régisseur"),
    
    // Rôles pour le processus d'agrément
    AGENT_AGREMENT_ACCUEIL("Agent Agrément Accueil"),
    AGENT_AGREMENT_REVISION("Agent Agrément Révision"),
    AGENT_REGISSEUR("Agent Régisseur"),
    AGENT_AGREMENT_RETRAIT("Agent Agrément Retrait"),
    
    // Rôles ministères (créés par SUPER_ADMIN)
    MINISTERE_TRANSPORT("Ministère des Transports"),
    MINISTERE_TOURISME("Ministère du Tourisme"),
    MINISTERE_COMMERCE("Ministère du Commerce"),
    MINISTERE_INDUSTRIE("Ministère de l'Industrie"),
    MINISTERE_ENVIRONNEMENT("Ministère de l'Environnement"),
    MINISTERE_URBANISME("Ministère de l'Urbanisme"),
    
    SUPER_ADMIN("Super admin");

    private final String value;

    Roles(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
