<<<<<<< HEAD
package abdaty_technologie.API_Invest.Entity.Enum;

/**
 * Domaines d'activité selon la classification OHADA
 * Basé sur le fichier OhadaActivite.xlsx
 */
public enum DomaineActivitesOHADA {
    
    // Section A - Agriculture, sylviculture et pêche
    CULTURE_CEREALES_LEGUMINEUSES_OLEAGINEUX("01110", "Culture de céréales (à l'exception du riz), de légumineuses et de graines oléagineuses", "A"),
    CULTURE_RIZ("01120", "Culture du riz", "A"),
    CULTURE_LEGUMES_MELONS_RACINES_TUBERCULES("01130", "Culture de légumes, de melons, de racines et de tubercules", "A"),
    CULTURE_CANNE_SUCRE("01140", "Culture de la canne à sucre", "A"),
    CULTURE_TABAC("01150", "Culture du tabac", "A"),
    CULTURE_PLANTES_FIBRES("01160", "Culture de plantes à fibres", "A"),
    AUTRES_CULTURES_NON_PERMANENTES("01190", "Autres cultures non permanentes", "A"),
    CULTURE_RAISIN("01210", "Culture de la vigne", "A"),
    CULTURE_FRUITS_TROPICAUX_SUBTROPICAUX("01220", "Culture de fruits tropicaux et subtropicaux", "A"),
    CULTURE_AGRUMES("01230", "Culture d'agrumes", "A"),
    CULTURE_FRUITS_PEPINS_NOYAU("01240", "Culture de fruits à pépins et à noyau", "A"),
    CULTURE_FRUITS_ROUGES_COQUE_AUTRES("01250", "Culture de fruits rouges, à coque et d'autres fruits", "A"),
    CULTURE_FRUITS_OLEAGINEUX("01260", "Culture de fruits oléagineux", "A"),
    CULTURE_PLANTES_BOISSONS("01270", "Culture de plantes à boissons", "A"),
    CULTURE_EPICES_PLANTES_AROMATIQUES_MEDICINALES("01280", "Culture d'épices, de plantes aromatiques, médicinales et pharmaceutiques", "A"),
    AUTRES_CULTURES_PERMANENTES("01290", "Autres cultures permanentes", "A"),
    REPRODUCTION_PLANTES("01300", "Reproduction de plantes", "A"),
    ELEVAGE_BOVINS_LAITIERS("01410", "Élevage de bovins laitiers", "A"),
    ELEVAGE_AUTRES_BOVINS_BUFFLES("01420", "Élevage d'autres bovins et de buffles", "A"),
    ELEVAGE_CHEVAUX_AUTRES_EQUIDES("01430", "Élevage de chevaux et d'autres équidés", "A"),
    ELEVAGE_CHAMEAUX_AUTRES_CAMELIDES("01440", "Élevage de chameaux et d'autres camélidés", "A"),
    ELEVAGE_OVINS_CAPRINS("01450", "Élevage d'ovins et de caprins", "A"),
    ELEVAGE_PORCINS("01460", "Élevage de porcins", "A"),
    ELEVAGE_VOLAILLES("01470", "Élevage de volailles", "A"),
    ELEVAGE_AUTRES_ANIMAUX("01490", "Élevage d'autres animaux", "A"),
    CULTURE_ELEVAGE_ASSOCIES("01500", "Culture et élevage associés", "A"),
    ACTIVITES_SOUTIEN_CULTURES("01610", "Activités de soutien aux cultures", "A"),
    ACTIVITES_SOUTIEN_ELEVAGE("01620", "Activités de soutien à la production animale", "A"),
    ACTIVITES_POST_RECOLTE("01630", "Traitement primaire des récoltes", "A"),
    PREPARATION_SEMENCES("01640", "Préparation de semences", "A"),
    CHASSE_PIEGEAGE_SERVICES("01700", "Chasse, piégeage et services annexes", "A"),
    SYLVICULTURE_AUTRES_ACTIVITES_FORESTIERES("02100", "Sylviculture et autres activités forestières", "A"),
    EXPLOITATION_FORESTIERE("02200", "Exploitation forestière", "A"),
    RECOLTE_PRODUITS_FORESTIERS_NON_LIGNEUX("02300", "Récolte de produits forestiers non ligneux poussant à l'état sauvage", "A"),
    SERVICES_SOUTIEN_FORESTIERS("02400", "Services de soutien à l'exploitation forestière", "A"),
    PECHE_EN_MER("03110", "Pêche en mer", "A"),
    PECHE_EN_EAU_DOUCE("03120", "Pêche en eau douce", "A"),
    AQUACULTURE_EN_MER("03210", "Aquaculture en mer", "A"),
    AQUACULTURE_EN_EAU_DOUCE("03220", "Aquaculture en eau douce", "A"),

