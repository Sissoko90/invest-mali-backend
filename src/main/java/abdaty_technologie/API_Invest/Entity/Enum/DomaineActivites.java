package abdaty_technologie.API_Invest.Entity.Enum;

// Domaine d’activité (macro-familles)
public enum DomaineActivites {
   
    ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS(
        "Administrateurs et Agents Immobiliers",
        DomaineActiviteNr.IMMOBILIER_ET_CONSTRUCTION
    ),
    ARCHITECTE(
        "Architecte",
        DomaineActiviteNr.INGENIERIE_ET_ETUDES
    ),
    BTP(
        "BTP",
        DomaineActiviteNr.IMMOBILIER_ET_CONSTRUCTION
    ),
    CARTOGRAPHIE_TOPOGRAPHIE(
        "Cartographie / Topographie",
        DomaineActiviteNr.INGENIERIE_ET_ETUDES
    ),
    GEOMETRES_EXPERTS(
        "Géomètres-Experts",
        DomaineActiviteNr.INGENIERIE_ET_ETUDES
    ),
    INGENIEUR_CONSEIL(
        "Ingénieur-Conseil",
        DomaineActiviteNr.INGENIERIE_ET_ETUDES
    ),
    PRODUCTEUR_DE_SPECTACLES(
        "Producteur de Spectacles",
        DomaineActiviteNr.TOURISME_CULTURE_ET_ARTISANAT
    ),
    PROMOTEUR_IMMOBILIER(
        "Promoteur Immobilier",
        DomaineActiviteNr.IMMOBILIER_ET_CONSTRUCTION
    ),
    STATIONS(
        "Stations (ex. stations-service)",
        DomaineActiviteNr.ENERGIE_ET_RESSOURCES_NATURELLES
    ),
    TRANSPORT(
        "Transport",
        DomaineActiviteNr.TRANSPORTS_ET_LOGISTIQUE
    ),
    URBANISTE(
        "Urbaniste",
        DomaineActiviteNr.URBANISME_ET_AMENAGEMENT
    ),
    ETABLISSEMENT_DE_TOURISME(
        "Établissement de tourisme",
        DomaineActiviteNr.TOURISME_CULTURE_ET_ARTISANAT
    ),
    AGENCE_DE_VOYAGE(
        "Agence de voyage",
        DomaineActiviteNr.TOURISME_CULTURE_ET_ARTISANAT
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

