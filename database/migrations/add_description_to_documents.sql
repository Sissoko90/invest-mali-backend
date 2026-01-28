-- Migration pour ajouter le champ description à la table documents
-- Utilisé pour les documents de type AUTRES (documents supplémentaires)

ALTER TABLE documents 
ADD COLUMN description VARCHAR(500) NULL 
COMMENT 'Description pour les documents de type AUTRES (documents supplémentaires)';