    // Section B - Industries extractives
    EXTRACTION_HOUILLE("05100", "Extraction de houille", "B"),
    EXTRACTION_LIGNITE("05200", "Extraction de lignite", "B"),
    EXTRACTION_PETROLE_BRUT("06100", "Extraction de pétrole brut", "B"),
    EXTRACTION_GAZ_NATUREL("06200", "Extraction de gaz naturel", "B"),
    EXTRACTION_MINERAIS_FER("07100", "Extraction de minerais de fer", "B"),
    EXTRACTION_MINERAIS_METAUX_NON_FERREUX("07290", "Extraction d'autres minerais de métaux non ferreux", "B"),
    EXTRACTION_PIERRES_ORNEMENTALES("08110", "Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d'ardoise", "B"),
    EXPLOITATION_GRAVIERES_SABLIERES("08120", "Exploitation de gravières et sablières, extraction d'argiles et de kaolin", "B"),
    EXTRACTION_MINERAUX_INDUSTRIE_CHIMIQUE("08910", "Extraction de minéraux pour l'industrie chimique et d'engrais naturels", "B"),
    EXTRACTION_TOURBE("08920", "Extraction de tourbe", "B"),
    EXTRACTION_SEL("08930", "Production de sel", "B"),
    AUTRES_INDUSTRIES_EXTRACTIVES("08990", "Autres industries extractives n.c.a.", "B"),
    ACTIVITES_SOUTIEN_EXTRACTION_HYDROCARBURES("09100", "Activités de soutien à l'extraction d'hydrocarbures", "B"),
    ACTIVITES_SOUTIEN_AUTRES_INDUSTRIES_EXTRACTIVES("09900", "Activités de soutien aux autres industries extractives", "B"),

    // Section C - Activités de fabrication
    TRANSFORMATION_CONSERVATION_VIANDE("10110", "Transformation et conservation de la viande de boucherie", "C"),
    TRANSFORMATION_CONSERVATION_VOLAILLE("10120", "Transformation et conservation de la viande de volaille", "C"),
    PREPARATION_PRODUITS_BASE_VIANDE("10130", "Préparation de produits à base de viande", "C"),
    TRANSFORMATION_CONSERVATION_POISSON("10200", "Transformation et conservation de poisson, de crustacés et de mollusques", "C"),
    TRANSFORMATION_CONSERVATION_POMMES_TERRE("10310", "Transformation et conservation de pommes de terre", "C"),
    PREPARATION_JUS_FRUITS_LEGUMES("10320", "Préparation de jus de fruits et légumes", "C"),
    AUTRE_TRANSFORMATION_CONSERVATION_FRUITS_LEGUMES("10390", "Autre transformation et conservation de fruits et légumes", "C"),
    FABRICATION_HUILES_GRAISSES_ORIGINE_VEGETALE("10410", "Fabrication d'huiles et graisses d'origine végétale", "C"),
    FABRICATION_HUILES_GRAISSES_ORIGINE_ANIMALE("10420", "Fabrication d'huiles et graisses d'origine animale", "C"),
    FABRICATION_MARGARINE_GRAISSES_COMESTIBLES("10430", "Fabrication de margarine et graisses comestibles similaires", "C"),
    FABRICATION_PRODUITS_LAITIERS("10500", "Fabrication de produits laitiers", "C"),
    TRAVAIL_GRAINS_FABRICATION_PRODUITS_AMYLACES("10610", "Travail des grains ; fabrication de produits amylacés", "C"),
    FABRICATION_PRODUITS_BOULANGERIE_PATISSERIE("10710", "Fabrication de pain et de pâtisserie fraîche", "C"),
    FABRICATION_BISCOTTES_BISCUITS("10720", "Fabrication de biscottes, biscuits, pâtisserie de conservation", "C"),
    FABRICATION_PATES_ALIMENTAIRES("10730", "Fabrication de pâtes alimentaires", "C"),
    FABRICATION_SUCRE("10810", "Fabrication de sucre", "C"),
    FABRICATION_CACAO_CHOCOLAT_CONFISERIE("10820", "Fabrication de cacao, chocolat et de produits de confiserie", "C"),
    TRANSFORMATION_THE_CAFE("10830", "Transformation du thé et du café", "C"),
    FABRICATION_CONDIMENTS_ASSAISONNEMENTS("10840", "Fabrication de condiments et assaisonnements", "C"),
    FABRICATION_PLATS_PREPARES("10850", "Fabrication de plats préparés", "C"),
    FABRICATION_ALIMENTS_HOMOGENEISES_DIETETIQUES("10860", "Fabrication d'aliments homogénéisés et diététiques", "C"),
    FABRICATION_AUTRES_PRODUITS_ALIMENTAIRES("10890", "Fabrication d'autres produits alimentaires n.c.a.", "C"),
    FABRICATION_ALIMENTS_ANIMAUX_FERME("10910", "Fabrication d'aliments pour animaux de ferme", "C"),
    FABRICATION_ALIMENTS_ANIMAUX_COMPAGNIE("10920", "Fabrication d'aliments pour animaux de compagnie", "C"),
    DISTILLATION_RECTIFICATION_MELANGE_SPIRITUEUX("11010", "Distillation, rectification et mélange de spiritueux", "C"),
    FABRICATION_VIN_RAISIN("11020", "Fabrication de vin de raisin", "C"),
    FABRICATION_AUTRES_BOISSONS_FERMENTEES("11030", "Fabrication d'autres boissons fermentées", "C"),
    FABRICATION_AUTRES_BOISSONS_NON_DISTILLEES("11040", "Fabrication d'autres boissons non distillées, fermentées", "C"),
    FABRICATION_BIERE("11050", "Fabrication de bière", "C"),
    FABRICATION_MALT("11060", "Fabrication de malt", "C"),
    PRODUCTION_EAUX_MINERALES_AUTRES_BOISSONS("11070", "Production d'eaux minérales et d'autres eaux embouteillées", "C"),
    FABRICATION_BOISSONS_RAFRAICHISSANTES("11080", "Fabrication de boissons rafraîchissantes", "C"),
    FABRICATION_PRODUITS_TABAC("12000", "Fabrication de produits à base de tabac", "C"),

