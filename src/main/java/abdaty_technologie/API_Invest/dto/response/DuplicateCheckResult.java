package abdaty_technologie.API_Invest.dto.response;

public class DuplicateCheckResult {
    
    private boolean exists;
    
    private boolean hasUserAccount;
    
    private String personId;
    
    private String existingNom;
    
    private String existingPrenom;
    
    private String existingEmail;
    
    private String existingTelephone;
    
    private boolean nameConflict;
    
    private double nameSimilarityScore;
    
    private String conflictResolutionRequired;
    
    private String message;

    public DuplicateCheckResult() {}

    public DuplicateCheckResult(boolean exists, boolean hasUserAccount, String personId) {
        this.exists = exists;
        this.hasUserAccount = hasUserAccount;
        this.personId = personId;
    }

    public boolean isExists() {
        return exists;
    }

    public void setExists(boolean exists) {
        this.exists = exists;
    }

    public boolean isHasUserAccount() {
        return hasUserAccount;
    }

    public void setHasUserAccount(boolean hasUserAccount) {
        this.hasUserAccount = hasUserAccount;
    }

    public String getPersonId() {
        return personId;
    }

    public void setPersonId(String personId) {
        this.personId = personId;
    }

    public String getExistingNom() {
        return existingNom;
    }

    public void setExistingNom(String existingNom) {
        this.existingNom = existingNom;
    }

    public String getExistingPrenom() {
        return existingPrenom;
    }

    public void setExistingPrenom(String existingPrenom) {
        this.existingPrenom = existingPrenom;
    }

    public String getExistingEmail() {
        return existingEmail;
    }

    public void setExistingEmail(String existingEmail) {
        this.existingEmail = existingEmail;
    }

    public String getExistingTelephone() {
        return existingTelephone;
    }

    public void setExistingTelephone(String existingTelephone) {
        this.existingTelephone = existingTelephone;
    }

    public boolean isNameConflict() {
        return nameConflict;
    }

    public void setNameConflict(boolean nameConflict) {
        this.nameConflict = nameConflict;
    }

    public double getNameSimilarityScore() {
        return nameSimilarityScore;
    }

    public void setNameSimilarityScore(double nameSimilarityScore) {
        this.nameSimilarityScore = nameSimilarityScore;
    }

    public String getConflictResolutionRequired() {
        return conflictResolutionRequired;
    }

    public void setConflictResolutionRequired(String conflictResolutionRequired) {
        this.conflictResolutionRequired = conflictResolutionRequired;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
