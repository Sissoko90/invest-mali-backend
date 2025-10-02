package abdaty_technologie.API_Invest.Entity.Enum;

public enum DomaineActiviteNr {
    AGRICULTURE_ELEVAGE_PECHE("Agriculture, Élevage et Pêche"),
    MINES_ET_MINERAIS("Mines et Minéraux"),
    ENERGIE_ET_RESSOURCES_NATURELLES("Énergie et Ressources Naturelles"),
    INDUSTRIE_ET_TRANSFORMATION("Industrie et Transformation"),
    COMMERCE_ET_DISTRIBUTION("Commerce et Distribution"),
    TRANSPORTS_ET_LOGISTIQUE("Transports et Logistique"),
    TELECOMS_ET_TIC("Télécommunications et TIC"),
    TOURISME_CULTURE_ET_ARTISANAT("Tourisme, Culture et Artisanat"),
    SANTE_ET_PHARMACEUTIQUE("Santé et Pharmaceutique"),
    EDUCATION_ET_FORMATION("Éducation et Formation"),
    SERVICES_FINANCIERS_ET_ASSURANCES("Services Financiers et Assurances"),
    IMMOBILIER_ET_CONSTRUCTION("Immobilier et Construction (BTP)"),
    ADMINISTRATION_ET_SERVICES_PUBLICS("Administration et Services Publics"),
    ENVIRONNEMENT_ET_ECOLOGIE("Environnement et Écologie"),
    RECHERCHE_ET_INNOVATION("Recherche et Innovation"),
    INGENIERIE_ET_ETUDES("Ingénierie et Études"),
    URBANISME_ET_AMENAGEMENT("Urbanisme et Aménagement");

    private final String label;

    DomaineActiviteNr(String label) {
        this.label = label;
    }
    public String getLabel() {
        return label;
    }
    

}
