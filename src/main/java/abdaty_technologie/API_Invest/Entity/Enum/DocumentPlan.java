package abdaty_technologie.API_Invest.Entity.Enum;

public enum DocumentPlan {
    _3("3 Pages"), 
    _4("4 Pages"), 
    _5("5 Pages"),
    _7("7 Pages");
    
    private final String value;

    DocumentPlan(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
