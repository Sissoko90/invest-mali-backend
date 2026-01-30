<<<<<<< HEAD
package abdaty_technologie.API_Invest.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;

public class FileUtils {

    public static File multipartFileToFile(MultipartFile multipartFile) throws IOException {
        // Créer un fichier temporaire
        File tempFile = Files.createTempFile("upload_", "_" + multipartFile.getOriginalFilename()).toFile();
        
        // Écrire le contenu du MultipartFile dans le fichier temporaire
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(multipartFile.getBytes());
        }
        
        return tempFile;
    }
}
=======
package abdaty_technologie.API_Invest.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;

public class FileUtils {

    public static File multipartFileToFile(MultipartFile multipartFile) throws IOException {
        // Créer un fichier temporaire
        File tempFile = Files.createTempFile("upload_", "_" + multipartFile.getOriginalFilename()).toFile();
        
        // Écrire le contenu du MultipartFile dans le fichier temporaire
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(multipartFile.getBytes());
        }
        
        return tempFile;
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