    // Section G - Commerce ; réparation d'automobiles et de motocycles
    COMMERCE_AUTOMOBILES_VEHICULES_LEGERS("45110", "Commerce de voitures et de véhicules automobiles légers", "G"),
    COMMERCE_AUTRES_VEHICULES_AUTOMOBILES("45190", "Commerce d'autres véhicules automobiles", "G"),
    ENTRETIEN_REPARATION_VEHICULES_AUTOMOBILES("45200", "Entretien et réparation de véhicules automobiles", "G"),
    COMMERCE_EQUIPEMENTS_AUTOMOBILES("45310", "Commerce de gros d'équipements automobiles", "G"),
    COMMERCE_DETAIL_EQUIPEMENTS_AUTOMOBILES("45320", "Commerce de détail d'équipements automobiles", "G"),
    COMMERCE_MOTOCYCLES("45400", "Commerce et réparation de motocycles", "G"),

    // Section H - Transport et entreposage
    TRANSPORT_FERROVIAIRE_INTERURBAIN_VOYAGEURS("49100", "Transport ferroviaire interurbain de voyageurs", "H"),
    TRANSPORT_FERROVIAIRE_MARCHANDISES("49200", "Transport ferroviaire de marchandises", "H"),
    TRANSPORT_URBAIN_SUBURBAIN_VOYAGEURS("49310", "Transport urbain et suburbain de voyageurs", "H"),
    TRANSPORT_TAXI("49320", "Transport de voyageurs par taxis", "H"),
    AUTRES_TRANSPORTS_TERRESTRES_VOYAGEURS("49390", "Autres transports terrestres de voyageurs n.c.a.", "H"),
    TRANSPORT_ROUTIER_MARCHANDISES("49410", "Transport routier de marchandises", "H"),
    DEMENAGEMENT("49420", "Services de déménagement", "H"),
    TRANSPORT_PIPELINE("49500", "Transport par conduites", "H"),
    TRANSPORT_MARITIME_COTIER_VOYAGEURS("50100", "Transport maritime et côtier de voyageurs", "H"),
    TRANSPORT_MARITIME_COTIER_MARCHANDISES("50200", "Transport maritime et côtier de marchandises", "H"),
    TRANSPORT_FLUVIAL_VOYAGEURS("50300", "Transport fluvial de voyageurs", "H"),
    TRANSPORT_FLUVIAL_MARCHANDISES("50400", "Transport fluvial de marchandises", "H"),
    TRANSPORT_AERIEN_VOYAGEURS("51100", "Transport aérien de voyageurs", "H"),
    TRANSPORT_AERIEN_MARCHANDISES("51200", "Transport aérien de marchandises", "H"),
    ENTREPOSAGE_STOCKAGE("52100", "Entreposage et stockage", "H"),
    ACTIVITES_AUXILIAIRES_TRANSPORTS("52290", "Autres activités auxiliaires des transports", "H"),

    // Section I - Hébergement et restauration
    HOTELS_HEBERGEMENT_SIMILAIRE("55100", "Hôtels et hébergement similaire", "I"),
    HEBERGEMENT_VACANCES_AUTRES_COURTS_SEJOURS("55200", "Hébergement de vacances et autres hébergements de courte durée", "I"),
    TERRAINS_CAMPING_PARCS_CARAVANES("55300", "Terrains de camping et parcs pour caravanes ou véhicules de loisirs", "I"),
    AUTRES_HEBERGEMENTS("55900", "Autres hébergements", "I"),
    RESTAURANTS_SERVICES_RESTAURATION_MOBILES("56100", "Restaurants et services de restauration mobile", "I"),
    TRAITEURS_AUTRES_SERVICES_RESTAURATION("56210", "Services de traiteurs", "I"),
    AUTRES_SERVICES_RESTAURATION("56290", "Autres services de restauration", "I"),
    DEBITS_BOISSONS("56300", "Débits de boissons", "I"),

