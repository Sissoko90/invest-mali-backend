package abdaty_technologie.API_Invest.dto;

import java.time.LocalDateTime;

public class InvestmentAgreementDocumentDto {
    private String id;
    private String originalFilename;
    private String documentType;
    private String contentType;
    private Long fileSize;
    private String filePath;
    private LocalDateTime uploadDate;
    private String investmentAgreementId;

    // Constructeurs
    public InvestmentAgreementDocumentDto() {}

    public InvestmentAgreementDocumentDto(String id, String originalFilename, String documentType, 
                                        String contentType, Long fileSize, String filePath, 
                                        LocalDateTime uploadDate, String investmentAgreementId) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.documentType = documentType;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.filePath = filePath;
        this.uploadDate = uploadDate;
        this.investmentAgreementId = investmentAgreementId;
    }

    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }

    public String getInvestmentAgreementId() {
        return investmentAgreementId;
    }

    public void setInvestmentAgreementId(String investmentAgreementId) {
        this.investmentAgreementId = investmentAgreementId;
    }
}
