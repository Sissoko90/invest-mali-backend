<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/agrement-files")
@CrossOrigin(origins = "*")
public class AgrementFileController {

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("AgrementFileController fonctionne!");
    }

    @GetMapping("/{entrepriseId}/{filename:.+}")
    public ResponseEntity<byte[]> getFile(@PathVariable String entrepriseId, @PathVariable String filename) {
        System.out.println("[AgrementFileController] Recuperation document: " + filename + " pour entreprise: " + entrepriseId);
        
        try {
            String uploadDir = "uploads/agrement/";
            Path filePath = Paths.get(uploadDir + entrepriseId, filename);
            
            System.out.println("[AgrementFileController] Chemin fichier: " + filePath.toAbsolutePath());
            
            if (!Files.exists(filePath)) {
                System.err.println("[AgrementFileController] Fichier non trouve: " + filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            
            byte[] data = Files.readAllBytes(filePath);
            System.out.println("[AgrementFileController] Fichier lu: " + data.length + " bytes");
            
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
            System.err.println("[AgrementFileController] Erreur lecture fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/agrement-files")
@CrossOrigin(origins = "*")
public class AgrementFileController {

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("AgrementFileController fonctionne!");
    }

    @GetMapping("/{entrepriseId}/{filename:.+}")
    public ResponseEntity<byte[]> getFile(@PathVariable String entrepriseId, @PathVariable String filename) {
        System.out.println("[AgrementFileController] Recuperation document: " + filename + " pour entreprise: " + entrepriseId);
        
        try {
            String uploadDir = "uploads/agrement/";
            Path filePath = Paths.get(uploadDir + entrepriseId, filename);
            
            System.out.println("[AgrementFileController] Chemin fichier: " + filePath.toAbsolutePath());
            
            if (!Files.exists(filePath)) {
                System.err.println("[AgrementFileController] Fichier non trouve: " + filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            
            byte[] data = Files.readAllBytes(filePath);
            System.out.println("[AgrementFileController] Fichier lu: " + data.length + " bytes");
            
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
            System.err.println("[AgrementFileController] Erreur lecture fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
