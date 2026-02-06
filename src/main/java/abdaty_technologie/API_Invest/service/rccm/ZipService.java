package abdaty_technologie.API_Invest.service.rccm;

import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ZipService {

    public Path generateZip(String xmlContent, List<File> docs) throws Exception {
        // Créer le fichier ZIP avec le nom exact requis : APIML.zip
        Path tempDir = Files.createTempDirectory("rccm_temp");
        Path zipPath = tempDir.resolve("APIML.zip");
        
        try (ZipOutputStream zipOut = new ZipOutputStream(Files.newOutputStream(zipPath))) {
            // Structure attendue par RCCM: APIML/xmldb.xml et APIML/1/documents
            
            // 1 — Créer le dossier APIML/
            zipOut.putNextEntry(new ZipEntry("APIML/"));
            zipOut.closeEntry();
            
            // 2 — Ajouter le xmldb.xml dans APIML/
            zipOut.putNextEntry(new ZipEntry("APIML/xmldb.xml"));
            zipOut.write(xmlContent.getBytes("UTF-8"));
            zipOut.closeEntry();

            // 3 — Ajouter les fichiers dans le dossier "APIML/1/"
            if (docs != null && !docs.isEmpty()) {
                // Créer le dossier APIML/1/ dans le ZIP
                zipOut.putNextEntry(new ZipEntry("APIML/1/"));
                zipOut.closeEntry();
                
                for (File f : docs) {
                    zipOut.putNextEntry(new ZipEntry("APIML/1/" + f.getName()));
                    zipOut.write(Files.readAllBytes(f.toPath()));
                    zipOut.closeEntry();
                }
            }
        }
        
        System.out.println("📦 [ZipService] ZIP créé: " + zipPath.toString());
        System.out.println("📦 [ZipService] Structure: xmldb.xml (racine) + 1/[documents]");
        System.out.println("📦 [ZipService] Contenu XML envoyé:");
        System.out.println("--- DÉBUT XML ---");
        System.out.println(xmlContent);
        System.out.println("--- FIN XML ---");
        
        // Copier le ZIP dans un emplacement accessible pour debug
        Path debugZip = Path.of(System.getProperty("user.home"), "Desktop", "APIML_DEBUG.zip");
        try {
            Files.copy(zipPath, debugZip, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            System.out.println("📦 [ZipService] ZIP copié pour debug: " + debugZip);
        } catch (Exception e) {
            System.out.println("⚠️ [ZipService] Impossible de copier le ZIP pour debug: " + e.getMessage());
        }
        
        return zipPath;
    }
}
