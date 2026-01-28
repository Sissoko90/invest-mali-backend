package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.request.PersonCreateRequest;
import abdaty_technologie.API_Invest.dto.request.PersonUpdateRequest;
import abdaty_technologie.API_Invest.dto.response.PersonResponse;
import java.util.List;

public interface PersonService {
    PersonResponse create(PersonCreateRequest req);
    PersonResponse getById(String id);
    List<PersonResponse> list();
    PersonResponse update(String id, PersonUpdateRequest req);
    void delete(String id);
}
