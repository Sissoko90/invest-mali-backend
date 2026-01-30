<<<<<<< HEAD
package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.dto.NinaResponse;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.NinaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
@Slf4j
public class NinaServiceImpl implements NinaService {

    private final EntrepriseRepository entrepriseRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    // Configuration API INSTAT Mali
    @Value("${instat.api.base-url:https://apimali.test.instat.ml/api}")
    private String instatApiBaseUrl;
    
    @Value("${instat.api.bearer-token}")
    private String bearerToken;
    
    public NinaServiceImpl(EntrepriseRepository entrepriseRepository, RestTemplate restTemplate) {
        this.entrepriseRepository = entrepriseRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public NinaResponse generateNina(String entrepriseId, String rccm) {
        log.info("🔄 [NinaService] Génération NINA pour entreprise: {}", entrepriseId);
        
        try {
            // Récupérer l'entreprise
            log.info("🔍 [NinaService] Recherche entreprise: {}", entrepriseId);
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));
            
            log.info(" [NinaService] Entreprise trouvée: {}", entreprise.getNom());
            
            // Vérifier si l'entreprise a déjà un numéro NINA
            if (entreprise.getNumeroNina() != null && !entreprise.getNumeroNina().isEmpty()) {
                String ninaExistant = entreprise.getNumeroNina();
                log.warn(" [NinaService] Entreprise {} a déjà un numéro NINA: {}", 
                    entrepriseId, ninaExistant);
                
                // Retourner le NINA existant
                NinaResponse response = new NinaResponse();
                response.setStatus("success");
                NinaResponse.NinaResult result = new NinaResponse.NinaResult();
                result.setNina(ninaExistant);
                response.setRes(result);
                return response;
            }
            
            // APPEL À L'API INSTAT MALI OFFICIELLE
            log.info(" [NinaService] Appel à l'API INSTAT Mali officielle");
            log.info(" [NinaService] URL: {}/set/nina", instatApiBaseUrl);
            log.info(" [NinaService] RCCM: {}", rccm);
            
            // Appeler l'API INSTAT Mali
            NinaResponse apiResponse = callInstatNinaApi(entreprise, rccm);
            
            // Si succès, sauvegarder le NINA dans notre base locale
            if ("success".equals(apiResponse.getStatus()) && apiResponse.getRes() != null) {
                String ninaGenere = apiResponse.getRes().getNina();
                log.info(" [NinaService] NINA reçu de l'API INSTAT: {}", ninaGenere);
                
                // Persister dans notre base locale
                updateEntrepriseNina(entrepriseId, ninaGenere);
                log.info(" [NinaService] NINA sauvegardé localement pour entreprise: {}", entrepriseId);
            }
            
            return apiResponse;
            
        } catch (Exception e) {
            log.error(" [NinaService] Erreur lors de la génération NINA: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération NINA: " + e.getMessage(), e);
        }
    }
    
    // Méthodes supprimées car nous utilisons maintenant l'API INSTAT Mali officielle
    // L'unicité du RCCM est gérée directement par l'API INSTAT qui retourne une erreur si le RCCM existe déjà

    @Override
    public Entreprise updateEntrepriseNina(String entrepriseId, String numeroNina) {
        log.info("💾 [NinaService] Mise à jour NINA pour entreprise: {} -> {}", entrepriseId, numeroNina);
        
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));
        
        entreprise.setNumeroNina(numeroNina);
        return entrepriseRepository.save(entreprise);
    }

    @Override
    public byte[] generateCertificatePdf(String entrepriseId) {
        log.info(" [NinaService] Génération certificat PDF pour entreprise: {}", entrepriseId);
        
        try {
            // Récupérer l'entreprise
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));
            
            if (entreprise.getNumeroNina() == null || entreprise.getNumeroNina().trim().isEmpty()) {
                throw new RuntimeException("Aucun numéro NINA disponible pour cette entreprise");
            }
            
            log.info(" [NinaService] Entreprise trouvée: {} - NINA: {}", 
                entreprise.getNom(), entreprise.getNumeroNina());
            
            // Générer le PDF du certificat
            byte[] pdfBytes = createNinaCertificatePdf(entreprise);
            
            log.info(" [NinaService] Certificat PDF généré avec succès, taille: {} bytes", pdfBytes.length);
            
            return pdfBytes;
            
        } catch (Exception e) {
            log.error(" [NinaService] Erreur lors de la génération du certificat PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du certificat: " + e.getMessage(), e);
        }
    }
    
    private byte[] createNinaCertificatePdf(Entreprise entreprise) {
        // Créer un PDF professionnel basé sur le modèle officiel INSTAT Mali
        
        // Extraire les informations de localisation
        String divisionCode = entreprise.getDivisionCode();
        String region = "BAMAKO"; // Par défaut, à extraire du divisionCode
        String cercle = "BAMAKO";
        String commune = "COMMUNE V"; // À extraire du divisionCode
        String localite = "Baco Djicoroni"; // À récupérer depuis la base
        
        if (divisionCode != null && divisionCode.length() >= 8) {
            // Mapping des codes vers les noms (à implémenter avec l'API INSTAT)
            String regionCode = divisionCode.substring(0, 2);
            if ("90".equals(regionCode)) {
                region = "BAMAKO";
                cercle = "BAMAKO";
            }
        }
        
        // Déterminer le type d'entreprise
        String formeJuridique = "Entreprise Individuelle";
        if (entreprise.getTypeEntreprise() != null) {
            switch (entreprise.getTypeEntreprise().toString()) {
                case "ENTREPRISE_INDIVIDUELLE" -> formeJuridique = "Entreprise Individuelle";
                case "SOCIETE" -> formeJuridique = "Société";
                case "GIE" -> formeJuridique = "GIE";
                default -> formeJuridique = entreprise.getTypeEntreprise().toString();
            }
        }
        
        // Le template HTML est disponible via generateCertificateHtml() pour future conversion PDF
        
        // Pour l'instant, retourner un PDF simple avec plus d'informations
        String pdfContent = String.format("""
            %%PDF-1.4
            1 0 obj
            <<
            /Type /Catalog
            /Pages 2 0 R
            >>
            endobj
            2 0 obj
            <<
            /Type /Pages
            /Kids [3 0 R]
            /Count 1
            >>
            endobj
            3 0 obj
            <<
            /Type /Page
            /Parent 2 0 R
            /MediaBox [0 0 595 842]
            /Contents 4 0 R
            /Resources <<
            /Font <<
            /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
            /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
            >>
            >>
            >>
            endobj
            4 0 obj
            <<
            /Length 1200
            >>
            stream
            BT
            /F2 14 Tf
            50 800 Td
            (MINISTERE EN CHARGE DE LA STATISTIQUE) Tj
            350 0 Td
            (REPUBLIQUE DU MALI) Tj
            -350 -20 Td
            (INSTITUT NATIONAL DE LA STATISTIQUE) Tj
            350 0 Td
            (UN PEUPLE - UN BUT - UNE FOI) Tj
            -350 -15 Td
            (\\(INSTAT\\)) Tj
            -50 -20 Td
            350 0 Td
            (AGENCE POUR LA PROMOTION DES) Tj
            -350 -15 Td
            (CELLULE DE GESTION DU NINA) Tj
            350 0 Td
            (INVESTISSEMENTS AU MALI \\(API-MALI\\)) Tj
            -350 -30 Td
            400 0 Td
            (GUICHET UNIQUE DE CREATION) Tj
            -400 -15 Td
            400 0 Td
            (D'ENTREPRISES) Tj
            -200 -50 Td
            /F2 16 Tf
            (CERTIFICAT D'IMMATRICULATION) Tj
            -150 -40 Td
            /F1 12 Tf
            (Je soussigne, le Directeur General de l'Institut National de la Statistique, atteste que le) Tj
            -150 -30 Td
            /F2 14 Tf
            (Numero d'Immatriculation National \\(NINA\\) : %s) Tj
            -150 -30 Td
            /F1 11 Tf
            (A ete attribue a :) Tj
            0 -25 Td
            (Sigle :                    %s) Tj
            0 -15 Td
            (Nom du responsable :       %s) Tj
            0 -15 Td
            (Prenom du responsable :    %s) Tj
            0 -15 Td
            (Immatricule au RCCM le :   %s) Tj
            0 -15 Td
            (Dans la region de :        %s) Tj
            0 -15 Td
            (Cercle de :                %s) Tj
            0 -15 Td
            (Commune de :               %s) Tj
            0 -15 Td
            (Localite de :              %s) Tj
            0 -15 Td
            (Forme juridique :          %s) Tj
            0 -15 Td
            (Activite principale :      %s) Tj
            0 -15 Td
            (Details de l'activite :    %s) Tj
            0 -30 Td
            (Date de la demande :       %s) Tj
            0 -40 Td
            (Le present certificat lui est delivre pour servir et valoir ce que de droit.) Tj
            300 -60 Td
            (Bamako, le %s) Tj
            0 -15 Td
            (La Direction du Guichet Unique) Tj
            0 -15 Td
            (P/O) Tj
            ET
            endstream
            endobj
            xref
            0 5
            0000000000 65535 f 
            0000000009 00000 n 
            0000000058 00000 n 
            0000000115 00000 n 
            0000000300 00000 n 
            trailer
            <<
            /Size 5
            /Root 1 0 R
            >>
            startxref
            1550
            %%%%EOF""", 
            entreprise.getNumeroNina(),
            entreprise.getSigle() != null ? entreprise.getSigle() : "",
            "A_COMPLETER", // Nom responsable - TODO: récupérer depuis la base
            "A_COMPLETER", // Prénom responsable - TODO: récupérer depuis la base
            "03/09/2025", // Date RCCM - TODO: récupérer depuis la base
            region,
            cercle,
            commune,
            localite,
            formeJuridique,
            entreprise.getDomaineActivite() != null ? entreprise.getDomaineActivite() : "Commerce de détail",
            "Commerçant détaillant", // TODO: récupérer depuis la base
            java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRENCH))
        );
        
        return pdfContent.getBytes();
    }
    
    // Template HTML disponible via le composant React Certificate.tsx pour la prévisualisation

    /**
     * Appelle l'API INSTAT Mali pour générer un numéro NINA
     */
    private NinaResponse callInstatNinaApi(Entreprise entreprise, String rccm) {
        try {
            // Déterminer le type d'entreprise pour l'URL
            String typeEntreprise = entreprise.getTypeEntreprise() != null && 
                                   entreprise.getTypeEntreprise().toString().contains("INDIVIDUELLE") ? "3" : "4";
            
            String url = instatApiBaseUrl + "/set/nina/" + typeEntreprise;
            log.info("🌐 [NinaService] Appel API INSTAT: {} (type: {})", url, typeEntreprise);
            log.info("🔑 [NinaService] Token Bearer: {}...{}", 
                bearerToken != null ? bearerToken.substring(0, Math.min(10, bearerToken.length())) : "NULL",
                bearerToken != null && bearerToken.length() > 20 ? bearerToken.substring(bearerToken.length() - 10) : "");
            
            // Préparer les headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBearerAuth(bearerToken);
            headers.add("accept", "*/*");
            headers.add("X-CSRF-TOKEN", "");
            
            log.info("📋 [NinaService] Headers configurés: Content-Type={}, Authorization=Bearer [MASKED]", 
                headers.getContentType());
            
            // Préparer le body (form-urlencoded)
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            
            // Données de base
            body.add("raison_soc", entreprise.getNom() != null ? entreprise.getNom() : "Entreprise");
            body.add("sigle", entreprise.getSigle() != null ? entreprise.getSigle() : "");
            body.add("rccm", rccm);
            body.add("date_creation", "2025-12-01"); // TODO: utiliser la vraie date
            
            // Localisation basée sur divisionCode de l'entreprise
            String divisionCode = entreprise.getDivisionCode();
            if (divisionCode == null || divisionCode.isEmpty()) {
                log.error("❌ [NinaService] DivisionCode manquant pour l'entreprise: {}", entreprise.getNom());
                throw new RuntimeException("Code de division manquant pour l'entreprise. Veuillez compléter les informations de localisation.");
            }
            
            if (divisionCode.length() < 12) {
                log.error("❌ [NinaService] DivisionCode invalide (longueur: {}) pour l'entreprise: {}", 
                    divisionCode.length(), entreprise.getNom());
                throw new RuntimeException("Code de division invalide. Format attendu: 12 caractères (ex: 900104010001)");
            }
            
            // Extraire les composants de localisation depuis le divisionCode réel
            String region = divisionCode.substring(0, 2);      // Ex: "90"
            String cercle = divisionCode.substring(0, 4);      // Ex: "9001"  
            String commune = divisionCode.substring(0, 8);     // Ex: "90010101"
            String vfq = divisionCode;                          // Ex: "900101010020" (code complet)
            
            // Validation : tous les codes doivent être récupérés depuis la base de données
            log.info("🔍 [NinaService] Codes extraits du divisionCode - Région: {}, Cercle: {}, Commune: {}, VFQ: {}", 
                region, cercle, commune, vfq);
            
            // Note: Si l'API INSTAT retourne une erreur "VFQ invalid", cela signifie que 
            // le divisionCode de l'entreprise contient un VFQ qui n'existe pas dans l'API INSTAT.
            // Il faut corriger le divisionCode de l'entreprise avec les vraies données de localisation.
            
            body.add("region", region);
            body.add("cercle", cercle);
            body.add("commune", commune);
            body.add("vfq", vfq);
            
            log.info("📍 [NinaService] Localisation extraite - Région: {}, Cercle: {}, Commune: {}, VFQ: {}", 
                region, cercle, commune, vfq);
            log.warn("⚠️ [NinaService] DivisionCode source: {} -> VFQ extrait: {}", divisionCode, vfq);
            
            // Informations du responsable/gérant
            // TODO: Récupérer les vraies informations du gérant depuis la base de données
            // Il faudrait ajouter une relation Entreprise -> Personne (gérant) ou des champs dédiés
            body.add("nom_responsable", "A_COMPLETER"); // Nom du gérant/responsable légal
            body.add("prenom_responsable", "A_COMPLETER"); // Prénom du gérant/responsable légal
            
            log.warn("⚠️ [NinaService] Informations responsable non récupérées - TODO: implémenter la relation Entreprise->Gérant");
            
            log.info("📋 [NinaService] Données envoyées: raison_soc={}, rccm={}, region={}, commune={}", 
                body.getFirst("raison_soc"), rccm, body.getFirst("region"), body.getFirst("commune"));
            
            // Créer la requête
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            // Faire l'appel API
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            log.info("✅ [NinaService] Réponse API INSTAT: Status={}, Body={}", 
                response.getStatusCode(), response.getBody());
            
            // Parser la réponse JSON
            return parseInstatResponse(response.getBody());
            
        } catch (HttpClientErrorException e) {
            log.error("❌ [NinaService] Erreur client API INSTAT ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            String responseBody = e.getResponseBodyAsString();
            
            // Vérifier si c'est du HTML (page d'erreur) ou du JSON
            if (responseBody.trim().startsWith("<")) {
                log.error("🚨 [NinaService] Réponse HTML reçue au lieu de JSON - Problème d'authentification ou d'URL");
                return createErrorResponse("Erreur d'authentification API INSTAT. Vérifiez le token Bearer et l'URL.");
            }
            
            return parseErrorResponse(responseBody);
            
        } catch (HttpServerErrorException e) {
            log.error("❌ [NinaService] Erreur serveur API INSTAT ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            String responseBody = e.getResponseBodyAsString();
            
            if (responseBody.trim().startsWith("<")) {
                log.error("🚨 [NinaService] Réponse HTML reçue - Erreur serveur INSTAT");
                return createErrorResponse("Erreur serveur API INSTAT. Service temporairement indisponible.");
            }
            
            return createErrorResponse("Erreur serveur API INSTAT: " + e.getMessage());
            
        } catch (ResourceAccessException e) {
            log.error("❌ [NinaService] Erreur de connexion API INSTAT: {}", e.getMessage());
            return createErrorResponse("Impossible de contacter l'API INSTAT: " + e.getMessage());
            
        } catch (Exception e) {
            log.error("❌ [NinaService] Erreur inattendue API INSTAT: {}", e.getMessage(), e);
            return createErrorResponse("Erreur inattendue: " + e.getMessage());
        }
    }
    
    /**
     * Parse la réponse JSON de l'API INSTAT
     */
    private NinaResponse parseInstatResponse(String jsonResponse) {
        try {
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            NinaResponse response = new NinaResponse();
            
            if (rootNode.has("status")) {
                response.setStatus(rootNode.get("status").asText());
            }
            
            if (rootNode.has("res") && rootNode.get("res").has("nina")) {
                NinaResponse.NinaResult result = new NinaResponse.NinaResult();
                result.setNina(rootNode.get("res").get("nina").asText());
                response.setRes(result);
                
                log.info("🎯 [NinaService] NINA extrait de la réponse: {}", result.getNina());
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ [NinaService] Erreur parsing réponse INSTAT: {}", e.getMessage());
            return createErrorResponse("Erreur de parsing de la réponse: " + e.getMessage());
        }
    }
    
    /**
     * Parse une réponse d'erreur de l'API INSTAT
     */
    private NinaResponse parseErrorResponse(String errorResponse) {
        try {
            // Vérifier si c'est du HTML
            if (errorResponse.trim().startsWith("<")) {
                log.error("🚨 [NinaService] Réponse HTML reçue dans parseErrorResponse");
                return createErrorResponse("Erreur d'authentification ou de configuration API INSTAT");
            }
            
            JsonNode rootNode = objectMapper.readTree(errorResponse);
            NinaResponse response = new NinaResponse();
            response.setStatus("error");
            
            // Extraire le message d'erreur pour le frontend
            if (rootNode.has("errors")) {
                JsonNode errorsNode = rootNode.get("errors");
                StringBuilder errorMessage = new StringBuilder();
                
                errorsNode.fieldNames().forEachRemaining(fieldName -> {
                    JsonNode fieldErrors = errorsNode.get(fieldName);
                    if (fieldErrors.isArray()) {
                        fieldErrors.forEach(error -> {
                            if (errorMessage.length() > 0) errorMessage.append("; ");
                            errorMessage.append(fieldName).append(": ").append(error.asText());
                        });
                    }
                });
                
                String finalErrorMessage = errorMessage.toString();
                response.setMessage(finalErrorMessage);
                log.warn("⚠️ [NinaService] Erreurs API INSTAT: {}", finalErrorMessage);
                
                // Message spécifique pour les erreurs de VFQ
                if (finalErrorMessage.contains("vfq") && finalErrorMessage.contains("invalid")) {
                    log.error("🚨 [NinaService] Erreur VFQ invalide détectée. Le divisionCode de l'entreprise contient un VFQ qui n'existe pas dans l'API INSTAT.");
                    log.error("💡 [NinaService] Solution: Corriger le divisionCode de l'entreprise avec les vraies données de localisation depuis votre base de données.");
                }
            } else {
                // Pas de champ "errors", utiliser le message général
                String message = rootNode.has("message") ? rootNode.get("message").asText() : "Erreur API INSTAT";
                response.setMessage(message);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ [NinaService] Erreur parsing erreur INSTAT: {}", e.getMessage());
            // Tronquer la réponse pour éviter les logs trop longs
            String truncatedResponse = errorResponse.length() > 200 ? 
                errorResponse.substring(0, 200) + "..." : errorResponse;
            return createErrorResponse("Erreur parsing réponse API INSTAT: " + truncatedResponse);
        }
    }
    
    /**
     * Crée une réponse d'erreur générique
     */
    private NinaResponse createErrorResponse(String message) {
        NinaResponse response = new NinaResponse();
        response.setStatus("error");
        response.setMessage(message);
        return response;
    }
}
=======
package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.dto.NinaResponse;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.NinaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
@Slf4j
public class NinaServiceImpl implements NinaService {

    private final EntrepriseRepository entrepriseRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    // Configuration API INSTAT Mali
    @Value("${instat.api.base-url:https://apimali.test.instat.ml/api}")
    private String instatApiBaseUrl;
    
    @Value("${instat.api.bearer-token}")
    private String bearerToken;
    
    public NinaServiceImpl(EntrepriseRepository entrepriseRepository, RestTemplate restTemplate) {
        this.entrepriseRepository = entrepriseRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public NinaResponse generateNina(String entrepriseId, String rccm) {
        log.info("🔄 [NinaService] Génération NINA pour entreprise: {}", entrepriseId);
        
        try {
            // Récupérer l'entreprise
            log.info("🔍 [NinaService] Recherche entreprise: {}", entrepriseId);
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));
            
            log.info(" [NinaService] Entreprise trouvée: {}", entreprise.getNom());
            
            // Vérifier si l'entreprise a déjà un numéro NINA
            if (entreprise.getNumeroNina() != null && !entreprise.getNumeroNina().isEmpty()) {
                String ninaExistant = entreprise.getNumeroNina();
                log.warn(" [NinaService] Entreprise {} a déjà un numéro NINA: {}", 
                    entrepriseId, ninaExistant);
                
                // Retourner le NINA existant
                NinaResponse response = new NinaResponse();
                response.setStatus("success");
                NinaResponse.NinaResult result = new NinaResponse.NinaResult();
                result.setNina(ninaExistant);
                response.setRes(result);
                return response;
            }
            
            // APPEL À L'API INSTAT MALI OFFICIELLE
            log.info(" [NinaService] Appel à l'API INSTAT Mali officielle");
            log.info(" [NinaService] URL: {}/set/nina", instatApiBaseUrl);
            log.info(" [NinaService] RCCM: {}", rccm);
            
            // Appeler l'API INSTAT Mali
            NinaResponse apiResponse = callInstatNinaApi(entreprise, rccm);
            
            // Si succès, sauvegarder le NINA dans notre base locale
            if ("success".equals(apiResponse.getStatus()) && apiResponse.getRes() != null) {
                String ninaGenere = apiResponse.getRes().getNina();
                log.info(" [NinaService] NINA reçu de l'API INSTAT: {}", ninaGenere);
                
                // Persister dans notre base locale
                updateEntrepriseNina(entrepriseId, ninaGenere);
                log.info(" [NinaService] NINA sauvegardé localement pour entreprise: {}", entrepriseId);
            }
            
            return apiResponse;
            
        } catch (Exception e) {
            log.error(" [NinaService] Erreur lors de la génération NINA: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération NINA: " + e.getMessage(), e);
        }
    }
    
    // Méthodes supprimées car nous utilisons maintenant l'API INSTAT Mali officielle
    // L'unicité du RCCM est gérée directement par l'API INSTAT qui retourne une erreur si le RCCM existe déjà

    @Override
    public Entreprise updateEntrepriseNina(String entrepriseId, String numeroNina) {
        log.info("💾 [NinaService] Mise à jour NINA pour entreprise: {} -> {}", entrepriseId, numeroNina);
        
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));
        
        entreprise.setNumeroNina(numeroNina);
        return entrepriseRepository.save(entreprise);
    }

    @Override
    public byte[] generateCertificatePdf(String entrepriseId) {
        log.info(" [NinaService] Génération certificat PDF pour entreprise: {}", entrepriseId);
        
        try {
            // Récupérer l'entreprise
            Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new RuntimeException("Entreprise non trouvée: " + entrepriseId));
            
            if (entreprise.getNumeroNina() == null || entreprise.getNumeroNina().trim().isEmpty()) {
                throw new RuntimeException("Aucun numéro NINA disponible pour cette entreprise");
            }
            
            log.info(" [NinaService] Entreprise trouvée: {} - NINA: {}", 
                entreprise.getNom(), entreprise.getNumeroNina());
            
            // Générer le PDF du certificat
            byte[] pdfBytes = createNinaCertificatePdf(entreprise);
            
            log.info(" [NinaService] Certificat PDF généré avec succès, taille: {} bytes", pdfBytes.length);
            
            return pdfBytes;
            
        } catch (Exception e) {
            log.error(" [NinaService] Erreur lors de la génération du certificat PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du certificat: " + e.getMessage(), e);
        }
    }
    
    private byte[] createNinaCertificatePdf(Entreprise entreprise) {
        // Créer un PDF professionnel basé sur le modèle officiel INSTAT Mali
        
        // Extraire les informations de localisation
        String divisionCode = entreprise.getDivisionCode();
        String region = "BAMAKO"; // Par défaut, à extraire du divisionCode
        String cercle = "BAMAKO";
        String commune = "COMMUNE V"; // À extraire du divisionCode
        String localite = "Baco Djicoroni"; // À récupérer depuis la base
        
        if (divisionCode != null && divisionCode.length() >= 8) {
            // Mapping des codes vers les noms (à implémenter avec l'API INSTAT)
            String regionCode = divisionCode.substring(0, 2);
            if ("90".equals(regionCode)) {
                region = "BAMAKO";
                cercle = "BAMAKO";
            }
        }
        
        // Déterminer le type d'entreprise
        String formeJuridique = "Entreprise Individuelle";
        if (entreprise.getTypeEntreprise() != null) {
            switch (entreprise.getTypeEntreprise().toString()) {
                case "ENTREPRISE_INDIVIDUELLE" -> formeJuridique = "Entreprise Individuelle";
                case "SOCIETE" -> formeJuridique = "Société";
                case "GIE" -> formeJuridique = "GIE";
                default -> formeJuridique = entreprise.getTypeEntreprise().toString();
            }
        }
        
        // Le template HTML est disponible via generateCertificateHtml() pour future conversion PDF
        
        // Pour l'instant, retourner un PDF simple avec plus d'informations
        String pdfContent = String.format("""
            %%PDF-1.4
            1 0 obj
            <<
            /Type /Catalog
            /Pages 2 0 R
            >>
            endobj
            2 0 obj
            <<
            /Type /Pages
            /Kids [3 0 R]
            /Count 1
            >>
            endobj
            3 0 obj
            <<
            /Type /Page
            /Parent 2 0 R
            /MediaBox [0 0 595 842]
            /Contents 4 0 R
            /Resources <<
            /Font <<
            /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
            /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
            >>
            >>
            >>
            endobj
            4 0 obj
            <<
            /Length 1200
            >>
            stream
            BT
            /F2 14 Tf
            50 800 Td
            (MINISTERE EN CHARGE DE LA STATISTIQUE) Tj
            350 0 Td
            (REPUBLIQUE DU MALI) Tj
            -350 -20 Td
            (INSTITUT NATIONAL DE LA STATISTIQUE) Tj
            350 0 Td
            (UN PEUPLE - UN BUT - UNE FOI) Tj
            -350 -15 Td
            (\\(INSTAT\\)) Tj
            -50 -20 Td
            350 0 Td
            (AGENCE POUR LA PROMOTION DES) Tj
            -350 -15 Td
            (CELLULE DE GESTION DU NINA) Tj
            350 0 Td
            (INVESTISSEMENTS AU MALI \\(API-MALI\\)) Tj
            -350 -30 Td
            400 0 Td
            (GUICHET UNIQUE DE CREATION) Tj
            -400 -15 Td
            400 0 Td
            (D'ENTREPRISES) Tj
            -200 -50 Td
            /F2 16 Tf
            (CERTIFICAT D'IMMATRICULATION) Tj
            -150 -40 Td
            /F1 12 Tf
            (Je soussigne, le Directeur General de l'Institut National de la Statistique, atteste que le) Tj
            -150 -30 Td
            /F2 14 Tf
            (Numero d'Immatriculation National \\(NINA\\) : %s) Tj
            -150 -30 Td
            /F1 11 Tf
            (A ete attribue a :) Tj
            0 -25 Td
            (Sigle :                    %s) Tj
            0 -15 Td
            (Nom du responsable :       %s) Tj
            0 -15 Td
            (Prenom du responsable :    %s) Tj
            0 -15 Td
            (Immatricule au RCCM le :   %s) Tj
            0 -15 Td
            (Dans la region de :        %s) Tj
            0 -15 Td
            (Cercle de :                %s) Tj
            0 -15 Td
            (Commune de :               %s) Tj
            0 -15 Td
            (Localite de :              %s) Tj
            0 -15 Td
            (Forme juridique :          %s) Tj
            0 -15 Td
            (Activite principale :      %s) Tj
            0 -15 Td
            (Details de l'activite :    %s) Tj
            0 -30 Td
            (Date de la demande :       %s) Tj
            0 -40 Td
            (Le present certificat lui est delivre pour servir et valoir ce que de droit.) Tj
            300 -60 Td
            (Bamako, le %s) Tj
            0 -15 Td
            (La Direction du Guichet Unique) Tj
            0 -15 Td
            (P/O) Tj
            ET
            endstream
            endobj
            xref
            0 5
            0000000000 65535 f 
            0000000009 00000 n 
            0000000058 00000 n 
            0000000115 00000 n 
            0000000300 00000 n 
            trailer
            <<
            /Size 5
            /Root 1 0 R
            >>
            startxref
            1550
            %%%%EOF""", 
            entreprise.getNumeroNina(),
            entreprise.getSigle() != null ? entreprise.getSigle() : "",
            "A_COMPLETER", // Nom responsable - TODO: récupérer depuis la base
            "A_COMPLETER", // Prénom responsable - TODO: récupérer depuis la base
            "03/09/2025", // Date RCCM - TODO: récupérer depuis la base
            region,
            cercle,
            commune,
            localite,
            formeJuridique,
            entreprise.getDomaineActivite() != null ? entreprise.getDomaineActivite() : "Commerce de détail",
            "Commerçant détaillant", // TODO: récupérer depuis la base
            java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRENCH))
        );
        
        return pdfContent.getBytes();
    }
    
    // Template HTML disponible via le composant React Certificate.tsx pour la prévisualisation

    /**
     * Appelle l'API INSTAT Mali pour générer un numéro NINA
     */
    private NinaResponse callInstatNinaApi(Entreprise entreprise, String rccm) {
        try {
            // Déterminer le type d'entreprise pour l'URL
            String typeEntreprise = entreprise.getTypeEntreprise() != null && 
                                   entreprise.getTypeEntreprise().toString().contains("INDIVIDUELLE") ? "3" : "4";
            
            String url = instatApiBaseUrl + "/set/nina/" + typeEntreprise;
            log.info("🌐 [NinaService] Appel API INSTAT: {} (type: {})", url, typeEntreprise);
            log.info("🔑 [NinaService] Token Bearer: {}...{}", 
                bearerToken != null ? bearerToken.substring(0, Math.min(10, bearerToken.length())) : "NULL",
                bearerToken != null && bearerToken.length() > 20 ? bearerToken.substring(bearerToken.length() - 10) : "");
            
            // Préparer les headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBearerAuth(bearerToken);
            headers.add("accept", "*/*");
            headers.add("X-CSRF-TOKEN", "");
            
            log.info("📋 [NinaService] Headers configurés: Content-Type={}, Authorization=Bearer [MASKED]", 
                headers.getContentType());
            
            // Préparer le body (form-urlencoded)
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            
            // Données de base
            body.add("raison_soc", entreprise.getNom() != null ? entreprise.getNom() : "Entreprise");
            body.add("sigle", entreprise.getSigle() != null ? entreprise.getSigle() : "");
            body.add("rccm", rccm);
            body.add("date_creation", "2025-12-01"); // TODO: utiliser la vraie date
            
            // Localisation basée sur divisionCode de l'entreprise
            String divisionCode = entreprise.getDivisionCode();
            if (divisionCode == null || divisionCode.isEmpty()) {
                log.error("❌ [NinaService] DivisionCode manquant pour l'entreprise: {}", entreprise.getNom());
                throw new RuntimeException("Code de division manquant pour l'entreprise. Veuillez compléter les informations de localisation.");
            }
            
            if (divisionCode.length() < 12) {
                log.error("❌ [NinaService] DivisionCode invalide (longueur: {}) pour l'entreprise: {}", 
                    divisionCode.length(), entreprise.getNom());
                throw new RuntimeException("Code de division invalide. Format attendu: 12 caractères (ex: 900104010001)");
            }
            
            // Extraire les composants de localisation depuis le divisionCode réel
            String region = divisionCode.substring(0, 2);      // Ex: "90"
            String cercle = divisionCode.substring(0, 4);      // Ex: "9001"  
            String commune = divisionCode.substring(0, 8);     // Ex: "90010101"
            String vfq = divisionCode;                          // Ex: "900101010020" (code complet)
            
            // Validation : tous les codes doivent être récupérés depuis la base de données
            log.info("🔍 [NinaService] Codes extraits du divisionCode - Région: {}, Cercle: {}, Commune: {}, VFQ: {}", 
                region, cercle, commune, vfq);
            
            // Note: Si l'API INSTAT retourne une erreur "VFQ invalid", cela signifie que 
            // le divisionCode de l'entreprise contient un VFQ qui n'existe pas dans l'API INSTAT.
            // Il faut corriger le divisionCode de l'entreprise avec les vraies données de localisation.
            
            body.add("region", region);
            body.add("cercle", cercle);
            body.add("commune", commune);
            body.add("vfq", vfq);
            
            log.info("📍 [NinaService] Localisation extraite - Région: {}, Cercle: {}, Commune: {}, VFQ: {}", 
                region, cercle, commune, vfq);
            log.warn("⚠️ [NinaService] DivisionCode source: {} -> VFQ extrait: {}", divisionCode, vfq);
            
            // Informations du responsable/gérant
            // TODO: Récupérer les vraies informations du gérant depuis la base de données
            // Il faudrait ajouter une relation Entreprise -> Personne (gérant) ou des champs dédiés
            body.add("nom_responsable", "A_COMPLETER"); // Nom du gérant/responsable légal
            body.add("prenom_responsable", "A_COMPLETER"); // Prénom du gérant/responsable légal
            
            log.warn("⚠️ [NinaService] Informations responsable non récupérées - TODO: implémenter la relation Entreprise->Gérant");
            
            log.info("📋 [NinaService] Données envoyées: raison_soc={}, rccm={}, region={}, commune={}", 
                body.getFirst("raison_soc"), rccm, body.getFirst("region"), body.getFirst("commune"));
            
            // Créer la requête
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            // Faire l'appel API
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            log.info("✅ [NinaService] Réponse API INSTAT: Status={}, Body={}", 
                response.getStatusCode(), response.getBody());
            
            // Parser la réponse JSON
            return parseInstatResponse(response.getBody());
            
        } catch (HttpClientErrorException e) {
            log.error("❌ [NinaService] Erreur client API INSTAT ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            String responseBody = e.getResponseBodyAsString();
            
            // Vérifier si c'est du HTML (page d'erreur) ou du JSON
            if (responseBody.trim().startsWith("<")) {
                log.error("🚨 [NinaService] Réponse HTML reçue au lieu de JSON - Problème d'authentification ou d'URL");
                return createErrorResponse("Erreur d'authentification API INSTAT. Vérifiez le token Bearer et l'URL.");
            }
            
            return parseErrorResponse(responseBody);
            
        } catch (HttpServerErrorException e) {
            log.error("❌ [NinaService] Erreur serveur API INSTAT ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            String responseBody = e.getResponseBodyAsString();
            
            if (responseBody.trim().startsWith("<")) {
                log.error("🚨 [NinaService] Réponse HTML reçue - Erreur serveur INSTAT");
                return createErrorResponse("Erreur serveur API INSTAT. Service temporairement indisponible.");
            }
            
            return createErrorResponse("Erreur serveur API INSTAT: " + e.getMessage());
            
        } catch (ResourceAccessException e) {
            log.error("❌ [NinaService] Erreur de connexion API INSTAT: {}", e.getMessage());
            return createErrorResponse("Impossible de contacter l'API INSTAT: " + e.getMessage());
            
        } catch (Exception e) {
            log.error("❌ [NinaService] Erreur inattendue API INSTAT: {}", e.getMessage(), e);
            return createErrorResponse("Erreur inattendue: " + e.getMessage());
        }
    }
    
    /**
     * Parse la réponse JSON de l'API INSTAT
     */
    private NinaResponse parseInstatResponse(String jsonResponse) {
        try {
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            NinaResponse response = new NinaResponse();
            
            if (rootNode.has("status")) {
                response.setStatus(rootNode.get("status").asText());
            }
            
            if (rootNode.has("res") && rootNode.get("res").has("nina")) {
                NinaResponse.NinaResult result = new NinaResponse.NinaResult();
                result.setNina(rootNode.get("res").get("nina").asText());
                response.setRes(result);
                
                log.info("🎯 [NinaService] NINA extrait de la réponse: {}", result.getNina());
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ [NinaService] Erreur parsing réponse INSTAT: {}", e.getMessage());
            return createErrorResponse("Erreur de parsing de la réponse: " + e.getMessage());
        }
    }
    
    /**
     * Parse une réponse d'erreur de l'API INSTAT
     */
    private NinaResponse parseErrorResponse(String errorResponse) {
        try {
            // Vérifier si c'est du HTML
            if (errorResponse.trim().startsWith("<")) {
                log.error("🚨 [NinaService] Réponse HTML reçue dans parseErrorResponse");
                return createErrorResponse("Erreur d'authentification ou de configuration API INSTAT");
            }
            
            JsonNode rootNode = objectMapper.readTree(errorResponse);
            NinaResponse response = new NinaResponse();
            response.setStatus("error");
            
            // Extraire le message d'erreur pour le frontend
            if (rootNode.has("errors")) {
                JsonNode errorsNode = rootNode.get("errors");
                StringBuilder errorMessage = new StringBuilder();
                
                errorsNode.fieldNames().forEachRemaining(fieldName -> {
                    JsonNode fieldErrors = errorsNode.get(fieldName);
                    if (fieldErrors.isArray()) {
                        fieldErrors.forEach(error -> {
                            if (errorMessage.length() > 0) errorMessage.append("; ");
                            errorMessage.append(fieldName).append(": ").append(error.asText());
                        });
                    }
                });
                
                String finalErrorMessage = errorMessage.toString();
                response.setMessage(finalErrorMessage);
                log.warn("⚠️ [NinaService] Erreurs API INSTAT: {}", finalErrorMessage);
                
                // Message spécifique pour les erreurs de VFQ
                if (finalErrorMessage.contains("vfq") && finalErrorMessage.contains("invalid")) {
                    log.error("🚨 [NinaService] Erreur VFQ invalide détectée. Le divisionCode de l'entreprise contient un VFQ qui n'existe pas dans l'API INSTAT.");
                    log.error("💡 [NinaService] Solution: Corriger le divisionCode de l'entreprise avec les vraies données de localisation depuis votre base de données.");
                }
            } else {
                // Pas de champ "errors", utiliser le message général
                String message = rootNode.has("message") ? rootNode.get("message").asText() : "Erreur API INSTAT";
                response.setMessage(message);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ [NinaService] Erreur parsing erreur INSTAT: {}", e.getMessage());
            // Tronquer la réponse pour éviter les logs trop longs
            String truncatedResponse = errorResponse.length() > 200 ? 
                errorResponse.substring(0, 200) + "..." : errorResponse;
            return createErrorResponse("Erreur parsing réponse API INSTAT: " + truncatedResponse);
        }
    }
    
    /**
     * Crée une réponse d'erreur générique
     */
    private NinaResponse createErrorResponse(String message) {
        NinaResponse response = new NinaResponse();
        response.setStatus("error");
        response.setMessage(message);
        return response;
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
