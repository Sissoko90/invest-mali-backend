package abdaty_technologie.API_Invest.dto.rccm;

import lombok.Data;

@Data
public class CreatePersonRequest {
    private String lastName;
    private String firstName;
    private String nationality;

    // Identité
    private String idType;
    private String idNumber;
    
    // Civilité et état civil
    private String civility;        // M., Mme, Mlle
    private String maidenName;      // Nom de jeune fille
    private String maritalStatus;   // M (Marié), C (Célibataire), D (Divorcé), V (Veuf)

    // Date de naissance
    private String birthDate;
    private String birthPlace;

    // Adresse civique
    private String city;
    private String district;
    private String streetName;
    private String streetNumber;
    private String apartmentNumber;
    private String additionalAddress;
    
    // Contact
    private String phoneNumber;
    private String email;
    private String mailboxNumber;   // Boîte postale

    // Activité commerciale
    private String mainActivity;
    private String activityCode;    // Code activité OHADA (ex: A010201)
    
    // Établissement
    private String tradeName;           // Nom commercial
    private String companyShortName;    // Sigle
    
    // Document
    private String documentName;
}
