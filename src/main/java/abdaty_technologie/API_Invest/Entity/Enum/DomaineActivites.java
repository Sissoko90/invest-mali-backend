package abdaty_technologie.API_Invest.Entity.Enum;

// Domaine d’activité (macro-familles)
public enum DomaineActivites {
   
    ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS(
        "Administrateurs et Agents Immobiliers",
        DomaineActiviteNr.ACTIVITES_AGENCES_IMMOBILIERES
    ),
    ARCHITECTE(
        "Architecte",
        DomaineActiviteNr.ACTIVITES_ARCHITECTURE_INGENIERIE
    ),
    BTP(
        "BTP",
        DomaineActiviteNr.CONSTRUCTION_BATIMENTS_COMPLETS
    ),
    CARTOGRAPHIE_TOPOGRAPHIE(
        "Cartographie / Topographie",
        DomaineActiviteNr.ACTIVITES_CONTROLE_ANALYSES
    ),
    GEOMETRES_EXPERTS(
        "Géomètres-Experts",
        DomaineActiviteNr.ACTIVITES_ARCHITECTURE_INGENIERIE
    ),
    INGENIEUR_CONSEIL(
        "Ingénieur-Conseil",
        DomaineActiviteNr.ACTIVITES_ARCHITECTURE_INGENIERIE
    ),
    PRODUCTEUR_DE_SPECTACLES(
        "Producteur de Spectacles",
        DomaineActiviteNr.ACTIVITES_CREATIVES_ARTISTIQUES
    ),
    PROMOTEUR_IMMOBILIER(
        "Promoteur Immobilier",
        DomaineActiviteNr.PROMOTION_IMMOBILIERE
    ),
    STATIONS(
        "Stations (ex. stations-service)",
        DomaineActiviteNr.COMMERCE_DETAIL_CARBURANTS
    ),
    TRANSPORT(
        "Transport",
        DomaineActiviteNr.TRANSPORTS_ROUTIERS_PASSAGERS
    ),
    URBANISTE(
        "Urbaniste",
        DomaineActiviteNr.ACTIVITES_ARCHITECTURE_INGENIERIE
    ),
    ETABLISSEMENT_DE_TOURISME(
        "Établissement de tourisme",
        DomaineActiviteNr.HEBERGEMENT
    ),
    AGENCE_DE_VOYAGE(
        "Agence de voyage",
        DomaineActiviteNr.ACTIVITES_AGENCES_RESERVATION
    ),
    
    // Nouveaux domaines d'activité basés sur les données en base
    ELEVAGE(
        "Élevage",
        DomaineActiviteNr.ELEVAGE
    ),
    ACTIVITES_SOUTIEN_AGRICULTURE(
        "Activités de soutien à l'agriculture",
        DomaineActiviteNr.ACTIVITES_SOUTIEN_AGRICULTURE
    ),
    HEVEA_CULTURE(
        "Culture d'hévéa",
        DomaineActiviteNr.HEVEA_CULTURE
    ),
    FABRICATION_CARTON_ONDULE(
        "Fabrication de carton ondulé",
        DomaineActiviteNr.FABRICATION_CARTON_ONDULE
    ),
    FABRICATION_AUTRES_PRODUITS_CERAMIQUES(
        "Fabrication d'autres produits céramiques",
        DomaineActiviteNr.FABRICATION_AUTRES_PRODUITS_CERAMIQUES
    ),
    TISSAGE_TEXTILE(
        "Tissage textile",
        DomaineActiviteNr.TISSAGE_TEXTILE
    );

    private final String value;
    private final DomaineActiviteNr parent;

    DomaineActivites(String value, DomaineActiviteNr parent) {
        this.value = value;
        this.parent = parent;
    }

    public String getValue() {
        return value;
    }

    public DomaineActiviteNr getParent() {
        return parent;
    }

    /** Recherche par libellé exact (insensible à la casse et aux espaces) */
    public static DomaineActivites fromLabel(String label) {
        if (label == null) return null;
        String norm = label.trim().toLowerCase();
        for (DomaineActivites d : values()) {
            if (d.value.toLowerCase().equals(norm)) {
                return d;
            }
        }
        return null;
    }
}

