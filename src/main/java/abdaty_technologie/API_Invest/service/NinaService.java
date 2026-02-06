package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.NinaResponse;
import abdaty_technologie.API_Invest.Entity.Entreprise;

public interface NinaService {
    /**
     * Génère un numéro NINA pour une entreprise
     * @param entrepriseId L'ID de l'entreprise
     * @param rccm Le numéro RCCM (obligatoire)
     * @return La réponse contenant le numéro NINA généré
     */
    NinaResponse generateNina(String entrepriseId, String rccm);
    
    /**
     * Met à jour le numéro NINA d'une entreprise
     * @param entrepriseId L'ID de l'entreprise
     * @param numeroNina Le numéro NINA à sauvegarder
     * @return L'entreprise mise à jour
     */
    Entreprise updateEntrepriseNina(String entrepriseId, String numeroNina);
    
    /**
     * Génère le certificat NINA en PDF pour une entreprise
     * @param entrepriseId L'ID de l'entreprise
     * @return Le contenu du PDF en bytes
     */
    byte[] generateCertificatePdf(String entrepriseId);
}
