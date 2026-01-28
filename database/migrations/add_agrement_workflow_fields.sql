-- Migration pour ajouter les champs du workflow d'agrément
-- Date: 2024-12-24
-- Description: Ajout des colonnes nécessaires pour le workflow d'autorisation d'exercice

-- Ajouter les nouvelles colonnes pour l'agrément
ALTER TABLE entreprise 
ADD COLUMN numero_autorisation VARCHAR(50) NULL COMMENT 'Numéro d''autorisation d''exercice (BTP-YYYY-XXXX, EC-YYYY-XXXX, CI-YYYY-XXXX)',
ADD COLUMN date_autorisation DATETIME NULL COMMENT 'Date de délivrance de l''autorisation',
ADD COLUMN type_agrement VARCHAR(50) NULL COMMENT 'Type d''agrément: BTP_TOURISME, ETABLISSEMENT_CLASSE, CODE_INVESTISSEMENT',
ADD COLUMN delai_traitement INT NULL COMMENT 'Délai de traitement en jours',
ADD COLUMN avantages_fiscaux BOOLEAN NULL DEFAULT FALSE COMMENT 'Indique si l''agrément donne des avantages fiscaux',
ADD COLUMN observations VARCHAR(1000) NULL COMMENT 'Observations sur le traitement de l''agrément',
ADD COLUMN date_retrait_agrement DATETIME NULL COMMENT 'Date de retrait de l''agrément par l''entreprise';

-- Créer un index sur le numéro d'autorisation pour les recherches rapides
CREATE INDEX idx_numero_autorisation ON entreprise(numero_autorisation);

-- Créer un index sur le type d'agrément
CREATE INDEX idx_type_agrement ON entreprise(type_agrement);

-- Vérifier que les nouvelles colonnes ont été ajoutées
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'entreprise' 
AND COLUMN_NAME IN (
    'numero_autorisation', 
    'date_autorisation', 
    'type_agrement', 
    'delai_traitement', 
    'avantages_fiscaux', 
    'observations', 
    'date_retrait_agrement'
);

-- Note: Les nouvelles valeurs de l'énumération EtapeValidation seront gérées automatiquement par JPA
-- Les valeurs ajoutées sont:
-- - ACCUEIL_AGREMENT
-- - REVISION_AGREMENT
-- - REGISSEUR_AGREMENT
-- - MINISTERE_AGREMENT
-- - RETRAIT_AGREMENT
-- - AGREMENT_COMPLETE
