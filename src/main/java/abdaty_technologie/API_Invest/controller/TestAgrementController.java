<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test-agrement")
@CrossOrigin(origins = "*")
public class TestAgrementController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        System.out.println("=== TEST AGREMENT CONTROLLER PING ===");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "TestAgrementController is working");
        response.put("timestamp", java.time.Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-initier/{id}")
    public ResponseEntity<Map<String, String>> testInitier(@PathVariable String id) {
        System.out.println("=== TEST INITIER - ID: " + id + " ===");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("entrepriseId", id);
        response.put("message", "Test endpoint works without service injection");
        return ResponseEntity.ok(response);
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test-agrement")
@CrossOrigin(origins = "*")
public class TestAgrementController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        System.out.println("=== TEST AGREMENT CONTROLLER PING ===");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "TestAgrementController is working");
        response.put("timestamp", java.time.Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-initier/{id}")
    public ResponseEntity<Map<String, String>> testInitier(@PathVariable String id) {
        System.out.println("=== TEST INITIER - ID: " + id + " ===");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("entrepriseId", id);
        response.put("message", "Test endpoint works without service injection");
        return ResponseEntity.ok(response);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
