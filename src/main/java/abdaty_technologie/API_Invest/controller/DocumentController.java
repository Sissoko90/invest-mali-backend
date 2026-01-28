package abdaty_technologie.API_Invest.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import abdaty_technologie.API_Invest.exception.NotFoundException;

import java.io.IOException;

/**
 * Contrôleur pour la gestion des documents
 */
@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    /**
     * Endpoint pour récupérer le fichier d'un document
     * Pour l'instant, retourne un PDF de démonstration
     */
    @GetMapping("/{documentId}/file")
    public ResponseEntity<byte[]> getDocumentFile(@PathVariable String documentId) {
        try {
            System.out.println("📄 [DocumentController] Demande de fichier pour le document: " + documentId);
            
            // Vérifier si c'est un document de notre système
            if (documentId.startsWith("real-doc-") || documentId.startsWith("fallback-doc")) {
                // Générer un PDF de démonstration simple
                byte[] pdfContent = generateDemoPdf(documentId);
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("inline", "document-" + documentId + ".pdf");
                headers.setContentLength(pdfContent.length);
                
                System.out.println("✅ [DocumentController] PDF généré pour: " + documentId + " (" + pdfContent.length + " bytes)");
                
                return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
            } else {
                throw new NotFoundException("Document non trouvé: " + documentId);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [DocumentController] Erreur lors de la récupération du document " + documentId + ": " + e.getMessage());
            e.printStackTrace();
            throw new NotFoundException("Document non trouvé: " + documentId);
        }
    }
    
    /**
     * Génère un PDF de démonstration simple
     */
    private byte[] generateDemoPdf(String documentId) throws IOException {
        // Contenu PDF minimal (header PDF basique)
        String pdfContent = "%PDF-1.4\n" +
            "1 0 obj\n" +
            "<<\n" +
            "/Type /Catalog\n" +
            "/Pages 2 0 R\n" +
            ">>\n" +
            "endobj\n" +
            "2 0 obj\n" +
            "<<\n" +
            "/Type /Pages\n" +
            "/Kids [3 0 R]\n" +
            "/Count 1\n" +
            ">>\n" +
            "endobj\n" +
            "3 0 obj\n" +
            "<<\n" +
            "/Type /Page\n" +
            "/Parent 2 0 R\n" +
            "/MediaBox [0 0 612 792]\n" +
            "/Contents 4 0 R\n" +
            "/Resources <<\n" +
            "/Font <<\n" +
            "/F1 <<\n" +
            "/Type /Font\n" +
            "/Subtype /Type1\n" +
            "/BaseFont /Helvetica\n" +
            ">>\n" +
            ">>\n" +
            ">>\n" +
            ">>\n" +
            "endobj\n" +
            "4 0 obj\n" +
            "<<\n" +
            "/Length 100\n" +
            ">>\n" +
            "stream\n" +
            "BT\n" +
            "/F1 12 Tf\n" +
            "100 700 Td\n" +
            "(Document de demonstration: " + documentId + ") Tj\n" +
            "0 -20 Td\n" +
            "(Ceci est un document PDF genere pour les tests.) Tj\n" +
            "ET\n" +
            "endstream\n" +
            "endobj\n" +
            "xref\n" +
            "0 5\n" +
            "0000000000 65535 f \n" +
            "0000000009 00000 n \n" +
            "0000000074 00000 n \n" +
            "0000000120 00000 n \n" +
            "0000000274 00000 n \n" +
            "trailer\n" +
            "<<\n" +
            "/Size 5\n" +
            "/Root 1 0 R\n" +
            ">>\n" +
            "startxref\n" +
            "424\n" +
            "%%EOF";
            
        return pdfContent.getBytes();
    }
}
