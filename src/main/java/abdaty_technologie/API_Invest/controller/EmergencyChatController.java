<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur d'urgence sans dépendances
 */
@RestController
@RequestMapping("/api/v1/emergency")
public class EmergencyChatController {

    @GetMapping("/test")
    public String test() {
        return "EMERGENCY CONTROLLER WORKS!";
    }

    @PostMapping("/chat/start")
    public String startChat() {
        return "EMERGENCY CHAT START WORKS!";
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur d'urgence sans dépendances
 */
@RestController
@RequestMapping("/api/v1/emergency")
public class EmergencyChatController {

    @GetMapping("/test")
    public String test() {
        return "EMERGENCY CONTROLLER WORKS!";
    }

    @PostMapping("/chat/start")
    public String startChat() {
        return "EMERGENCY CHAT START WORKS!";
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
