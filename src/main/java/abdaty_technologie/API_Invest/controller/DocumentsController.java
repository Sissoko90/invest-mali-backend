package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

import abdaty_technologie.API_Invest.Entity.Documents;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;
import abdaty_technologie.API_Invest.dto.response.DocumentResponse;
import abdaty_technologie.API_Invest.service.DocumentsService;
import abdaty_technologie.API_Invest.repository.DocumentsRepository;
import abdaty_technologie.API_Invest.constants.Messages;

import java.time.LocalDate;

import java.sql.Blob;
import java.sql.SQLException;

@RestController
@RequestMapping("/documents")
public class DocumentsController {

    @Autowired
    private DocumentsService documentsService;

    @Autowired
    private DocumentsRepository documentsRepository;

    

    @PostMapping(path = "/piece", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadPiece(
            @RequestParam("personneId") String personneId,
            @RequestParam("entrepriseId") String entrepriseId,
            @RequestParam("typePiece") TypePieces typePiece,
            @RequestParam(value = "numero", required = false) String numero,
            @RequestParam("dateExpiration") String dateExpiration,
            @RequestParam("file") MultipartFile file
    ) {
        LocalDate exp;
        try {
            exp = LocalDate.parse(dateExpiration);
        } catch (Exception e) {
            throw new abdaty_technologie.API_Invest.exception.BadRequestException(Messages.invalidFieldFormat("dateExpiration"));
        }
        Documents saved = documentsService.uploadPiece(personneId, entrepriseId, typePiece, numero, exp, file);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PostMapping(path = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("personneId") String personneId,
            @RequestParam("entrepriseId") String entrepriseId,
            @RequestParam("typeDocument") TypeDocuments typeDocument,
            @RequestParam(value = "numero", required = false) String numero,
            @RequestParam("file") MultipartFile file
    ) {
        Documents saved = documentsService.uploadDocument(personneId, entrepriseId, typeDocument, numero, file);
        return ResponseEntity.ok(toResponse(saved));
    }

    @GetMapping("/entreprise/{entrepriseId}")
    public ResponseEntity<List<DocumentResponse>> getDocumentsByEntreprise(@PathVariable String entrepriseId) {
        List<Documents> documents = documentsRepository.findByEntrepriseId(entrepriseId);
        List<DocumentResponse> responses = documents.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping(path = "/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable String id) throws SQLException {
        Documents d = documentsRepository.findById(id).orElse(null);
        if (d == null || d.getPhotoPiece() == null) {
            return ResponseEntity.notFound().build();
        }
        Blob blob = d.getPhotoPiece();
        byte[] data = blob.getBytes(1, (int) blob.length());
        // Détection simple du type MIME par magic number
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        String ext = "";
        if (data.length >= 8 &&
            (data[0] & 0xFF) == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 &&
            data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A) {
            contentType = MediaType.IMAGE_PNG;
            ext = ".png";
        } else if (data.length >= 3 && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) {
            contentType = MediaType.IMAGE_JPEG;
            ext = ".jpg";
        } else if (data.length >= 4 && data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46) {
            contentType = MediaType.APPLICATION_PDF;
            ext = ".pdf";
        } else if (data.length >= 6 && data[0] == 'G' && data[1] == 'I' && data[2] == 'F' && data[3] == '8' && (data[4] == '7' || data[4] == '9') && data[5] == 'a') {
            contentType = MediaType.IMAGE_GIF;
            ext = ".gif";
        } else if (data.length >= 2 && data[0] == 'B' && data[1] == 'M') {
            contentType = MediaType.valueOf("image/bmp");
            ext = ".bmp";
        } else if (data.length >= 12 && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            contentType = MediaType.valueOf("image/webp");
            ext = ".webp";
        } else if ((data.length >= 4 && data[0] == 'I' && data[1] == 'I' && (data[2] & 0xFF) == 0x2A && data[3] == 0x00)
                || (data.length >= 4 && data[0] == 'M' && data[1] == 'M' && data[2] == 0x00 && (data[3] & 0xFF) == 0x2A)) {
            contentType = MediaType.valueOf("image/tiff");
            ext = ".tiff";
        } else if (data.length >= 8 && (data[0] & 0xFF) == 0xD0 && (data[1] & 0xFF) == 0xCF && (data[2] & 0xFF) == 0x11 && (data[3] & 0xFF) == 0xE0) {
            // OLE compound (doc/xls/ppt anciens) — on ne peut pas distinguer facilement sans parser, prenons .doc
            contentType = MediaType.valueOf("application/msword");
            ext = ".doc";
        } else if (data.length >= 2 && data[0] == 'P' && data[1] == 'K') {
            // ZIP-based (docx/xlsx/pptx/zip)
            if (containsAscii(data, "word/")) {
                contentType = MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                ext = ".docx";
            } else if (containsAscii(data, "xl/")) {
                contentType = MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                ext = ".xlsx";
            } else if (containsAscii(data, "ppt/")) {
                contentType = MediaType.valueOf("application/vnd.openxmlformats-officedocument.presentationml.presentation");
                ext = ".pptx";
            } else {
                contentType = MediaType.valueOf("application/zip");
                ext = ".zip";
            }
        } else if (data.length >= 5 && data[0] == '{' && data[1] == '\\' && data[2] == 'r' && data[3] == 't' && data[4] == 'f') {
            // RTF
            contentType = MediaType.valueOf("application/rtf");
            ext = ".rtf";
        } else if (data.length >= 5 && (char)data[0] == '<') {
            // peut être SVG ou XML
            contentType = MediaType.valueOf("image/svg+xml");
            ext = ".svg";
        } else if (isMostlyText(data)) {
            contentType = MediaType.TEXT_PLAIN;
            ext = ".txt";
        }

        String base = (d.getTypeDocument() != null ? d.getTypeDocument().name() : (d.getTypePiece() != null ? d.getTypePiece().name() : "document")) + "-" + d.getId();
        String filename = base + ext;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + filename)
                .contentType(contentType)
                .body(data);
    }

    private DocumentResponse toResponse(Documents d) {
        DocumentResponse r = new DocumentResponse();
        r.id = d.getId();
        r.typePiece = d.getTypePiece();
        r.typeDocument = d.getTypeDocument();
        r.numero = d.getNumero();
        r.personneId = d.getPersonne() != null ? d.getPersonne().getId() : null;
        r.entrepriseId = d.getEntreprise() != null ? d.getEntreprise().getId() : null;
        // URL relative (préfixée par spring.mvc.servlet.path=/api/v1 côté app):
        r.url = "/api/v1/documents/" + d.getId() + "/file";
        r.dateExpiration = d.getDateExpiration();
        return r;
    }

    // Heuristique simple pour détecter un contenu texte (ASCII imprimable majoritaire)
    private static boolean isMostlyText(byte[] data) {
        int len = Math.min(data.length, 512);
        if (len == 0) return false;
        int printable = 0;
        for (int i = 0; i < len; i++) {
            int b = data[i] & 0xFF;
            // ASCII imprimable + retours à la ligne/onglets
            if ((b >= 32 && b <= 126) || b == '\n' || b == '\r' || b == '\t') {
                printable++;
            }
        }
        return printable >= (len * 0.9);
    }

    // Recherche d'une sous-chaîne ASCII dans un tableau d'octets
    private static boolean containsAscii(byte[] data, String needle) {
        byte[] n = needle.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        outer: for (int i = 0; i <= data.length - n.length; i++) {
            for (int j = 0; j < n.length; j++) {
                if (data[i + j] != n[j]) continue outer;
            }
            return true;
        }
        return false;
    }
}
