package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement;
import abdaty_technologie.API_Invest.service.AgrementService;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/agrement")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgrementController {

    private final AgrementService agrementService;
    
    /**
     * Endpoint de test pour vérifier que le contrôleur fonctionne
     * GET /api/v1/agrement/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testController() {
        System.out.println("=== AGREMENT CONTROLLER TEST ===");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "AgrementController is working");
        response.put("timestamp", java.time.Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Initier une demande d'agrément pour une entreprise
     * POST /api/v1/agrement/initier/{entrepriseId}
     */
    @PostMapping("/initier/{entrepriseId}")
    public ResponseEntity<?> initierDemandeAgrement(@PathVariable String entrepriseId) {
        try {
            Entreprise entreprise = agrementService.initierDemandeAgrement(entrepriseId);
            return ResponseEntity.ok(entreprise);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'initiation de la demande d'agrément"));
        }
    }

    /**
     * Valider l'étape actuelle et passer à la suivante
     * PUT /api/v1/agrement/valider/{entrepriseId}
     */
    @PutMapping("/valider/{entrepriseId}")
    public ResponseEntity<?> validerEtapeAgrement(
            @PathVariable String entrepriseId,
            @RequestParam EtapeValidation etapeActuelle) {
        try {
            Entreprise entreprise = agrementService.validerEtapeAgrement(entrepriseId, etapeActuelle);
            return ResponseEntity.ok(entreprise);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la validation de l'étape"));
        }
    }

    /**
     * Rejeter une demande à l'étape de révision
     * PUT /api/v1/agrement/rejeter/{entrepriseId}
     */
    @PutMapping("/rejeter/{entrepriseId}")
    public ResponseEntity<?> rejeterDemandeAgrement(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, String> body) {
        try {
            String observations = body.get("observations");
            Entreprise entreprise = agrementService.rejeterDemandeAgrement(entrepriseId, observations);
            return ResponseEntity.ok(entreprise);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du rejet de la demande"));
        }
    }

    /**
     * Délivrer l'agrément avec le type sélectionné
     * PUT /api/v1/agrement/delivrer/{entrepriseId}
     */
    @PutMapping("/delivrer/{entrepriseId}")
    public ResponseEntity<?> delivrerAgrement(
            @PathVariable String entrepriseId,
            @RequestBody Map<String, String> body) {
        try {
            TypeAgrement typeAgrement = TypeAgrement.valueOf(body.get("typeAgrement"));
            String observations = body.get("observations");
            
            Entreprise entreprise = agrementService.delivrerAgrement(entrepriseId, typeAgrement, observations);
            return ResponseEntity.ok(entreprise);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type d'agrément invalide"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la délivrance de l'agrément"));
        }
    }

    /**
     * Marquer l'agrément comme retiré
     * PUT /api/v1/agrement/marquer-retire/{entrepriseId}
     */
    @PutMapping("/marquer-retire/{entrepriseId}")
    public ResponseEntity<?> marquerAgrementRetire(@PathVariable String entrepriseId) {
        try {
            Entreprise entreprise = agrementService.marquerAgrementRetire(entrepriseId);
            return ResponseEntity.ok(entreprise);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du marquage comme retiré"));
        }
    }

    /**
     * Soumettre la demande d'agrément avec tous les documents
     * POST /api/v1/agrement/soumettre/{entrepriseId}
     */
    @PostMapping("/soumettre/{entrepriseId}")
    public ResponseEntity<?> soumettreDemandeAgrement(@PathVariable String entrepriseId) {
        try {
            Entreprise entreprise = agrementService.soumettreDemandeAgrement(entrepriseId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demande soumise avec succès. Elle sera traitée par un agent.",
                "entreprise", entreprise
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la soumission de la demande"));
        }
    }

    /**
     * Télécharger le template de demande d'autorisation pour le transport
     * GET /api/v1/agrement/template/transport
     */
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

    /**
     * Obtenir la liste des documents requis selon le type d'entreprise
     * GET /api/v1/agrement/documents-requis/{typeEntreprise}
     */
    @GetMapping("/documents-requis/{typeEntreprise}")
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

    /**
     * Upload d'un document pour l'autorisation d'exercice
     * POST /api/v1/agrement/upload/{entrepriseId}
     */
    @PostMapping(value = "/upload/{entrepriseId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable String entrepriseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("typeDocument") String typeDocument) {
        
        System.out.println("=== UPLOAD DOCUMENT DEBUG ===");
        System.out.println("Entreprise ID: " + entrepriseId);
        System.out.println("Type Document: " + typeDocument);
        System.out.println("Fichier: " + (file != null ? file.getOriginalFilename() : "null"));
        System.out.println("Taille: " + (file != null ? file.getSize() : 0) + " bytes");
        
        try {
            if (file == null || file.isEmpty()) {
                System.err.println("Erreur: Fichier vide ou null");
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Le fichier est vide"));
            }
            
            String uploadDir = "uploads/agrement/";
            Path uploadPath = Paths.get(uploadDir + entrepriseId);
            Files.createDirectories(uploadPath);
            System.out.println("Dossier créé: " + uploadPath.toAbsolutePath());
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = typeDocument.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis() + extension;
            
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("Fichier sauvegardé: " + filePath.toAbsolutePath());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("filename", filename);
            response.put("typeDocument", typeDocument);
            response.put("entrepriseId", entrepriseId);
            response.put("path", filePath.toString());
            
            System.out.println("Upload réussi!");
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            System.err.println("Erreur IOException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'upload du fichier: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Erreur générale: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur inattendue: " + e.getMessage()));
        }
    }

    /**
     * Télécharger un document spécifique d'agrément
     * GET /api/v1/agrement/file/{entrepriseId}/{filename}
     */
    @GetMapping("/file/{entrepriseId}/{filename:.+}")
    public ResponseEntity<byte[]> getDocumentFile(@PathVariable String entrepriseId, @PathVariable String filename) {
        System.out.println("[AgrementController] Recuperation document: " + filename + " pour entreprise: " + entrepriseId);
        
        try {
            String uploadDir = "uploads/agrement/";
            Path filePath = Paths.get(uploadDir + entrepriseId, filename);
            
            System.out.println("[AgrementController] Chemin fichier: " + filePath.toAbsolutePath());
            
            if (!Files.exists(filePath)) {
                System.err.println("[AgrementController] Fichier non trouve: " + filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            
            byte[] data = Files.readAllBytes(filePath);
            System.out.println("[AgrementController] Fichier lu: " + data.length + " bytes");
            
            // Determiner le type MIME
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
            System.err.println("[AgrementController] Erreur lecture fichier: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lister les documents uploadés pour une entreprise
     * GET /api/v1/agrement/documents/list/{entrepriseId}
     */
    @GetMapping("/documents/list/{entrepriseId}")
    public ResponseEntity<List<Map<String, String>>> getDocumentsList(@PathVariable String entrepriseId) {
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
}
