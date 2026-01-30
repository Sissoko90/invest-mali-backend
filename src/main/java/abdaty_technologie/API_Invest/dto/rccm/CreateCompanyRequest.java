<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto.rccm;

import lombok.Data;

@Data
public class CreateCompanyRequest {
    private String companyName;
    private String tradeName;
    private String legalForm;
    private String capital;

    // Adresse entreprise
    private String city;
    private String district;
    private String streetName;
    private String streetNumber;

    // Responsable légal - informations de base
    private String managerName;
    private String managerNationality;
    private String managerIdType;
    private String managerIdNumber;
    
    // Responsable légal - informations détaillées pour RCCM
    private String managerFirstName;
    private String managerLastName;
    private String managerBirthDate;      // Format: yyyy-MM-dd ou yyyy-MM-dd HH:mm:ss.S z
    private String managerBirthPlace;
    private String managerPhone;
    private String managerEmail;
    private String managerCivility;       // M., Mme, Mlle
    private String managerMaritalStatus;  // C (célibataire), M (marié), D (divorcé), V (veuf)
    
    // Activité
    private String mainActivity;
    private String activityCode;
}
=======
package abdaty_technologie.API_Invest.dto.rccm;

import lombok.Data;

@Data
public class CreateCompanyRequest {
    private String companyName;
    private String tradeName;
    private String legalForm;
    private String capital;

    // Adresse entreprise
    private String city;
    private String district;
    private String streetName;
    private String streetNumber;

    // Responsable légal - informations de base
    private String managerName;
    private String managerNationality;
    private String managerIdType;
    private String managerIdNumber;
    
    // Responsable légal - informations détaillées pour RCCM
    private String managerFirstName;
    private String managerLastName;
    private String managerBirthDate;      // Format: yyyy-MM-dd ou yyyy-MM-dd HH:mm:ss.S z
    private String managerBirthPlace;
    private String managerPhone;
    private String managerEmail;
    private String managerCivility;       // M., Mme, Mlle
    private String managerMaritalStatus;  // C (célibataire), M (marié), D (divorcé), V (veuf)
    
    // Activité
    private String mainActivity;
    private String activityCode;
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
