<<<<<<< HEAD
package abdaty_technologie.API_Invest.dto;

import lombok.Data;

@Data
public class NinaResponse {
    private String status;
    private String message; // Pour les messages d'erreur
    private NinaResult res;
    
    @Data
    public static class NinaResult {
        private String nina;
    }
}
=======
package abdaty_technologie.API_Invest.dto;

import lombok.Data;

@Data
public class NinaResponse {
    private String status;
    private String message; // Pour les messages d'erreur
    private NinaResult res;
    
    @Data
    public static class NinaResult {
        private String nina;
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
