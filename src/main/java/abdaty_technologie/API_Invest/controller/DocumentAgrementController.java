package abdaty_technologie.API_Invest.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/documents-agrement")
@CrossOrigin(origins = "*")
public class DocumentAgrementController {

    @GetMapping("/template/transport")
    public ResponseEntity<Resource> downloadTransportTemplate() {
        try {
            Resource resource = new ClassPathResource("templates/autorisation/Transport_Template.doc");
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Demande_Autorisation_Transport.doc");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/requis/{typeEntreprise}")
    public ResponseEntity<Map<String, Object>> getDocumentsRequis(@PathVariable String typeEntreprise) {
        try {
            Map<String, Object> response = new HashMap<>();
            List<String> documents = new ArrayList<>();
            
            if ("PERSONNE_PHYSIQUE".equalsIgnoreCase(typeEntreprise) || "ENTREPRISE_INDIVIDUELLE".equalsIgnoreCase(typeEntreprise)) {
                documents.add("Demande timbrée");
                documents.add("Extrait de l'acte de naissance ou du jugement supplétif en tenant lieu");
                documents.add("Extrait du casier judiciaire datant de moins de trois mois");
                documents.add("Certificat de nationalité");
                documents.add("Certificat de résidence");
                documents.add("Diplôme d'enseignement secondaire au moins ou attestation de capacité professionnelle");
                documents.add("Certificat d'inscription au registre des transporteurs");
                documents.add("Liste détaillée du matériel roulant");
            } else {
                documents.add("Demande timbrée");
                documents.add("Copie certifiée conforme des statuts");
                documents.add("Extrait de l'acte de naissance du responsable dirigeant");
                documents.add("Casier judiciaire du responsable dirigeant datant de moins de 3 mois");
                documents.add("Certificat de nationalité du responsable dirigeant");
                documents.add("Copie du diplôme d'enseignement secondaire au moins ou attestation de capacité professionnelle du responsable dirigeant");
                documents.add("Certificat d'inscription au registre des transporteurs");
                documents.add("Liste détaillée du matériel roulant");
            }
            
            response.put("typeEntreprise", typeEntreprise);
            response.put("documents", documents);
            response.put("templateDisponible", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la récupération des documents requis: " + e.getMessage()));
        }
    }

    @PostMapping("/upload/{entrepriseId}")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable String entrepriseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("typeDocument") String typeDocument) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Le fichier est vide"));
            }
            
            String uploadDir = "uploads/agrement/";
            Path uploadPath = Paths.get(uploadDir + entrepriseId);
            Files.createDirectories(uploadPath);
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = typeDocument.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis() + extension;
            
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("filename", filename);
            response.put("typeDocument", typeDocument);
            response.put("entrepriseId", entrepriseId);
            response.put("path", filePath.toString());
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'upload du fichier: " + e.getMessage()));
        }
    }

    @GetMapping("/liste/{entrepriseId}")
    public ResponseEntity<List<Map<String, String>>> getDocuments(@PathVariable String entrepriseId) {
        try {
            String uploadDir = "uploads/agrement/";
            Path uploadPath = Paths.get(uploadDir + entrepriseId);
            List<Map<String, String>> documents = new ArrayList<>();
            
            if (Files.exists(uploadPath)) {
                Files.list(uploadPath).forEach(path -> {
                    Map<String, String> doc = new HashMap<>();
                    doc.put("filename", path.getFileName().toString());
                    doc.put("path", path.toString());
                    try {
                        doc.put("size", String.valueOf(Files.size(path)));
                    } catch (IOException e) {
                        doc.put("size", "0");
                    }
                    documents.add(doc);
                });
            }
            
            return ResponseEntity.ok(documents);
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/file/{entrepriseId}/{filename:.+}")
    public ResponseEntity<byte[]> getFile(@PathVariable String entrepriseId, @PathVariable String filename) {
        try {
            String uploadDir = "uploads/agrement/";
            Path filePath = Paths.get(uploadDir + entrepriseId, filename);
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] data = Files.readAllBytes(filePath);
            
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("inline", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data);
                    
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
