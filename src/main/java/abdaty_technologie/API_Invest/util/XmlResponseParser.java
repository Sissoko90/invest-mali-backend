package abdaty_technologie.API_Invest.util;

import abdaty_technologie.API_Invest.dto.rccm.RccmResponse;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;

public class XmlResponseParser {

    public static RccmResponse parse(String xml) throws Exception {
        try {
            System.out.println("📄 [XmlResponseParser] XML brut reçu: " + xml);
            
            // Corriger le XML mal formé du serveur RCCM (attributs sans guillemets)
            // Exemple: id=ML-BKO-01 -> id="ML-BKO-01"
            String fixedXml = fixMalformedXml(xml);
            System.out.println("📄 [XmlResponseParser] XML corrigé: " + fixedXml);
            
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder()
                    .parse(new InputSource(new StringReader(fixedXml)));

            String refDos = getTextContent(doc, "refDos");
            String refProcess = getTextContent(doc, "refProcess");
            String name = getTextContent(doc, "name");
            String dosError = getTextContent(doc, "dosError");

            RccmResponse response = new RccmResponse(refDos, refProcess, name);
            
            // Vérifier s'il y a une erreur métier
            if (dosError != null && !dosError.isEmpty() && !"no".equalsIgnoreCase(dosError)) {
                response.setSuccess(false);
                response.setMessage(dosError);
            } else {
                response.setSuccess(true);
                response.setMessage("Immatriculation RCCM réussie");
            }
            
            return response;
        } catch (Exception e) {
            System.err.println("❌ [XmlResponseParser] Erreur parsing XML: " + e.getMessage());
            System.err.println("📄 [XmlResponseParser] XML reçu: " + xml);
            
            // Retourner une réponse d'erreur
            RccmResponse errorResponse = new RccmResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Erreur lors du parsing de la réponse RCCM: " + e.getMessage());
            return errorResponse;
        }
    }
    
    private static String fixMalformedXml(String xml) {
        // Le serveur RCCM retourne des attributs sans guillemets: id=ML-BKO-01
        // On doit les corriger en: id="ML-BKO-01"
        // Pattern: attribut=valeur (sans guillemets) -> attribut="valeur"
        return xml.replaceAll("(\\w+)=([^\"\\s>][^\\s>]*)", "$1=\"$2\"");
    }

    private static String getTextContent(Document doc, String tagName) {
        try {
            return doc.getElementsByTagName(tagName).item(0).getTextContent();
        } catch (Exception e) {
            System.err.println("⚠️ [XmlResponseParser] Tag '" + tagName + "' non trouvé");
            return "";
        }
    }
}
