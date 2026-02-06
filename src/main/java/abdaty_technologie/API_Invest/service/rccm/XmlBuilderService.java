package abdaty_technologie.API_Invest.service.rccm;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Documents;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import abdaty_technologie.API_Invest.dto.rccm.CreateCompanyRequest;
import abdaty_technologie.API_Invest.dto.rccm.CreatePersonRequest;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.List;

@Service
public class XmlBuilderService {
    
    private static final SimpleDateFormat RCCM_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.S z");
    
    /**
     * Génère le XML RCCM à partir d'une entité Entreprise de la base de données
     */
    public String buildXmlFromEntreprise(Entreprise entreprise) {
        // Trouver le gérant
        Persons gerant = null;
        for (EntrepriseMembre membre : entreprise.getMembres()) {
            if (membre.getRole() == EntrepriseRole.GERANT) {
                gerant = membre.getPersonne();
                break;
            }
        }
        
        if (gerant == null && !entreprise.getMembres().isEmpty()) {
            gerant = entreprise.getMembres().get(0).getPersonne();
        }
        
        if (gerant == null) {
            throw new RuntimeException("Aucun gérant/fondateur trouvé pour l'entreprise " + entreprise.getNom());
        }
        
        return buildXmlFromEntrepriseAndPerson(entreprise, gerant);
    }
    