    // Section J - Information et communication
    EDITION_LIVRES("58110", "Édition de livres", "J"),
    EDITION_JOURNAUX("58130", "Édition de journaux", "J"),
    EDITION_REVUES_PERIODIQUES("58140", "Édition de revues et périodiques", "J"),
    AUTRES_ACTIVITES_EDITION("58190", "Autres activités d'édition", "J"),
    EDITION_JEUX_ELECTRONIQUES("58210", "Édition de jeux électroniques", "J"),
    AUTRES_EDITIONS_LOGICIELS("58290", "Édition d'autres logiciels", "J"),
    PRODUCTION_FILMS_CINEMATOGRAPHIQUES("59110", "Production de films cinématographiques, de vidéo et de programmes de télévision", "J"),
    POSTPRODUCTION_FILMS_CINEMATOGRAPHIQUES("59120", "Post-production de films cinématographiques, de vidéo et de programmes de télévision", "J"),
    DISTRIBUTION_FILMS_CINEMATOGRAPHIQUES("59130", "Distribution de films cinématographiques, de vidéo et de programmes de télévision", "J"),
    PROJECTION_FILMS_CINEMATOGRAPHIQUES("59140", "Projection de films cinématographiques", "J"),
    ENREGISTREMENT_SONORE("59200", "Enregistrement sonore et édition musicale", "J"),
    DIFFUSION_PROGRAMMES_RADIO("60100", "Diffusion de programmes radio", "J"),
    PROGRAMMATION_DIFFUSION_TELEVISION("60200", "Programmation de télévision et télédiffusion", "J"),
    TELECOMMUNICATIONS_FILAIRES("61100", "Télécommunications filaires", "J"),
    TELECOMMUNICATIONS_SANS_FIL("61200", "Télécommunications sans fil", "J"),
    TELECOMMUNICATIONS_SATELLITE("61300", "Télécommunications par satellite", "J"),
    AUTRES_TELECOMMUNICATIONS("61900", "Autres télécommunications", "J"),
    PROGRAMMATION_INFORMATIQUE("62010", "Programmation informatique", "J"),
    CONSEIL_INFORMATIQUE("62020", "Conseil en systèmes et logiciels informatiques", "J"),
    GESTION_INSTALLATIONS_INFORMATIQUES("62030", "Gestion d'installations informatiques", "J"),
    AUTRES_ACTIVITES_SERVICES_INFORMATIQUES("62090", "Autres activités de services informatiques", "J"),
    TRAITEMENT_DONNEES_HEBERGEMENT("63110", "Traitement de données, hébergement et activités connexes", "J"),
    PORTAILS_WEB("63120", "Portails Web", "J"),
    AGENCES_PRESSE("63910", "Agences de presse", "J"),
    AUTRES_SERVICES_INFORMATION("63990", "Autres services d'information n.c.a.", "J");

    private final String code;
    private final String libelle;
    private final String section;

    DomaineActivitesOHADA(String code, String libelle, String section) {
        this.code = code;
        this.libelle = libelle;
        this.section = section;
    }

    public String getCode() {
        return code;
    }

    public String getLibelle() {
        return libelle;
    }

    public String getSection() {
        return section;
    }

    public String getValue() {
        return libelle;
    }

    /** Recherche par code exact */
    public static DomaineActivitesOHADA fromCode(String code) {
        if (code == null) return null;
        for (DomaineActivitesOHADA d : values()) {
            if (d.code.equals(code.trim())) {
                return d;
            }
        }
        return null;
    }

    /** Recherche par libellé exact (insensible à la casse et aux espaces) */
    public static DomaineActivitesOHADA fromLibelle(String libelle) {
        if (libelle == null) return null;
        String norm = libelle.trim().toLowerCase();
        for (DomaineActivitesOHADA d : values()) {
            if (d.libelle.toLowerCase().equals(norm)) {
                return d;
            }
        }
        return null;
    }

    /** Recherche par libellé exact (pour compatibilité avec l'ancien code) */
    public static DomaineActivitesOHADA fromLabel(String label) {
        return fromLibelle(label);
    }

    /** Recherche par section */
    public static DomaineActivitesOHADA[] fromSection(String section) {
        if (section == null) return new DomaineActivitesOHADA[0];
        return java.util.Arrays.stream(values())
                .filter(d -> d.section.equals(section.trim().toUpperCase()))
                .toArray(DomaineActivitesOHADA[]::new);
    }

    /** Obtenir toutes les sections disponibles */
    public static String[] getSections() {
        return java.util.Arrays.stream(values())
                .map(d -> d.section)
                .distinct()
                .sorted()
                .toArray(String[]::new);
    }
}
=======
package abdaty_technologie.API_Invest.Entity.Enum;

