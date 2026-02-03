package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.dto.response.DuplicateCheckResult;
import java.util.Optional;

public interface PersonDuplicateDetectionService {
    
    DuplicateCheckResult checkForDuplicates(String email, String telephone1, String nom, String prenom);
    
    Optional<Persons> findExistingPerson(String email, String telephone1);
    
    boolean areNamesSimilar(String name1, String name2);
    
    int calculateLevenshteinDistance(String s1, String s2);
    
    double calculateNameSimilarity(String nom1, String prenom1, String nom2, String prenom2);
}
