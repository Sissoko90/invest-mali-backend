<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur de test basique
 */
@RestController
@RequestMapping("/api/v1/basic-test")
@CrossOrigin(origins = "*")
public class BasicTestController {
    
    /**
     * Test ultra simple
     */
    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello World - BasicTestController fonctionne !");
    }
    
    /**
     * Test avec try-catch
     */
    @GetMapping("/safe-test")
    public ResponseEntity<String> safeTest() {
        try {
            return ResponseEntity.ok("✅ Test sécurisé réussi");
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Erreur: " + e.getMessage());
        }
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur de test basique
 */
@RestController
@RequestMapping("/api/v1/basic-test")
@CrossOrigin(origins = "*")
public class BasicTestController {
    
    /**
     * Test ultra simple
     */
    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello World - BasicTestController fonctionne !");
    }
    
    /**
     * Test avec try-catch
     */
    @GetMapping("/safe-test")
    public ResponseEntity<String> safeTest() {
        try {
            return ResponseEntity.ok("✅ Test sécurisé réussi");
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Erreur: " + e.getMessage());
        }
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
