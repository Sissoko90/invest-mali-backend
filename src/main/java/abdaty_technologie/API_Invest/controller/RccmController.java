package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Documents;
import abdaty_technologie.API_Invest.dto.rccm.CreateCompanyRequest;
import abdaty_technologie.API_Invest.dto.rccm.CreatePersonRequest;
import abdaty_technologie.API_Invest.dto.rccm.RccmResponse;
import abdaty_technologie.API_Invest.repository.DocumentsRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.rccm.RccmService;
import abdaty_technologie.API_Invest.service.rccm.XmlBuilderService;
import abdaty_technologie.API_Invest.service.rccm.ZipService;
import abdaty_technologie.API_Invest.util.FileUtils;
import abdaty_technologie.API_Invest.util.MultipartBodyPublisher;
import abdaty_technologie.API_Invest.util.XmlResponseParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/rccm")
@CrossOrigin(origins = "*")
public class RccmController {

    @Autowired
    private XmlBuilderService xmlService;
    
    @Autowired
    private ZipService zipService;
    
    @Autowired
    private RccmService rccmService;
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private DocumentsRepository documentsRepository;

    @GetMapping("/test")
    public ResponseEntity<?> test() {
        System.out.println("🧪 [RccmController] Test endpoint appelé");
        return ResponseEntity.ok("RCCM Controller fonctionne !");
    }

    @PostMapping("/mock-rccm")
    public ResponseEntity<String> mockRccm(
            @RequestParam("identTiers") String identTiers,
            @RequestParam("noeud") String noeud,
            @RequestParam("zipFile") MultipartFile zipFile) {
        
        System.out.println("🎯 [MockRCCM] Simulation réception RCCM");
        System.out.println("📋 [MockRCCM] identTiers: " + identTiers);
        System.out.println("📋 [MockRCCM] noeud: " + noeud);
        System.out.println("📋 [MockRCCM] zipFile: " + zipFile.getOriginalFilename() + " (" + zipFile.getSize() + " bytes)");
        
        // Simuler une réponse RCCM réussie
        String mockResponse = """
            <?xml version="1.0" encoding="UTF-8"?>
            <response>
                <juridiction>Mali - Bamako</juridiction>
                <dossiers>
                    <dossier id="1">
                        <dosError>no</dosError>
                        <infos>
                            <refDos>ML-BKO-2025-001234</refDos>
                            <refProcess>ImmPPProcess</refProcess>
                            <name>Sharp</name>
                            <status>SUCCESS</status>
                            <message>Immatriculation réussie</message>
                        </infos>
                        <instances>
                            <instance id="1" status="CREATED"/>
                        </instances>
                    </dossier>
                </dossiers>
            </response>
            """;
        
        System.out.println("✅ [MockRCCM] Réponse simulée envoyée");
        return ResponseEntity.ok(mockResponse);
    }

    @PostMapping("/test-rccm-direct")
    public ResponseEntity<String> testRccmDirect(
            @RequestParam("identTiers") String identTiers,
            @RequestParam("noeud") String noeud,
            @RequestParam("zipFile") MultipartFile zipFile) {
        
        try {
            System.out.println("🧪 [TestRCCM] Test direct de l'API RCCM externe");
            System.out.println("📋 [TestRCCM] identTiers: " + identTiers);
            System.out.println("📋 [TestRCCM] noeud: " + noeud);
            System.out.println("📋 [TestRCCM] zipFile: " + zipFile.getOriginalFilename() + " (" + zipFile.getSize() + " bytes)");
            
            // URL de l'API RCCM externe
            String rccmUrl = "http://10.92.2.10:8080/RCCM-OHADA/webServTiers/save";
            System.out.println("🔗 [TestRCCM] URL cible: " + rccmUrl);
            
            // Créer la requête multipart directement
            MultipartBodyPublisher mp = new MultipartBodyPublisher()
                    .addField("identTiers", identTiers)
                    .addField("noeud", noeud);
            
            // Sauvegarder le fichier temporairement pour l'ajouter au multipart
            Path tempFile = java.nio.file.Files.createTempFile("test-rccm-", ".zip");
            zipFile.transferTo(tempFile.toFile());
            mp.addFile("zipFile", tempFile);
            
            System.out.println("📁 [TestRCCM] Fichier temporaire: " + tempFile.toString());
            
            // Créer la requête HTTP
            String credentials = "apiml:apiml223";
            String basicAuth = java.util.Base64.getEncoder().encodeToString(credentials.getBytes());
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(java.net.URI.create(rccmUrl))
                    .header("Authorization", "Basic " + basicAuth)
                    .header("Content-Type", "multipart/form-data; boundary=" + mp.getBoundary())
                    .header("Accept", "application/xml, text/xml, */*")
                    .header("User-Agent", "InvestMali-RCCM-Client/1.0")
                    .POST(mp.build())
                    .build();
            
            System.out.println("🔐 [TestRCCM] Headers envoyés:");
            request.headers().map().forEach((key, values) -> 
                System.out.println("   " + key + ": " + String.join(", ", values)));
            
            // Envoyer la requête
            System.out.println("📡 [TestRCCM] Envoi de la requête...");
            HttpResponse<String> response = java.net.http.HttpClient.newHttpClient()
                    .send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            
            // Nettoyer le fichier temporaire
            java.nio.file.Files.deleteIfExists(tempFile);
            
            System.out.println("🔄 [TestRCCM] Réponse RCCM: " + response.statusCode());
            System.out.println("📋 [TestRCCM] Response Headers:");
            response.headers().map().forEach((key, values) -> 
                System.out.println("   " + key + ": " + String.join(", ", values)));
            
            String body = response.body();
            System.out.println("📄 [TestRCCM] Body length: " + body.length());
            
            // Afficher seulement les premiers 500 caractères si c'est du HTML
            if (body.startsWith("<!DOCTYPE html") || body.startsWith("<html")) {
                System.out.println("📄 [TestRCCM] Body (HTML - premiers 500 chars): " + body.substring(0, Math.min(500, body.length())));
            } else {
                System.out.println("📄 [TestRCCM] Body: " + body);
            }
            
            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode())
                    .body("Erreur RCCM: " + response.statusCode() + " - " + body);
            }
            
