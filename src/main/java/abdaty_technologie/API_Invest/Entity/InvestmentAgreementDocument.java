<<<<<<< HEAD
package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "investment_agreement_documents")
public class InvestmentAgreementDocument {
    
    @Id
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;
    
    @Column(name = "investment_agreement_id", nullable = false)
    private String investmentAgreementId;
    
    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType; // "DEMANDE_TIMBREE", "ETUDE_FAISABILITE", etc.
    
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;
    
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "content_type")
    private String contentType;
    
    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_agreement_id", insertable = false, updatable = false)
    private InvestmentAgreement investmentAgreement;
    
    // Manual getter and setter methods
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getInvestmentAgreementId() {
        return investmentAgreementId;
    }
    
    public void setInvestmentAgreementId(String investmentAgreementId) {
        this.investmentAgreementId = investmentAgreementId;
    }
    
    public String getDocumentType() {
        return documentType;
    }
    
    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }
    
    public String getOriginalFilename() {
        return originalFilename;
    }
    
    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public LocalDateTime getUploadDate() {
        return uploadDate;
    }
    
    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }
    
    public InvestmentAgreement getInvestmentAgreement() {
        return investmentAgreement;
    }
    
    public void setInvestmentAgreement(InvestmentAgreement investmentAgreement) {
        this.investmentAgreement = investmentAgreement;
    }
}
=======
package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "investment_agreement_documents")
public class InvestmentAgreementDocument {
    
    @Id
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;
    
    @Column(name = "investment_agreement_id", nullable = false)
    private String investmentAgreementId;
    
    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType; // "DEMANDE_TIMBREE", "ETUDE_FAISABILITE", etc.
    
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;
    
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "content_type")
    private String contentType;
    
    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_agreement_id", insertable = false, updatable = false)
    private InvestmentAgreement investmentAgreement;
    
    // Manual getter and setter methods
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getInvestmentAgreementId() {
        return investmentAgreementId;
    }
    
    public void setInvestmentAgreementId(String investmentAgreementId) {
        this.investmentAgreementId = investmentAgreementId;
    }
    
    public String getDocumentType() {
        return documentType;
    }
    
    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }
    
    public String getOriginalFilename() {
        return originalFilename;
    }
    
    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public LocalDateTime getUploadDate() {
        return uploadDate;
    }
    
    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }
    
    public InvestmentAgreement getInvestmentAgreement() {
        return investmentAgreement;
    }
    
    public void setInvestmentAgreement(InvestmentAgreement investmentAgreement) {
        this.investmentAgreement = investmentAgreement;
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
