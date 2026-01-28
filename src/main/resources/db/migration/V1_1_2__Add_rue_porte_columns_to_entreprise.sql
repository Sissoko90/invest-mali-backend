-- Migration pour ajouter les colonnes rue et porte à la table entreprise
-- Date: 2026-01-15
-- Description: Ajout des champs rue et porte pour permettre une localisation spécifique de l'entreprise
--              différente de celle de la personne

-- Ajouter la colonne rue
ALTER TABLE entreprise 
ADD COLUMN rue VARCHAR(255) NULL COMMENT 'Nom de la rue où est située l\'entreprise';

-- Ajouter la colonne porte  
ALTER TABLE entreprise 
ADD COLUMN porte VARCHAR(50) NULL COMMENT 'Numéro de porte/portail de l\'entreprise';
