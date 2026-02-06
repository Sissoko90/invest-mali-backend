package abdaty_technologie.API_Invest.dto.rccm;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RccmResponse {
    private String refDos;
    private String refProcess;
    private String name;
    private boolean success;
    private String message;
    
    public RccmResponse(String refDos, String refProcess, String name) {
        this.refDos = refDos;
        this.refProcess = refProcess;
        this.name = name;
        this.success = true;
    }
}
