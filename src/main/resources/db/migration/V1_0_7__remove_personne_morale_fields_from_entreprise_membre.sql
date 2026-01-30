-- Migration pour supprimer les champs spécifiques aux personnes morales de la table entreprise_membre
-- Date: 2025-11-01
-- Description: Suppression des colonnes pays_emission_rccm et denomination_entreprise car migrées vers persons

-- Supprimer l'index sur denomination_entreprise s'il existe
DROP INDEX IF EXISTS idx_entreprise_membre_denomination_entreprise;

-- Supprimer la colonne pays_emission_rccm
ALTER TABLE entreprise_membre 
DROP COLUMN IF EXISTS pays_emission_rccm;

-- Supprimer la colonne denomination_entreprise
ALTER TABLE entreprise_membre 
DROP COLUMN IF EXISTS denomination_entreprise;
