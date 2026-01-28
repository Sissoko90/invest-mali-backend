package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.InvestmentAgreementDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentAgreementDocumentRepository extends JpaRepository<InvestmentAgreementDocument, String> {
    
    /**
     * Trouver tous les documents d'une demande d'agrément d'investissement
     */
    List<InvestmentAgreementDocument> findByInvestmentAgreementIdOrderByUploadDateDesc(String investmentAgreementId);
    
    /**
     * Trouver les documents d'une demande par type
     */
    List<InvestmentAgreementDocument> findByInvestmentAgreementIdAndDocumentType(String investmentAgreementId, String documentType);
    
    /**
     * Compter le nombre de documents d'une demande
     */
    long countByInvestmentAgreementId(String investmentAgreementId);
}
