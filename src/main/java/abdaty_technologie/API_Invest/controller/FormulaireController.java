package abdaty_technologie.API_Invest.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/formulaires")
@CrossOrigin(origins = "*")
public class FormulaireController {

    private final Path formulairesLocation;

    public FormulaireController() {
        // Chemin vers le dossier Demande-autorisation à la racine du projet
        this.formulairesLocation = Paths.get("Demande-autorisation").toAbsolutePath().normalize();
        System.out.println("📁 [FormulaireController] Dossier des formulaires: " + this.formulairesLocation);
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> downloadFormulaire(@PathVariable String filename) {
        try {
            System.out.println("📄 [FormulaireController] Demande de téléchargement: " + filename);
            
            Path filePath = this.formulairesLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                System.err.println("❌ [FormulaireController] Fichier non trouvé ou non lisible: " + filePath);
                return ResponseEntity.notFound().build();
            }

            // Vérifier que le fichier est bien dans le dossier autorisé (sécurité)
            if (!filePath.startsWith(this.formulairesLocation)) {
                System.err.println("⚠️ [FormulaireController] Tentative d'accès en dehors du dossier autorisé: " + filePath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Déterminer le type de contenu
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                if (filename.endsWith(".doc")) {
                    contentType = "application/msword";
                } else if (filename.endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else if (filename.endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else {
                    contentType = "application/octet-stream";
                }
            }

            System.out.println("✅ [FormulaireController] Fichier trouvé: " + filename + " (" + contentType + ")");

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            System.err.println("❌ [FormulaireController] URL malformée pour: " + filename);
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            System.err.println("❌ [FormulaireController] Erreur I/O pour: " + filename + " - " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<String> listFormulaires() {
        try {
            StringBuilder fileList = new StringBuilder("Formulaires disponibles:\n");
            Files.list(formulairesLocation)
                    .filter(path -> !path.getFileName().toString().startsWith("."))
                    .forEach(path -> fileList.append("- ").append(path.getFileName()).append("\n"));
            
            return ResponseEntity.ok(fileList.toString());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la liste des fichiers");
        }
    }
}
