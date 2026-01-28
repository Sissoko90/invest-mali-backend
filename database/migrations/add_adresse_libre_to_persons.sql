-- Migration: Add adresse_libre field to persons table
-- Date: 2026-01-22
-- Description: Add a free-form address field to the persons table for flexible address input

ALTER TABLE persons 
ADD COLUMN adresse_libre VARCHAR(500) NULL 
COMMENT 'Adresse libre saisie par l\'utilisateur (champ texte libre)';

-- Update existing records to have NULL for the new field (already NULL by default)
-- No data migration needed as this is a new optional field