    /**
     * Génère le XML RCCM à partir d'une entité Entreprise et d'une Personne
     */
    public String buildXmlFromEntrepriseAndPerson(Entreprise entreprise, Persons person) {
        StringBuilder xml = new StringBuilder();
        
        xml.append("<dossiers>\n");
        xml.append("\t<dosDossier id=\"1\">\n");
        xml.append("\t\t<refProcess>ImmPPProcess</refProcess>\n");
        xml.append("\t\t<folderNameCountry>ML</folderNameCountry>\n");
        xml.append("\t\t<folderNameCity>BKO</folderNameCity>\n");
        xml.append("\t\t<folderNumberCity>01</folderNumberCity>\n");
        
        // Mandataire (le gérant)
        xml.append("\t\t<dosFormalityMandatary id=\"\">\n");
        xml.append("\t\t\t<mandataryName>").append(safe(person.getPrenom())).append(" ").append(safe(person.getNom())).append("</mandataryName>\n");
        xml.append("\t\t\t<mandataryAddress>").append(safe(person.getLocalite(), "non recupere")).append("</mandataryAddress>\n");
        xml.append("\t\t\t<mandataryInternet>").append(safe(person.getEmail(), "non recupere")).append("</mandataryInternet>\n");
        xml.append("\t\t</dosFormalityMandatary>\n");
        
        // Personne physique
        xml.append("\t\t\n");
        xml.append("\t\t<prsIndividual id=\"\">\n");
        xml.append("\t\t\t<typeCivility>").append(getCivility(person)).append("</typeCivility>\n");
        xml.append("\t\t\t<firstName>").append(safe(person.getPrenom())).append("</firstName>\n");
        xml.append("\t\t\t<lastName>").append(safe(person.getNom())).append("</lastName>\n");
        xml.append("\t\t\t<maidenName></maidenName>\n");
        xml.append("\t\t\t<strIdentity>").append(safe(getIdentity(entreprise, person), "NINA" )).append("</strIdentity>\n");
        xml.append("\t\t\t<dateBirthday>").append(formatDate(person.getDateNaissance())).append("</dateBirthday>\n");
        xml.append("\t\t\t<birthPlace>").append(safe(person.getLieuNaissance(), "non recupere")).append("</birthPlace>\n");
        xml.append("\t\t\t<nationality>").append(getNationalityCode(person)).append("</nationality>\n");
        xml.append("\t\t\t<nationality2></nationality2>\n");
        xml.append("\t\t\t<nationality3></nationality3>\n");
        xml.append("\t\t\t<otherNationality />\n");
        xml.append("\t\t\t<profession>").append(safe(entreprise.getActiviteSecondaire(), "non recupere")).append("</profession>\n");
        xml.append("\t\t\t<statusMatrimonial>").append(getMaritalStatus(person)).append("</statusMatrimonial>\n");
        
        // Adresse civique personne
        xml.append("\t\t\t\n");
        xml.append("\t\t\t<civicAddress>\n");
        xml.append("\t\t\t\t<prsCivicAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<civicGeoCity>").append(safe(person.getLocalite(), "non recupere")).append("</civicGeoCity>\n");
        xml.append("\t\t\t\t\t<isoCountry>MLI</isoCountry>\n");
        xml.append("\t\t\t\t\t<district>").append(safe(person.getLocalite(), "non recupere")).append("</district>\n");
        xml.append("\t\t\t\t\t<streetName></streetName>\n");
        xml.append("\t\t\t\t\t<apartmentNumber>0</apartmentNumber>\n");
        xml.append("\t\t\t\t\t<streetNumber>0</streetNumber>\n");
        xml.append("\t\t\t\t\t<additionalAddress></additionalAddress>\n");
        xml.append("\t\t\t\t</prsCivicAddress>\n");
        xml.append("\t\t\t</civicAddress>\n");
        
        // Téléphone
        xml.append("\t\t\t<phoneAddress>\n");
        xml.append("\t\t\t\t<prsPhoneAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<phoneNumber>").append(safe(person.getTelephone1(), "00 00 00 00")).append("</phoneNumber>\n");
        xml.append("\t\t\t\t</prsPhoneAddress>\n");
        xml.append("\t\t\t</phoneAddress>\n");
        
        // Adresse postale
        xml.append("\t\t\t<postalAddress>\n");
        xml.append("\t\t\t\t<prsPostalAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<mailboxNumber></mailboxNumber>\n");
        xml.append("\t\t\t\t\t<postalGeoCity>").append(getCityFromDivision(person)).append("</postalGeoCity>\n");
        xml.append("\t\t\t\t\t<isoCountry>MLI</isoCountry>\n");
        xml.append("\t\t\t\t</prsPostalAddress>\n");
        xml.append("\t\t\t</postalAddress>\n");
        
        // Email
        xml.append("\t\t\t<internetAddress>\n");
        xml.append("\t\t\t\t<prsInternetAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<emailAddress>").append(safe(person.getEmail(), "non recupere")).append("</emailAddress>\n");
        xml.append("\t\t\t\t</prsInternetAddress>\n");
        xml.append("\t\t\t</internetAddress>\n");
        xml.append("\t\t</prsIndividual>\n");
        
        // Établissement
        xml.append("\t\t<prsEts id=\"\">\n");
        xml.append("\t\t\t<typeImplication>EP</typeImplication>\n");
        xml.append("\t\t\t<tradeName>").append(safe(entreprise.getNom())).append("</tradeName>\n");
        xml.append("\t\t\t<companyShortName>").append(safe(entreprise.getSigle(), getShortName(entreprise.getNom()))).append("</companyShortName>\n");
        xml.append("\t\t\t<nationality>MLI</nationality>\n");
        xml.append("\t\t\t<prsOrigin>C</prsOrigin>\n");
        xml.append("\t\t\t\n");
        
        // Activités
        xml.append("\t\t\t<activities>\n");
        xml.append("\t\t\t\t<prsActivity id=\"\">\n");
        xml.append("\t\t\t\t\t<prsTypeActivity>").append(getActivityCode(entreprise)).append("</prsTypeActivity>\n");
        xml.append("\t\t\t\t\t<otherTypeActivity>").append(safe(entreprise.getActiviteSecondaire(), "non recupere")).append("</otherTypeActivity>\n");
        xml.append("\t\t\t\t</prsActivity>\n");
        xml.append("\t\t\t</activities>\n");
        xml.append("\t\t\t\n");
        
        // Adresse établissement
        xml.append("\t\t\t<civicAddress>\n");
        xml.append("\t\t\t\t<prsCivicAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<civicGeoCity>Bamako</civicGeoCity>\n");
        xml.append("\t\t\t\t\t<isoCountry>MLI</isoCountry>\n");
        xml.append("\t\t\t\t\t<district>Bamako</district>\n");
        xml.append("\t\t\t\t\t<streetName></streetName>\n");
        xml.append("\t\t\t\t\t<apartmentNumber>0</apartmentNumber>\n");
        xml.append("\t\t\t\t\t<streetNumber>0</streetNumber>\n");
        xml.append("\t\t\t\t\t<additionalAddress></additionalAddress>\n");
        xml.append("\t\t\t\t</prsCivicAddress>\n");
        xml.append("\t\t\t</civicAddress>\n");
        xml.append("\t\t\n");
        xml.append("\t\t</prsEts>\n");
        
        // Documents
        xml.append("\t\t\n");
        xml.append("\t\t<documents>\n");
        List<Documents> docs = entreprise.getDocuments();
        if (docs != null && !docs.isEmpty()) {
            for (Documents doc : docs) {
                xml.append("\t\t\t<dosDocument id=\"\">\n");
                xml.append("\t\t\t\t<docType id=\"81\" />\n");
                xml.append("\t\t\t\t<otherDocType />\n");
                // Utiliser l'URL directe du document au lieu du numéro de pièce
                String docUrl = getDocumentUrl(doc);
                xml.append("\t\t\t\t<name>").append(safe(docUrl, "document.pdf")).append("</name>\n");
                xml.append("\t\t\t\t<turnover/>\n");
                xml.append("\t\t\t</dosDocument>\n");
            }
        } else {
            xml.append("\t\t\t<dosDocument id=\"\">\n");
            xml.append("\t\t\t\t<docType id=\"81\" />\n");
            xml.append("\t\t\t\t<otherDocType />\n");
            xml.append("\t\t\t\t<name>document.pdf</name>\n");
            xml.append("\t\t\t\t<turnover/>\n");
            xml.append("\t\t\t</dosDocument>\n");
        }
        xml.append("\t\t</documents>\n");
        
        xml.append("\t</dosDossier>\n");
        xml.append("</dossiers>");
        
        return xml.toString();
    }
    
