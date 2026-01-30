-- Création de la table investment_agreement_documents pour stocker les documents liés aux demandes d'agrément d'investissement
CREATE TABLE investment_agreement_documents (
    id VARCHAR(36) PRIMARY KEY,
    investment_agreement_id VARCHAR(36) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clé étrangère vers investment_agreements
    FOREIGN KEY (investment_agreement_id) REFERENCES investment_agreements(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    INDEX idx_investment_agreement_id (investment_agreement_id),
    INDEX idx_document_type (document_type),
    INDEX idx_upload_date (upload_date)
);

-- Commentaires sur la table
ALTER TABLE investment_agreement_documents COMMENT = 'Table pour stocker les documents uploadés avec les demandes d\'agrément d\'investissement';
