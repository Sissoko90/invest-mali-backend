package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.request.ConjointRequest;
import abdaty_technologie.API_Invest.dto.response.ConjointResponse;
import abdaty_technologie.API_Invest.service.ConjointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/conjoints")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConjointController {

    private final ConjointService conjointService;

    @PostMapping("/person/{personId}")
    public ResponseEntity<ConjointResponse> create(
            @PathVariable String personId,
            @Valid @RequestBody ConjointRequest request) {
        ConjointResponse response = conjointService.create(personId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{conjointId}")
    public ResponseEntity<ConjointResponse> update(
            @PathVariable String conjointId,
            @Valid @RequestBody ConjointRequest request) {
        ConjointResponse response = conjointService.update(conjointId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{conjointId}")
    public ResponseEntity<Void> delete(@PathVariable String conjointId) {
        conjointService.delete(conjointId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/person/{personId}")
    public ResponseEntity<List<ConjointResponse>> getByPersonId(@PathVariable String personId) {
        List<ConjointResponse> conjoints = conjointService.getByPersonId(personId);
        return ResponseEntity.ok(conjoints);
    }

    @GetMapping("/{conjointId}")
    public ResponseEntity<ConjointResponse> getById(@PathVariable String conjointId) {
        ConjointResponse response = conjointService.getById(conjointId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{conjointId}/acte-mariage")
    public ResponseEntity<String> uploadActeMariage(
            @PathVariable String conjointId,
            @RequestParam("file") MultipartFile file) {
        String filePath = conjointService.uploadActeMariage(conjointId, file);
        return ResponseEntity.ok(filePath);
    }

    @DeleteMapping("/{conjointId}/acte-mariage")
    public ResponseEntity<Void> deleteActeMariage(@PathVariable String conjointId) {
        conjointService.deleteActeMariage(conjointId);
        return ResponseEntity.noContent().build();
    }
}