    private String getCivility(Persons person) {
        if (person.getCivilite() != null) {
            return switch (person.getCivilite()) {
                case MONSIEUR -> "M.";
                case MADAME -> "Mme";
                case MADEMOISELLE -> "Mlle";
                default -> "M.";
            };
        }
        if (person.getSexe() != null) {
            return switch (person.getSexe()) {
                case MASCULIN -> "M.";
                case FEMININ -> "Mme";
                default -> "M.";
            };
        }
        return "M.";
    }
    
    private String getNationalityCode(Persons person) {
        if (person == null || person.getNationalite() == null) {
            return "MLI";
        }

        String nat = person.getNationalite().name();
        if (nat == null || nat.isBlank()) {
            return "MLI";
        }

        // Normalisation: certaines valeurs en BDD sont des libellés, RCCM attend un code (ex: MLI)
        String upper = nat.toUpperCase();
        if (upper.contains("MALI")) {
            return "MLI";
        }

        // Si la valeur ressemble déjà à un code ISO3, la renvoyer
        return nat;
    }

    private String getIdentity(Entreprise entreprise, Persons person) {
        if (entreprise != null && entreprise.getId() != null && !entreprise.getId().isBlank()) {
            return entreprise.getId();
        }
        if (person != null) {
            if (person.getTelephone1() != null && !person.getTelephone1().isBlank()) {
                return person.getTelephone1();
            }
            if (person.getEmail() != null && !person.getEmail().isBlank()) {
                return person.getEmail();
            }
        }
        return "NINA";
    }
    
    private String getMaritalStatus(Persons person) {
        if (person.getSituationMatrimoniale() != null) {
            return switch (person.getSituationMatrimoniale()) {
                case MARIE -> "M";
                case CELIBATAIRE -> "C";
                case DIVORCE -> "D";
                case VEUF -> "V";
                default -> "C";
            };
        }
        return "C";
    }
    
    private String formatDate(java.util.Date date) {
        if (date == null) {
            return "1990-01-01 00:00:00.0 GMT";
        }
        return RCCM_DATE_FORMAT.format(date);
    }
    
    private String getActivityCode(Entreprise entreprise) {
        if (entreprise.getDomaineActivite() != null) {
            return "A010201"; // Code par défaut, à mapper selon le domaine
        }
        return "A010201";
    }