            System.out.println("✅ [TestRCCM] Réponse reçue avec succès de l'API RCCM");
            return ResponseEntity.ok(body);
            
        } catch (Exception e) {
            System.err.println("❌ [TestRCCM] Erreur: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(500).body("Erreur test RCCM: " + e.getMessage());
        }
    }

    @PostMapping("/generate-pm-json")
    public ResponseEntity<?> generatePMJson(@RequestBody CreateCompanyRequest req) {
        try {
            System.out.println("🔄 [RccmController] Début génération RCCM PM (JSON)");
            System.out.println("🏢 [RccmController] Données reçues: " + req.toString());
            
            // Pour entreprise individuelle, utiliser buildXml qui gère automatiquement la conversion PP
            String xml = xmlService.buildXml(req);
            System.out.println("📄 [RccmController] XML généré, longueur: " + xml.length());
            System.out.println("📋 [RccmController] XML complet:");
            System.out.println("--- DÉBUT XML ---");
            System.out.println(xml);
            System.out.println("--- FIN XML ---");
            
            return process(xml, new ArrayList<>());
            
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            System.err.println("❌ [RccmController] Erreur génération PM JSON: " + errorMsg);
            System.err.println("❌ [RccmController] Type d'exception: " + e.getClass().getName());
            e.printStackTrace();
            
            RccmResponse errorResponse = new RccmResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Erreur lors de la génération RCCM PM: " + errorMsg);
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/generate-pm")
    public ResponseEntity<?> generatePM(
            @RequestPart("data") MultipartFile dataFile,
            @RequestPart(value = "files", required = false) List<MultipartFile> docs) {
        
        try {
            System.out.println("🔄 [RccmController] Début génération RCCM PM");
            System.out.println("📄 [RccmController] Fichier reçu: " + dataFile.getOriginalFilename() + " (" + dataFile.getSize() + " bytes)");
            
            // ÉCRIRE DANS UN FICHIER LOG POUR DEBUG
            try {
                java.nio.file.Files.write(
                    java.nio.file.Paths.get("rccm-debug.log"), 
                    ("REQUÊTE RCCM REÇUE: " + java.time.LocalDateTime.now() + "\n").getBytes(),
                    java.nio.file.StandardOpenOption.CREATE, 
                    java.nio.file.StandardOpenOption.APPEND
                );
            } catch (Exception logEx) { /* ignore */ }
            
            // Lire le contenu du fichier pour debug
            String jsonContent = new String(dataFile.getBytes());
            System.out.println("📋 [RccmController] Contenu JSON: " + jsonContent);
            
            // Désérialiser le fichier JSON en objet CreateCompanyRequest
            ObjectMapper objectMapper = new ObjectMapper();
            CreateCompanyRequest req = objectMapper.readValue(jsonContent, CreateCompanyRequest.class);
            
            System.out.println("✅ [RccmController] Désérialisation réussie pour: " + req.getCompanyName());
            System.out.println("🏢 [RccmController] Données: " + req.toString());
            
            // Pour entreprise individuelle, utiliser buildXml qui gère automatiquement la conversion PP
            String xml = xmlService.buildXml(req);
            System.out.println("📄 [RccmController] XML généré, longueur: " + xml.length());
            System.out.println("📋 [RccmController] XML complet:");
            System.out.println("--- DÉBUT XML ---");
            System.out.println(xml);
            System.out.println("--- FIN XML ---");
            
            return process(xml, docs);
            
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            System.err.println("❌ [RccmController] Erreur génération PM: " + errorMsg);
            System.err.println("❌ [RccmController] Type d'exception: " + e.getClass().getName());
            e.printStackTrace();
            
            RccmResponse errorResponse = new RccmResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Erreur lors de la génération RCCM PM: " + errorMsg);
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/generate-pp")
    public ResponseEntity<?> generatePP(
            @RequestPart("data") CreatePersonRequest req,
            @RequestPart(value = "files", required = false) List<MultipartFile> docs) {
        
        try {
            System.out.println("🔄 [RccmController] Génération RCCM PP pour: " + req.getFirstName() + " " + req.getLastName());
            
            String xml = xmlService.buildXmlPP(req);
            return process(xml, docs);
            
        } catch (Exception e) {
            System.err.println("❌ [RccmController] Erreur génération PP: " + e.getMessage());
            e.printStackTrace();
            
            RccmResponse errorResponse = new RccmResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Erreur lors de la génération RCCM PP: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Génère le RCCM pour une entreprise existante en base de données
     * Récupère automatiquement les informations (nom, prénom, etc.) depuis la BDD
     */
    @PostMapping("/generate-from-db/{entrepriseId}")
    public ResponseEntity<?> generateFromDatabase(@PathVariable String entrepriseId) {
        try {
            System.out.println("🔄 [RccmController] Génération RCCM depuis BDD pour entreprise: " + entrepriseId);
            
            // Récupérer l'entreprise avec ses membres
            Entreprise entreprise = entrepriseRepository.findByIdWithMembres(entrepriseId)
                    .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));

            // Charger les documents séparément (évite MultipleBagFetchException)
            List<Documents> docs = documentsRepository.findByEntrepriseId(entrepriseId);
            entreprise.setDocuments(docs);
            
            System.out.println("✅ [RccmController] Entreprise trouvée: " + entreprise.getNom());
            System.out.println("👥 [RccmController] Nombre de membres: " + entreprise.getMembres().size());
            System.out.println("📎 [RccmController] Nombre de documents: " + (entreprise.getDocuments() != null ? entreprise.getDocuments().size() : 0));
            
            // Générer le XML à partir des données de la BDD
            String xml = xmlService.buildXmlFromEntreprise(entreprise);
            System.out.println("📄 [RccmController] XML généré depuis BDD, longueur: " + xml.length());
            
            // Traiter et envoyer au RCCM
            ResponseEntity<?> response = process(xml, new ArrayList<>());
            
            // Si la génération RCCM est réussie, persister le numéro RCCM dans la BDD
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof RccmResponse) {
                RccmResponse rccmResponse = (RccmResponse) response.getBody();
                if (rccmResponse.isSuccess() && rccmResponse.getRefDos() != null && !rccmResponse.getRefDos().isEmpty()) {
                    entreprise.setNumeroRccm(rccmResponse.getRefDos());
                    
                    // Transférer automatiquement vers RCCM2 après génération du RCCM
                    if (entreprise.getEtapeValidation() == abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.TCOM) {
                        entreprise.setEtapeValidation(abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation.RCCM2);
                        System.out.println("🔄 [RccmController] Transition automatique TCOM → RCCM2 après génération RCCM");
                    }
                    
                    entrepriseRepository.save(entreprise);
                    System.out.println("💾 [RccmController] Numéro RCCM persisté: " + rccmResponse.getRefDos());
                    System.out.println("📋 [RccmController] Nom entreprise: " + rccmResponse.getName());
                    System.out.println("📍 [RccmController] Étape actuelle: " + entreprise.getEtapeValidation());
                }
            }
            
            return response;
            
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            System.err.println("❌ [RccmController] Erreur génération depuis BDD: " + errorMsg);
            e.printStackTrace();
            
            RccmResponse errorResponse = new RccmResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Erreur lors de la génération RCCM: " + errorMsg);
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private ResponseEntity<?> process(String xml, List<MultipartFile> docs) throws Exception {
        System.out.println("📄 [RccmController] XML généré: " + xml);
        
        // Convertir les MultipartFile en File
        List<File> realDocs = new ArrayList<>();
        if (docs != null) {
            for (MultipartFile mf : docs) {
                if (!mf.isEmpty()) {
                    File f = FileUtils.multipartFileToFile(mf);
                    realDocs.add(f);
                    System.out.println("📎 [RccmController] Fichier ajouté: " + mf.getOriginalFilename());
                }
            }
        }

        // Générer le ZIP
        Path zip = zipService.generateZip(xml, realDocs);
        System.out.println("📦 [RccmController] ZIP généré: " + zip.toString());

        // Envoyer au RCCM
        String responseXml = rccmService.sendToRccm(zip);

        // Parser et renvoyer la réponse
        RccmResponse parsed = XmlResponseParser.parse(responseXml);
        
        // Nettoyer les fichiers temporaires
        cleanupTempFiles(realDocs, zip);
        
        return ResponseEntity.ok(parsed);
    }

    private void cleanupTempFiles(List<File> files, Path zipPath) {
        try {
            // Supprimer les fichiers temporaires
            for (File f : files) {
                if (f.exists()) {
                    f.delete();
                }
            }
            
            // Supprimer le ZIP temporaire
            if (zipPath != null && zipPath.toFile().exists()) {
                zipPath.toFile().delete();
            }
            
            System.out.println("🧹 [RccmController] Fichiers temporaires nettoyés");
        } catch (Exception e) {
            System.err.println("⚠️ [RccmController] Erreur nettoyage fichiers temporaires: " + e.getMessage());
        }
    }
}
