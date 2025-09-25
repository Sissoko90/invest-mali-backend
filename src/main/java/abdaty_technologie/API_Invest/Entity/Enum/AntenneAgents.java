package abdaty_technologie.API_Invest.Entity.Enum;

// Antenne / Agence (exemples Mali, étends si besoin)
public enum AntenneAgents {
    BAMAKO("Bamako"),
    KAYES("Kayes"),  
    KOULIKORO("Koulikoro"),  
    SIKASSO("Sikasso"),  
    SÉGOU("Segou"),  
    MOPTI("Mopti"),  
    TOMBOUCTOU("Tombouctou"),  
    GAO("Gao"),  
    KIDAL("Kidal"),  
    TAOUDÉNIT("Taoudenit"),  
    MÉNAKA("Menaka"),  
    NIORO("Nioro"),  
    BOUGOUNI("Bougouni"),  
    DIOÏLA("Dioila"),  
    KOUTIALA("Koutiala"),  
    KITA("Kitaa"),  
    NARA("Nara"),  
    BANDIAGARA("Bandiagara"),  
    SAN("San"),  
    DOUENTZA("Douentza");

    private final String value;

    AntenneAgents(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