    public String buildXml(CreateCompanyRequest r) {
        // Pour les entreprises individuelles (PP), utiliser le format PP
        return buildXmlPP(convertToPersonRequest(r));
    }
    
    private CreatePersonRequest convertToPersonRequest(CreateCompanyRequest r) {
        CreatePersonRequest personRequest = new CreatePersonRequest();
        
        System.out.println("🔍 [XmlBuilderService] Conversion CreateCompanyRequest -> CreatePersonRequest");
        System.out.println("   - managerFirstName: '" + r.getManagerFirstName() + "'");
        System.out.println("   - managerLastName: '" + r.getManagerLastName() + "'");
        System.out.println("   - managerName: '" + r.getManagerName() + "'");
        System.out.println("   - managerBirthDate: '" + r.getManagerBirthDate() + "'");
        System.out.println("   - managerPhone: '" + r.getManagerPhone() + "'");
        System.out.println("   - managerEmail: '" + r.getManagerEmail() + "'");
        
        // Utiliser les champs détaillés si disponibles, sinon extraire du managerName
        String firstName = "";
        String lastName = "";
        
        if (r.getManagerFirstName() != null && !r.getManagerFirstName().isEmpty()) {
            firstName = r.getManagerFirstName();
            lastName = r.getManagerLastName() != null ? r.getManagerLastName() : "";
        } else if (r.getManagerName() != null && !r.getManagerName().trim().isEmpty()) {
            String[] nameParts = r.getManagerName().trim().split(" ", 2);
            firstName = nameParts.length > 0 ? nameParts[0] : "";
            lastName = nameParts.length > 1 ? nameParts[1] : "";
        }
        
        // Si toujours vide, utiliser des valeurs par défaut pour éviter l'erreur RCCM
        if (firstName.isEmpty()) {
            System.err.println("⚠️ [XmlBuilderService] Prénom vide! Utilisation de valeur par défaut");
            firstName = "Prénom";
        }
        if (lastName.isEmpty()) {
            System.err.println("⚠️ [XmlBuilderService] Nom vide! Utilisation de valeur par défaut");
            lastName = "Nom";
        }
        
        personRequest.setFirstName(firstName);
        personRequest.setLastName(lastName);
        
        System.out.println("   => firstName résolu: '" + firstName + "'");
        System.out.println("   => lastName résolu: '" + lastName + "'");
        
        // Mapper les autres champs avec des valeurs par défaut sûres
        personRequest.setNationality(r.getManagerNationality() != null ? r.getManagerNationality() : "MLI");
        personRequest.setIdType(r.getManagerIdType() != null ? r.getManagerIdType() : "NINA");
        personRequest.setIdNumber(r.getManagerIdNumber() != null ? r.getManagerIdNumber() : "");
        
        // Date et lieu de naissance - utiliser les vraies données si disponibles
        if (r.getManagerBirthDate() != null && !r.getManagerBirthDate().isEmpty()) {
            // Convertir au format RCCM si nécessaire
            personRequest.setBirthDate(formatBirthDateForRccm(r.getManagerBirthDate()));
        } else {
            personRequest.setBirthDate("1990-01-01 00:00:00.0 GMT");
        }
        personRequest.setBirthPlace(r.getManagerBirthPlace() != null ? r.getManagerBirthPlace() : "Bamako");
        
        // Téléphone et email
        personRequest.setPhoneNumber(r.getManagerPhone() != null ? r.getManagerPhone() : "");
        personRequest.setEmail(r.getManagerEmail() != null ? r.getManagerEmail() : "");
        
        // Civilité et situation matrimoniale
        personRequest.setCivility(r.getManagerCivility() != null ? r.getManagerCivility() : "M.");
        personRequest.setMaritalStatus(r.getManagerMaritalStatus() != null ? r.getManagerMaritalStatus() : "C");
        
        // Adresse avec valeurs par défaut
        personRequest.setCity(r.getCity() != null ? r.getCity() : "Bamako");
        personRequest.setDistrict(r.getDistrict() != null ? r.getDistrict() : "Commune IV");
        personRequest.setStreetName(r.getStreetName() != null ? r.getStreetName() : "");
        personRequest.setStreetNumber(r.getStreetNumber() != null ? r.getStreetNumber() : "0");
        
        // Activité
        personRequest.setMainActivity(r.getMainActivity() != null ? r.getMainActivity() : "Commerce");
        personRequest.setActivityCode(r.getActivityCode() != null ? r.getActivityCode() : "A010201");
        
        // Nom commercial
        personRequest.setTradeName(r.getTradeName() != null ? r.getTradeName() : r.getCompanyName());
        
        return personRequest;
    }
    
