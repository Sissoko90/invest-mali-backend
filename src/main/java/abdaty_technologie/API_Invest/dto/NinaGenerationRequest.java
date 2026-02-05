package abdaty_technologie.API_Invest.dto;

import lombok.Data;

@Data
public class NinaGenerationRequest {
    private String raison_soc;      // Nom de l'entreprise
    private String sigle;           // Sigle de l'entreprise
    private String prenom_responsable; // Prénom du gérant
    private String nom_responsable;    // Nom du gérant
    private String date_creation;      // Date de création (YYYY-MM-DD)
    private String region;             // Code région (ex: 90)
    private String cercle;             // Code cercle (ex: 9001)
    private String commune;            // Code commune (ex: 90010401)
    private String vfq;                // Code quartier/village/fraction (ex: 900104010001)
    private String rccm;               // Numéro RCCM (obligatoire)
    private String type;               // Type d'entreprise (3=individuelle, 4=société, 5=GIE)
}
