<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.file.upload-dir:uploads/investment-agreements}")
    private String uploadDir;

    /**
     * Sauvegarder un fichier uploadé
     */
    public String storeFile(MultipartFile file, String investmentAgreementId, String documentType) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir, investmentAgreementId);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom de fichier unique
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = documentType + "_" + timestamp + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;

        // Chemin complet du fichier
        Path filePath = uploadPath.resolve(fileName);

        // Copier le fichier
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Retourner le chemin relatif
        return Paths.get(investmentAgreementId, fileName).toString();
    }

    /**
     * Supprimer un fichier
     */
    public boolean deleteFile(String filePath) {
        try {
            Path fullPath = Paths.get(uploadDir, filePath);
            return Files.deleteIfExists(fullPath);
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Obtenir l'extension d'un fichier
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    }

    /**
     * Vérifier si le type de fichier est autorisé
     */
    public boolean isAllowedFileType(String contentType) {
        return contentType != null && (
            contentType.equals("application/pdf") ||
            contentType.equals("application/msword") ||
            contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
            contentType.startsWith("image/")
        );
    }

    /**
     * Vérifier la taille du fichier (max 50MB)
     */
    public boolean isValidFileSize(long fileSize) {
        return fileSize <= 50 * 1024 * 1024; // 50MB
    }

    /**
     * Lire un fichier depuis le disque
     */
    public byte[] readFile(String filePath) throws IOException {
        Path fullPath = Paths.get(uploadDir, filePath);
        if (!Files.exists(fullPath)) {
            throw new IOException("Fichier non trouvé: " + filePath);
        }
        return Files.readAllBytes(fullPath);
    }
}
=======
package abdaty_technologie.API_Invest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.file.upload-dir:uploads/investment-agreements}")
    private String uploadDir;

    /**
     * Sauvegarder un fichier uploadé
     */
    public String storeFile(MultipartFile file, String investmentAgreementId, String documentType) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir, investmentAgreementId);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom de fichier unique
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = documentType + "_" + timestamp + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;

        // Chemin complet du fichier
        Path filePath = uploadPath.resolve(fileName);

        // Copier le fichier
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Retourner le chemin relatif
        return Paths.get(investmentAgreementId, fileName).toString();
    }

    /**
     * Supprimer un fichier
     */
    public boolean deleteFile(String filePath) {
        try {
            Path fullPath = Paths.get(uploadDir, filePath);
            return Files.deleteIfExists(fullPath);
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Obtenir l'extension d'un fichier
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    }

    /**
     * Vérifier si le type de fichier est autorisé
     */
    public boolean isAllowedFileType(String contentType) {
        return contentType != null && (
            contentType.equals("application/pdf") ||
            contentType.equals("application/msword") ||
            contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
            contentType.startsWith("image/")
        );
    }

    /**
     * Vérifier la taille du fichier (max 50MB)
     */
    public boolean isValidFileSize(long fileSize) {
        return fileSize <= 50 * 1024 * 1024; // 50MB
    }

    /**
     * Lire un fichier depuis le disque
     */
    public byte[] readFile(String filePath) throws IOException {
        Path fullPath = Paths.get(uploadDir, filePath);
        if (!Files.exists(fullPath)) {
            throw new IOException("Fichier non trouvé: " + filePath);
        }
        return Files.readAllBytes(fullPath);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
