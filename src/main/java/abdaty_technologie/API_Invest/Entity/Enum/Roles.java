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
    SUPER_ADMIN("Super admin");

    private final String value;

    Roles(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
}
