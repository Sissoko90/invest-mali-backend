package abdaty_technologie.API_Invest.service;

import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

public interface IDivisionImportService {
    
    /**
     * Importe les divisions depuis un fichier Excel
     * @param file Le fichier Excel à importer
     * @return Message de résultat de l'import
     * @throws IOException En cas d'erreur de lecture du fichier
     */
    String importDivisionsFromExcel(MultipartFile file) throws IOException;
    
    /**
     * Génère un template Excel pour l'import des divisions
     * @return Le fichier Excel template en byte array
     * @throws IOException En cas d'erreur de génération
     */
    byte[] generateExcelTemplate() throws IOException;
}