/**
 * Domaines d'activité selon la classification OHADA
 * Basé sur le fichier OhadaActivite.xlsx
 */
public enum DomaineActivitesOHADA {
    
    // Section A - Agriculture, sylviculture et pêche
    CULTURE_CEREALES_LEGUMINEUSES_OLEAGINEUX("01110", "Culture de céréales (à l'exception du riz), de légumineuses et de graines oléagineuses", "A"),
    CULTURE_RIZ("01120", "Culture du riz", "A"),
    CULTURE_LEGUMES_MELONS_RACINES_TUBERCULES("01130", "Culture de légumes, de melons, de racines et de tubercules", "A"),
    CULTURE_CANNE_SUCRE("01140", "Culture de la canne à sucre", "A"),
    CULTURE_TABAC("01150", "Culture du tabac", "A"),
    CULTURE_PLANTES_FIBRES("01160", "Culture de plantes à fibres", "A"),
    AUTRES_CULTURES_NON_PERMANENTES("01190", "Autres cultures non permanentes", "A"),
    CULTURE_RAISIN("01210", "Culture de la vigne", "A"),
    CULTURE_FRUITS_TROPICAUX_SUBTROPICAUX("01220", "Culture de fruits tropicaux et subtropicaux", "A"),
    CULTURE_AGRUMES("01230", "Culture d'agrumes", "A"),
    CULTURE_FRUITS_PEPINS_NOYAU("01240", "Culture de fruits à pépins et à noyau", "A"),
    CULTURE_FRUITS_ROUGES_COQUE_AUTRES("01250", "Culture de fruits rouges, à coque et d'autres fruits", "A"),
    CULTURE_FRUITS_OLEAGINEUX("01260", "Culture de fruits oléagineux", "A"),
    CULTURE_PLANTES_BOISSONS("01270", "Culture de plantes à boissons", "A"),
    CULTURE_EPICES_PLANTES_AROMATIQUES_MEDICINALES("01280", "Culture d'épices, de plantes aromatiques, médicinales et pharmaceutiques", "A"),
    AUTRES_CULTURES_PERMANENTES("01290", "Autres cultures permanentes", "A"),
    REPRODUCTION_PLANTES("01300", "Reproduction de plantes", "A"),
    ELEVAGE_BOVINS_LAITIERS("01410", "Élevage de bovins laitiers", "A"),
    ELEVAGE_AUTRES_BOVINS_BUFFLES("01420", "Élevage d'autres bovins et de buffles", "A"),
    ELEVAGE_CHEVAUX_AUTRES_EQUIDES("01430", "Élevage de chevaux et d'autres équidés", "A"),
    ELEVAGE_CHAMEAUX_AUTRES_CAMELIDES("01440", "Élevage de chameaux et d'autres camélidés", "A"),
    ELEVAGE_OVINS_CAPRINS("01450", "Élevage d'ovins et de caprins", "A"),
    ELEVAGE_PORCINS("01460", "Élevage de porcins", "A"),
    ELEVAGE_VOLAILLES("01470", "Élevage de volailles", "A"),
    ELEVAGE_AUTRES_ANIMAUX("01490", "Élevage d'autres animaux", "A"),
    CULTURE_ELEVAGE_ASSOCIES("01500", "Culture et élevage associés", "A"),
    ACTIVITES_SOUTIEN_CULTURES("01610", "Activités de soutien aux cultures", "A"),
    ACTIVITES_SOUTIEN_ELEVAGE("01620", "Activités de soutien à la production animale", "A"),
    ACTIVITES_POST_RECOLTE("01630", "Traitement primaire des récoltes", "A"),
    PREPARATION_SEMENCES("01640", "Préparation de semences", "A"),
    CHASSE_PIEGEAGE_SERVICES("01700", "Chasse, piégeage et services annexes", "A"),
    SYLVICULTURE_AUTRES_ACTIVITES_FORESTIERES("02100", "Sylviculture et autres activités forestières", "A"),
    EXPLOITATION_FORESTIERE("02200", "Exploitation forestière", "A"),
    RECOLTE_PRODUITS_FORESTIERS_NON_LIGNEUX("02300", "Récolte de produits forestiers non ligneux poussant à l'état sauvage", "A"),
    SERVICES_SOUTIEN_FORESTIERS("02400", "Services de soutien à l'exploitation forestière", "A"),
    PECHE_EN_MER("03110", "Pêche en mer", "A"),
    PECHE_EN_EAU_DOUCE("03120", "Pêche en eau douce", "A"),
    AQUACULTURE_EN_MER("03210", "Aquaculture en mer", "A"),
    AQUACULTURE_EN_EAU_DOUCE("03220", "Aquaculture en eau douce", "A"),

