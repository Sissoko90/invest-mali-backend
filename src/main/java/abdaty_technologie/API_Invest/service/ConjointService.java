package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.request.ConjointRequest;
import abdaty_technologie.API_Invest.dto.response.ConjointResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ConjointService {
    
    ConjointResponse create(String personId, ConjointRequest request);
    
    ConjointResponse update(String conjointId, ConjointRequest request);
    
    void delete(String conjointId);
    
    List<ConjointResponse> getByPersonId(String personId);
    
    ConjointResponse getById(String conjointId);
    
    String uploadActeMariage(String conjointId, MultipartFile file);
    
    void deleteActeMariage(String conjointId);
}
