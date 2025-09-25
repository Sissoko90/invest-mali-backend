package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.Entity.Enum.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/enums")
@CrossOrigin(origins = "*")
public class EnumController {

    @GetMapping("/type-entreprise")
    public ResponseEntity<List<Map<String, String>>> getTypeEntreprise() {
        List<Map<String, String>> result = Arrays.stream(TypeEntreprise.values())
                .map(type -> Map.of(
                        "key", type.name(),
                        "value", type.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/forme-juridique")
    public ResponseEntity<List<Map<String, String>>> getFormeJuridique() {
        List<Map<String, String>> result = Arrays.stream(FormeJuridique.values())
                .map(forme -> Map.of(
                        "key", forme.name(),
                        "value", forme.getValue(),
                        "label", forme.getLabel()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/domaine-activites")
    public ResponseEntity<List<Map<String, String>>> getDomaineActivites() {
        List<Map<String, String>> result = Arrays.stream(DomaineActivites.values())
                .map(domaine -> Map.of(
                        "key", domaine.name(),
                        "value", domaine.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/nationalites")
    public ResponseEntity<List<Map<String, String>>> getNationalites() {
        List<Map<String, String>> result = Arrays.stream(Nationalites.values())
                .map(nationalite -> Map.of(
                        "key", nationalite.name(),
                        "value", nationalite.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sexes")
    public ResponseEntity<List<Map<String, String>>> getSexes() {
        List<Map<String, String>> result = Arrays.stream(Sexes.values())
                .map(sexe -> Map.of(
                        "key", sexe.name(),
                        "value", sexe.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/civilites")
    public ResponseEntity<List<Map<String, String>>> getCivilites() {
        List<Map<String, String>> result = Arrays.stream(Civilites.values())
                .map(civilite -> Map.of(
                        "key", civilite.name(),
                        "value", civilite.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/situation-matrimoniales")
    public ResponseEntity<List<Map<String, String>>> getSituationMatrimoniales() {
        List<Map<String, String>> result = Arrays.stream(SituationMatrimoniales.values())
                .map(situation -> Map.of(
                        "key", situation.name(),
                        "value", situation.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/piece-identites")
    public ResponseEntity<List<Map<String, String>>> getPieceIdentites() {
        List<Map<String, String>> result = Arrays.stream(TypePieces.values())
                .map(piece -> Map.of(
                        "key", piece.name(),
                        "value", piece.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, String>>> getRoles() {
        List<Map<String, String>> result = Arrays.stream(Roles.values())
                .map(role -> Map.of(
                        "key", role.name(),
                        "value", role.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/antenne-agents")
    public ResponseEntity<List<Map<String, String>>> getAntenneAgents() {
        List<Map<String, String>> result = Arrays.stream(AntenneAgents.values())
                .map(antenne -> Map.of(
                        "key", antenne.name(),
                        "value", antenne.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/type-paiement")
    public ResponseEntity<List<Map<String, String>>> getTypePaiement() {
        List<Map<String, String>> result = Arrays.stream(TypePaiement.values())
                .map(type -> Map.of(
                        "key", type.name(),
                        "value", type.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/mobile-money")
    public ResponseEntity<List<Map<String, String>>> getMobileMoney() {
        List<Map<String, String>> result = Arrays.stream(MobileMoney.values())
                .map(mobile -> Map.of(
                        "key", mobile.name(),
                        "value", mobile.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/statut-creation")
    public ResponseEntity<List<Map<String, String>>> getStatutCreation() {
        List<Map<String, String>> result = Arrays.stream(StatutCreation.values())
                .map(statut -> Map.of(
                        "key", statut.name(),
                        "value", statut.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/etape-validation")
    public ResponseEntity<List<Map<String, String>>> getEtapeValidation() {
        List<Map<String, String>> result = Arrays.stream(EtapeValidation.values())
                .map(etape -> Map.of(
                        "key", etape.name(),
                        "value", etape.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/division-type")
    public ResponseEntity<List<Map<String, String>>> getDivisionType() {
        List<Map<String, String>> result = Arrays.stream(DivisionType.values())
                .map(division -> Map.of(
                        "key", division.name(),
                        "value", division.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/type-documents")
    public ResponseEntity<List<Map<String, String>>> getTypeDocuments() {
        List<Map<String, String>> result = Arrays.stream(TypeDocuments.values())
                .map(document -> Map.of(
                        "key", document.name(),
                        "value", document.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/statut-paiement")
    public ResponseEntity<List<Map<String, String>>> getStatutPaiement() {
        List<Map<String, String>> result = Arrays.stream(StatutPaiement.values())
                .map(statut -> Map.of(
                        "key", statut.name(),
                        "value", statut.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/document-plans")
    public ResponseEntity<List<Map<String, String>>> getDocumentPlans() {
        List<Map<String, String>> result = Arrays.stream(DocumentPlan.values())
                .map(plan -> Map.of(
                        "key", plan.name(),
                        "value", plan.getValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