    // Section B - Industries extractives
    EXTRACTION_HOUILLE("05100", "Extraction de houille", "B"),
    EXTRACTION_LIGNITE("05200", "Extraction de lignite", "B"),
    EXTRACTION_PETROLE_BRUT("06100", "Extraction de pétrole brut", "B"),
    EXTRACTION_GAZ_NATUREL("06200", "Extraction de gaz naturel", "B"),
    EXTRACTION_MINERAIS_FER("07100", "Extraction de minerais de fer", "B"),
    EXTRACTION_MINERAIS_METAUX_NON_FERREUX("07290", "Extraction d'autres minerais de métaux non ferreux", "B"),
    EXTRACTION_PIERRES_ORNEMENTALES("08110", "Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d'ardoise", "B"),
    EXPLOITATION_GRAVIERES_SABLIERES("08120", "Exploitation de gravières et sablières, extraction d'argiles et de kaolin", "B"),
    EXTRACTION_MINERAUX_INDUSTRIE_CHIMIQUE("08910", "Extraction de minéraux pour l'industrie chimique et d'engrais naturels", "B"),
    EXTRACTION_TOURBE("08920", "Extraction de tourbe", "B"),
    EXTRACTION_SEL("08930", "Production de sel", "B"),
    AUTRES_INDUSTRIES_EXTRACTIVES("08990", "Autres industries extractives n.c.a.", "B"),
    ACTIVITES_SOUTIEN_EXTRACTION_HYDROCARBURES("09100", "Activités de soutien à l'extraction d'hydrocarbures", "B"),
    ACTIVITES_SOUTIEN_AUTRES_INDUSTRIES_EXTRACTIVES("09900", "Activités de soutien aux autres industries extractives", "B"),

    // Section C - Activités de fabrication
    TRANSFORMATION_CONSERVATION_VIANDE("10110", "Transformation et conservation de la viande de boucherie", "C"),
    TRANSFORMATION_CONSERVATION_VOLAILLE("10120", "Transformation et conservation de la viande de volaille", "C"),
    PREPARATION_PRODUITS_BASE_VIANDE("10130", "Préparation de produits à base de viande", "C"),
    TRANSFORMATION_CONSERVATION_POISSON("10200", "Transformation et conservation de poisson, de crustacés et de mollusques", "C"),
    TRANSFORMATION_CONSERVATION_POMMES_TERRE("10310", "Transformation et conservation de pommes de terre", "C"),
    PREPARATION_JUS_FRUITS_LEGUMES("10320", "Préparation de jus de fruits et légumes", "C"),
    AUTRE_TRANSFORMATION_CONSERVATION_FRUITS_LEGUMES("10390", "Autre transformation et conservation de fruits et légumes", "C"),
    FABRICATION_HUILES_GRAISSES_ORIGINE_VEGETALE("10410", "Fabrication d'huiles et graisses d'origine végétale", "C"),
    FABRICATION_HUILES_GRAISSES_ORIGINE_ANIMALE("10420", "Fabrication d'huiles et graisses d'origine animale", "C"),
    FABRICATION_MARGARINE_GRAISSES_COMESTIBLES("10430", "Fabrication de margarine et graisses comestibles similaires", "C"),
    FABRICATION_PRODUITS_LAITIERS("10500", "Fabrication de produits laitiers", "C"),
    TRAVAIL_GRAINS_FABRICATION_PRODUITS_AMYLACES("10610", "Travail des grains ; fabrication de produits amylacés", "C"),
    FABRICATION_PRODUITS_BOULANGERIE_PATISSERIE("10710", "Fabrication de pain et de pâtisserie fraîche", "C"),
    FABRICATION_BISCOTTES_BISCUITS("10720", "Fabrication de biscottes, biscuits, pâtisserie de conservation", "C"),
    FABRICATION_PATES_ALIMENTAIRES("10730", "Fabrication de pâtes alimentaires", "C"),
    FABRICATION_SUCRE("10810", "Fabrication de sucre", "C"),
    FABRICATION_CACAO_CHOCOLAT_CONFISERIE("10820", "Fabrication de cacao, chocolat et de produits de confiserie", "C"),
    TRANSFORMATION_THE_CAFE("10830", "Transformation du thé et du café", "C"),
    FABRICATION_CONDIMENTS_ASSAISONNEMENTS("10840", "Fabrication de condiments et assaisonnements", "C"),
    FABRICATION_PLATS_PREPARES("10850", "Fabrication de plats préparés", "C"),
    FABRICATION_ALIMENTS_HOMOGENEISES_DIETETIQUES("10860", "Fabrication d'aliments homogénéisés et diététiques", "C"),
    FABRICATION_AUTRES_PRODUITS_ALIMENTAIRES("10890", "Fabrication d'autres produits alimentaires n.c.a.", "C"),
    FABRICATION_ALIMENTS_ANIMAUX_FERME("10910", "Fabrication d'aliments pour animaux de ferme", "C"),
    FABRICATION_ALIMENTS_ANIMAUX_COMPAGNIE("10920", "Fabrication d'aliments pour animaux de compagnie", "C"),
    DISTILLATION_RECTIFICATION_MELANGE_SPIRITUEUX("11010", "Distillation, rectification et mélange de spiritueux", "C"),
    FABRICATION_VIN_RAISIN("11020", "Fabrication de vin de raisin", "C"),
    FABRICATION_AUTRES_BOISSONS_FERMENTEES("11030", "Fabrication d'autres boissons fermentées", "C"),
    FABRICATION_AUTRES_BOISSONS_NON_DISTILLEES("11040", "Fabrication d'autres boissons non distillées, fermentées", "C"),
    FABRICATION_BIERE("11050", "Fabrication de bière", "C"),
    FABRICATION_MALT("11060", "Fabrication de malt", "C"),
    PRODUCTION_EAUX_MINERALES_AUTRES_BOISSONS("11070", "Production d'eaux minérales et d'autres eaux embouteillées", "C"),
    FABRICATION_BOISSONS_RAFRAICHISSANTES("11080", "Fabrication de boissons rafraîchissantes", "C"),
    FABRICATION_PRODUITS_TABAC("12000", "Fabrication de produits à base de tabac", "C"),

