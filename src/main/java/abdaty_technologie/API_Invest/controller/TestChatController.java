<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test-chat")
@CrossOrigin(origins = "*")
public class TestChatController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Chat controller is working!");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent-initiate")
    public ResponseEntity<Map<String, Object>> testAgentInitiate(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Test endpoint working");
        response.put("received", request);
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
@RequestMapping("/test-chat")
@CrossOrigin(origins = "*")
public class TestChatController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Chat controller is working!");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent-initiate")
    public ResponseEntity<Map<String, Object>> testAgentInitiate(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Test endpoint working");
        response.put("received", request);
        return ResponseEntity.ok(response);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