    private String formatBirthDateForRccm(String dateStr) {
        // Si déjà au format RCCM, retourner tel quel
        if (dateStr.contains("GMT") || dateStr.contains("UTC")) {
            return dateStr;
        }
        // Sinon, convertir yyyy-MM-dd en format RCCM
        try {
            if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return dateStr + " 00:00:00.0 GMT";
            }
        } catch (Exception e) {
            System.err.println("⚠️ Erreur conversion date: " + e.getMessage());
        }
        return dateStr + " 00:00:00.0 GMT";
    }

    public String buildXmlPP(CreatePersonRequest r) {
        // Format conforme RCCM-OHADA Mali - identique au modèle Postman qui fonctionne
        StringBuilder xml = new StringBuilder();
        
        xml.append("<dossiers>\n");
        xml.append("\t<dosDossier id=\"1\">\n");
        xml.append("\t\t<refProcess>ImmPPProcess</refProcess>\n");
        xml.append("\t\t<folderNameCountry>ML</folderNameCountry>\n");
        xml.append("\t\t<folderNameCity>BKO</folderNameCity>\n");
        xml.append("\t\t<folderNumberCity>01</folderNumberCity>\n");
        
        // Mandataire
        xml.append("\t\t<dosFormalityMandatary id=\"\">\n");
        xml.append("\t\t\t<mandataryName>").append(safe(r.getFirstName())).append(" ").append(safe(r.getLastName())).append("</mandataryName>\n");
        xml.append("\t\t\t<mandataryAddress>").append(safe(r.getCity(), "Bamako")).append("</mandataryAddress>\n");
        xml.append("\t\t\t<mandataryInternet>").append(safe(r.getEmail(), "formalisation@apimali.gov.ml")).append("</mandataryInternet>\n");
        xml.append("\t\t</dosFormalityMandatary>\n");
        
        // Personne physique
        xml.append("\t\t\n");
        xml.append("\t\t<prsIndividual id=\"\">\n");
        xml.append("\t\t\t<typeCivility>").append(safe(r.getCivility(), "M.")).append("</typeCivility>\n");
        xml.append("\t\t\t<firstName>").append(safe(r.getFirstName())).append("</firstName>\n");
        xml.append("\t\t\t<lastName>").append(safe(r.getLastName())).append("</lastName>\n");
        xml.append("\t\t\t<maidenName>").append(safe(r.getMaidenName(), "")).append("</maidenName>\n");
        xml.append("\t\t\t<strIdentity>").append(safe(r.getIdNumber(), safe(r.getPhoneNumber(), "NINA"))).append("</strIdentity>\n");
        xml.append("\t\t\t<dateBirthday>").append(safe(r.getBirthDate(), "1990-01-01 00:00:00.0 GMT")).append("</dateBirthday>\n");
        xml.append("\t\t\t<birthPlace>").append(safe(r.getBirthPlace(), "Bamako")).append("</birthPlace>\n");
        xml.append("\t\t\t<nationality>").append(safe(r.getNationality(), "MLI")).append("</nationality>\n");
        xml.append("\t\t\t<nationality2></nationality2>\n");
        xml.append("\t\t\t<nationality3></nationality3>\n");
        xml.append("\t\t\t<otherNationality />\n");
        xml.append("\t\t\t<profession>").append(safe(r.getMainActivity(), "COMMERCANT")).append("</profession>\n");
        xml.append("\t\t\t<statusMatrimonial>").append(safe(r.getMaritalStatus(), "C")).append("</statusMatrimonial>\n");
        
        // Adresse civique personne
        xml.append("\t\t\t\n");
        xml.append("\t\t\t<civicAddress>\n");
        xml.append("\t\t\t\t<prsCivicAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<civicGeoCity>").append(safe(r.getCity(), "Bamako")).append("</civicGeoCity>\n");
        xml.append("\t\t\t\t\t<isoCountry>MLI</isoCountry>\n");
        xml.append("\t\t\t\t\t<district>").append(safe(r.getDistrict(), "Bamako")).append("</district>\n");
        xml.append("\t\t\t\t\t<streetName>").append(safe(r.getStreetName(), "")).append("</streetName>\n");
        xml.append("\t\t\t\t\t<apartmentNumber>").append(safe(r.getApartmentNumber(), "0")).append("</apartmentNumber>\n");
        xml.append("\t\t\t\t\t<streetNumber>").append(safe(r.getStreetNumber(), "0")).append("</streetNumber>\n");
        xml.append("\t\t\t\t\t<additionalAddress>").append(safe(r.getAdditionalAddress(), "")).append("</additionalAddress>\n");
        xml.append("\t\t\t\t</prsCivicAddress>\n");
        xml.append("\t\t\t</civicAddress>\n");
        
        // Téléphone
        xml.append("\t\t\t<phoneAddress>\n");
        xml.append("\t\t\t\t<prsPhoneAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<phoneNumber>").append(safe(r.getPhoneNumber(), "00 00 00 00")).append("</phoneNumber>\n");
        xml.append("\t\t\t\t</prsPhoneAddress>\n");
        xml.append("\t\t\t</phoneAddress>\n");
        
        // Adresse postale
        xml.append("\t\t\t<postalAddress>\n");
        xml.append("\t\t\t\t<prsPostalAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<mailboxNumber>").append(safe(r.getMailboxNumber(), "")).append("</mailboxNumber>\n");
        xml.append("\t\t\t\t\t<postalGeoCity>").append(safe(r.getCity(), "Bamako")).append("</postalGeoCity>\n");
        xml.append("\t\t\t\t\t<isoCountry>MLI</isoCountry>\n");
        xml.append("\t\t\t\t</prsPostalAddress>\n");
        xml.append("\t\t\t</postalAddress>\n");
        
        // Email
        xml.append("\t\t\t<internetAddress>\n");
        xml.append("\t\t\t\t<prsInternetAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<emailAddress>").append(safe(r.getEmail(), "formalisation@apimali.gov.ml")).append("</emailAddress>\n");
        xml.append("\t\t\t\t</prsInternetAddress>\n");
        xml.append("\t\t\t</internetAddress>\n");
        xml.append("\t\t</prsIndividual>\n");
        
        // Établissement
        xml.append("\t\t<prsEts id=\"\">\n");
        xml.append("\t\t\t<typeImplication>EP</typeImplication>\n");
        xml.append("\t\t\t<tradeName>").append(safe(r.getTradeName(), r.getFirstName() + " " + r.getLastName())).append("</tradeName>\n");
        xml.append("\t\t\t<companyShortName>").append(safe(r.getCompanyShortName(), getShortName(r.getFirstName()))).append("</companyShortName>\n");
        xml.append("\t\t\t<nationality>MLI</nationality>\n");
        xml.append("\t\t\t<prsOrigin>C</prsOrigin>\n");
        xml.append("\t\t\t\n");
        
        // Activités
        xml.append("\t\t\t<activities>\n");
        xml.append("\t\t\t\t<prsActivity id=\"\">\n");
        xml.append("\t\t\t\t\t<prsTypeActivity>").append(safe(r.getActivityCode(), "A010201")).append("</prsTypeActivity>\n");
        xml.append("\t\t\t\t\t<otherTypeActivity>").append(safe(r.getMainActivity(), "Commerce")).append("</otherTypeActivity>\n");
        xml.append("\t\t\t\t</prsActivity>\n");
        xml.append("\t\t\t</activities>\n");
        xml.append("\t\t\t\n");
        
        // Adresse établissement
        xml.append("\t\t\t<civicAddress>\n");
        xml.append("\t\t\t\t<prsCivicAddress id=\"\">\n");
        xml.append("\t\t\t\t\t<civicGeoCity>").append(safe(r.getCity(), "Bamako")).append("</civicGeoCity>\n");
        xml.append("\t\t\t\t\t<isoCountry>MLI</isoCountry>\n");
        xml.append("\t\t\t\t\t<district>").append(safe(r.getDistrict(), "Bamako")).append("</district>\n");
        xml.append("\t\t\t\t\t<streetName>").append(safe(r.getStreetName(), "")).append("</streetName>\n");
        xml.append("\t\t\t\t\t<apartmentNumber>").append(safe(r.getApartmentNumber(), "0")).append("</apartmentNumber>\n");
        xml.append("\t\t\t\t\t<streetNumber>").append(safe(r.getStreetNumber(), "0")).append("</streetNumber>\n");
        xml.append("\t\t\t\t\t<additionalAddress>").append(safe(r.getAdditionalAddress(), "")).append("</additionalAddress>\n");
        xml.append("\t\t\t\t</prsCivicAddress>\n");
        xml.append("\t\t\t</civicAddress>\n");
        xml.append("\t\t\n");
        xml.append("\t\t</prsEts>\n");
        
        // Documents
        xml.append("\t\t\n");
        xml.append("\t\t<documents>\n");
        xml.append("\t\t\t<dosDocument id=\"\">\n");
        xml.append("\t\t\t\t<docType id=\"81\" />\n");
        xml.append("\t\t\t\t<otherDocType />\n");
        xml.append("\t\t\t\t<name>").append(safe(r.getDocumentName(), "document.pdf")).append("</name>\n");
        xml.append("\t\t\t\t<turnover/>\n");
        xml.append("\t\t\t</dosDocument>\n");
        xml.append("\t\t</documents>\n");
        
        xml.append("\t</dosDossier>\n");
        xml.append("</dossiers>");
        
        return xml.toString();
    }
    
    private String safe(String value) {
        return value != null ? escapeXml(value) : "";
    }
    
    private String safe(String value, String defaultValue) {
        return value != null && !value.isEmpty() ? escapeXml(value) : defaultValue;
    }
    
    private String escapeXml(String value) {
        if (value == null) return "";
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }
    
    private String getShortName(String firstName) {
        if (firstName == null || firstName.isEmpty()) return "XX";
        return firstName.substring(0, Math.min(2, firstName.length())).toUpperCase();
    }
    
    /**
     * Récupère le nom de la ville depuis la hiérarchie des divisions
     */
    private String getCityFromDivision(Persons person) {
        if (person.getDivision() != null) {
            // Remonter la hiérarchie pour trouver la région (ville principale)
            Divisions cursor = person.getDivision();
            while (cursor != null) {
                if (cursor.getDivisionType() == abdaty_technologie.API_Invest.Entity.Enum.DivisionType.REGION) {
                    return safe(cursor.getNom(), "Bamako");
                }
                cursor = cursor.getParent();
            }
        }
        
        // Fallback sur localite si pas de division ou région trouvée
        return safe(person.getLocalite(), "Bamako");
    }
    
    /**
     * Génère l'URL complète pour visualiser un document avec base URL et context path
     */
    private String getDocumentUrl(Documents doc) {
        if (doc == null) {
            return "document.pdf";
        }
        
        // Base URL du backend (peut être configuré via variable d'environnement)
        String baseUrl = System.getProperty("BACKEND_URL", "http://localhost:8080");
        
        // Context path du backend: /api/v1
        String contextPath = "/api/v1";
        
        // Construire l'URL complète pour la visualisation du document
        // Format: http://localhost:8080/api/v1/documents/{id}/view
        if (doc.getId() != null) {
            return baseUrl + contextPath + "/documents/" + doc.getId() + "/file";
        } else if (doc.getTypeDocument() != null) {
            return baseUrl + contextPath + "/uploads/" + doc.getTypeDocument().name() + "-" + (doc.getNumero() != null ? doc.getNumero() : "doc") + ".pdf";
        } else {
            return doc.getNumero() != null ? doc.getNumero() + ".pdf" : "document.pdf";
        }
    }
}