    // Section G - Commerce ; réparation d'automobiles et de motocycles
    COMMERCE_AUTOMOBILES_VEHICULES_LEGERS("45110", "Commerce de voitures et de véhicules automobiles légers", "G"),
    COMMERCE_AUTRES_VEHICULES_AUTOMOBILES("45190", "Commerce d'autres véhicules automobiles", "G"),
    ENTRETIEN_REPARATION_VEHICULES_AUTOMOBILES("45200", "Entretien et réparation de véhicules automobiles", "G"),
    COMMERCE_EQUIPEMENTS_AUTOMOBILES("45310", "Commerce de gros d'équipements automobiles", "G"),
    COMMERCE_DETAIL_EQUIPEMENTS_AUTOMOBILES("45320", "Commerce de détail d'équipements automobiles", "G"),
    COMMERCE_MOTOCYCLES("45400", "Commerce et réparation de motocycles", "G"),

    // Section H - Transport et entreposage
    TRANSPORT_FERROVIAIRE_INTERURBAIN_VOYAGEURS("49100", "Transport ferroviaire interurbain de voyageurs", "H"),
    TRANSPORT_FERROVIAIRE_MARCHANDISES("49200", "Transport ferroviaire de marchandises", "H"),
    TRANSPORT_URBAIN_SUBURBAIN_VOYAGEURS("49310", "Transport urbain et suburbain de voyageurs", "H"),
    TRANSPORT_TAXI("49320", "Transport de voyageurs par taxis", "H"),
    AUTRES_TRANSPORTS_TERRESTRES_VOYAGEURS("49390", "Autres transports terrestres de voyageurs n.c.a.", "H"),
    TRANSPORT_ROUTIER_MARCHANDISES("49410", "Transport routier de marchandises", "H"),
    DEMENAGEMENT("49420", "Services de déménagement", "H"),
    TRANSPORT_PIPELINE("49500", "Transport par conduites", "H"),
    TRANSPORT_MARITIME_COTIER_VOYAGEURS("50100", "Transport maritime et côtier de voyageurs", "H"),
    TRANSPORT_MARITIME_COTIER_MARCHANDISES("50200", "Transport maritime et côtier de marchandises", "H"),
    TRANSPORT_FLUVIAL_VOYAGEURS("50300", "Transport fluvial de voyageurs", "H"),
    TRANSPORT_FLUVIAL_MARCHANDISES("50400", "Transport fluvial de marchandises", "H"),
    TRANSPORT_AERIEN_VOYAGEURS("51100", "Transport aérien de voyageurs", "H"),
    TRANSPORT_AERIEN_MARCHANDISES("51200", "Transport aérien de marchandises", "H"),
    ENTREPOSAGE_STOCKAGE("52100", "Entreposage et stockage", "H"),
    ACTIVITES_AUXILIAIRES_TRANSPORTS("52290", "Autres activités auxiliaires des transports", "H"),

    // Section I - Hébergement et restauration
    HOTELS_HEBERGEMENT_SIMILAIRE("55100", "Hôtels et hébergement similaire", "I"),
    HEBERGEMENT_VACANCES_AUTRES_COURTS_SEJOURS("55200", "Hébergement de vacances et autres hébergements de courte durée", "I"),
    TERRAINS_CAMPING_PARCS_CARAVANES("55300", "Terrains de camping et parcs pour caravanes ou véhicules de loisirs", "I"),
    AUTRES_HEBERGEMENTS("55900", "Autres hébergements", "I"),
    RESTAURANTS_SERVICES_RESTAURATION_MOBILES("56100", "Restaurants et services de restauration mobile", "I"),
    TRAITEURS_AUTRES_SERVICES_RESTAURATION("56210", "Services de traiteurs", "I"),
    AUTRES_SERVICES_RESTAURATION("56290", "Autres services de restauration", "I"),
    DEBITS_BOISSONS("56300", "Débits de boissons", "I"),

