package abdaty_technologie.API_Invest.Entity.Enum;

// Domaine d’activité (macro-familles)
public enum DomaineActivites {
    Administrateurs_et_Agents_Immobiliers ("Administrateurs et Agents Immobiliers"), 
    Architecte ("Architecte"),
    BTP ("BTP"),
    Cartographie_Topographie ("Cartographie Topographie"),
    Geometres_Experts ("Géomètres - Experts"),
    Ingenieur_Conseil ("Ingénieur - Conseil"),
    Producteur_de_Spectacles ("Producteur de Spectacles"),
    Promoteur_Immobilier ("Promoteur Immobilier"),
    Stations ("Stations"),
    Transport ("Transport"),
    Urbaniste ("Urbaniste"),
    Etablissement_de_tourisme ("Établissement de tourisme"),
    Agence_de_voyage ("Agence de voyage");    


    private final String value;

    DomaineActivites(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

