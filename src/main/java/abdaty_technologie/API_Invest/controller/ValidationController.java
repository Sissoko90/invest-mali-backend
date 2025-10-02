package abdaty_technologie.API_Invest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import abdaty_technologie.API_Invest.service.DocumentsService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/validation")
@CrossOrigin(origins = "*")
public class ValidationController {

    @Autowired
    private DocumentsService documentsService;

    /**
     * Vérifie si les numéros de pièces d'identité sont déjà utilisés
     */
    @PostMapping("/check-pieces")
    public ResponseEntity<Map<String, Object>> checkPiecesUniqueness(@RequestBody CheckPiecesRequest request) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Boolean> results = new HashMap<>();
        
        try {
            for (PieceToCheck piece : request.pieces) {
                boolean exists = documentsService.isPieceNumeroAlreadyUsed(piece.numeroPiece, piece.typePiece);
                results.put(piece.numeroPiece, exists);
            }
            
            response.put("success", true);
            response.put("results", results);
            response.put("message", "Vérification terminée");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Erreur lors de la vérification : " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // DTOs pour la validation
    public static class CheckPiecesRequest {
        public List<PieceToCheck> pieces;
    }

    public static class PieceToCheck {
        public String numeroPiece;
        public String typePiece;
    }
}