    // Section J - Information et communication
    EDITION_LIVRES("58110", "Édition de livres", "J"),
    EDITION_JOURNAUX("58130", "Édition de journaux", "J"),
    EDITION_REVUES_PERIODIQUES("58140", "Édition de revues et périodiques", "J"),
    AUTRES_ACTIVITES_EDITION("58190", "Autres activités d'édition", "J"),
    EDITION_JEUX_ELECTRONIQUES("58210", "Édition de jeux électroniques", "J"),
    AUTRES_EDITIONS_LOGICIELS("58290", "Édition d'autres logiciels", "J"),
    PRODUCTION_FILMS_CINEMATOGRAPHIQUES("59110", "Production de films cinématographiques, de vidéo et de programmes de télévision", "J"),
    POSTPRODUCTION_FILMS_CINEMATOGRAPHIQUES("59120", "Post-production de films cinématographiques, de vidéo et de programmes de télévision", "J"),
    DISTRIBUTION_FILMS_CINEMATOGRAPHIQUES("59130", "Distribution de films cinématographiques, de vidéo et de programmes de télévision", "J"),
    PROJECTION_FILMS_CINEMATOGRAPHIQUES("59140", "Projection de films cinématographiques", "J"),
    ENREGISTREMENT_SONORE("59200", "Enregistrement sonore et édition musicale", "J"),
    DIFFUSION_PROGRAMMES_RADIO("60100", "Diffusion de programmes radio", "J"),
    PROGRAMMATION_DIFFUSION_TELEVISION("60200", "Programmation de télévision et télédiffusion", "J"),
    TELECOMMUNICATIONS_FILAIRES("61100", "Télécommunications filaires", "J"),
    TELECOMMUNICATIONS_SANS_FIL("61200", "Télécommunications sans fil", "J"),
    TELECOMMUNICATIONS_SATELLITE("61300", "Télécommunications par satellite", "J"),
    AUTRES_TELECOMMUNICATIONS("61900", "Autres télécommunications", "J"),
    PROGRAMMATION_INFORMATIQUE("62010", "Programmation informatique", "J"),
    CONSEIL_INFORMATIQUE("62020", "Conseil en systèmes et logiciels informatiques", "J"),
    GESTION_INSTALLATIONS_INFORMATIQUES("62030", "Gestion d'installations informatiques", "J"),
    AUTRES_ACTIVITES_SERVICES_INFORMATIQUES("62090", "Autres activités de services informatiques", "J"),
    TRAITEMENT_DONNEES_HEBERGEMENT("63110", "Traitement de données, hébergement et activités connexes", "J"),
    PORTAILS_WEB("63120", "Portails Web", "J"),
    AGENCES_PRESSE("63910", "Agences de presse", "J"),
    AUTRES_SERVICES_INFORMATION("63990", "Autres services d'information n.c.a.", "J");

    private final String code;
    private final String libelle;
    private final String section;

    DomaineActivitesOHADA(String code, String libelle, String section) {
        this.code = code;
        this.libelle = libelle;
        this.section = section;
    }

    public String getCode() {
        return code;
    }

    public String getLibelle() {
        return libelle;
    }

    public String getSection() {
        return section;
    }

    public String getValue() {
        return libelle;
    }

    /** Recherche par code exact */
    public static DomaineActivitesOHADA fromCode(String code) {
        if (code == null) return null;
        for (DomaineActivitesOHADA d : values()) {
            if (d.code.equals(code.trim())) {
                return d;
            }
        }
        return null;
    }

    /** Recherche par libellé exact (insensible à la casse et aux espaces) */
    public static DomaineActivitesOHADA fromLibelle(String libelle) {
        if (libelle == null) return null;
        String norm = libelle.trim().toLowerCase();
        for (DomaineActivitesOHADA d : values()) {
            if (d.libelle.toLowerCase().equals(norm)) {
                return d;
            }
        }
        return null;
    }

    /** Recherche par libellé exact (pour compatibilité avec l'ancien code) */
    public static DomaineActivitesOHADA fromLabel(String label) {
        return fromLibelle(label);
    }

    /** Recherche par section */
    public static DomaineActivitesOHADA[] fromSection(String section) {
        if (section == null) return new DomaineActivitesOHADA[0];
        return java.util.Arrays.stream(values())
                .filter(d -> d.section.equals(section.trim().toUpperCase()))
                .toArray(DomaineActivitesOHADA[]::new);
    }

    /** Obtenir toutes les sections disponibles */
    public static String[] getSections() {
        return java.util.Arrays.stream(values())
                .map(d -> d.section)
                .distinct()
                .sorted()
                .toArray(String[]::new);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
