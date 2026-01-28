package abdaty_technologie.API_Invest.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;

@RestController
@RequestMapping("/test")
@CrossOrigin(origins = "*")
public class TestController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Test Controller fonctionne !");
        response.put("timestamp", new Date().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuth() {
        Map<String, Object> response = new HashMap<>();
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        response.put("authenticated", authentication != null && authentication.isAuthenticated());
        response.put("username", authentication != null ? authentication.getName() : null);
        response.put("authorities", authentication != null ? authentication.getAuthorities() : null);
        response.put("principal", authentication != null ? authentication.getPrincipal() : null);
        response.put("timestamp", new Date().toString());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-investment")
    public ResponseEntity<Map<String, Object>> testCreateInvestment(@RequestBody Map<String, String> data) {
        Map<String, Object> response = new HashMap<>();
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = "anonymous";
        String email = null;
        
        if (authentication != null && authentication.getName() != null) {
            email = authentication.getName();
            // Simuler la récupération du personne_id (pour le test)
            if ("mdz.dev54@gmail.com".equals(email)) {
                userId = "c980d55e-020f-4ceb-b752-a0267921441c"; // personne_id de mdz.dev54@gmail.com
            } else {
                userId = email; // Fallback sur l'email
            }
        }
        
        response.put("success", true);
        response.put("userId", userId);
        response.put("email", email);
        response.put("inputData", data);
        response.put("message", "Test de création avec personne_id: " + userId);
        response.put("timestamp", new Date().toString());
        
        return ResponseEntity.ok(response);
    }
}
