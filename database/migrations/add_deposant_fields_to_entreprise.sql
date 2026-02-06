-- Migration: Ajouter les champs du déposant à la table entreprise
-- Date: 2026-02-05
-- Description: Ajoute les colonnes pour stocker les informations du déposant (nom, prénom, téléphone, email, cabinet)
--              Ces informations sont spécifiques aux sociétés et permettent d'identifier la personne qui dépose le dossier

ALTER TABLE entreprise 
ADD COLUMN nom_deposant VARCHAR(100) NULL COMMENT 'Nom du déposant (pour les sociétés)',
ADD COLUMN prenom_deposant VARCHAR(100) NULL COMMENT 'Prénom du déposant (pour les sociétés)',
ADD COLUMN telephone_deposant VARCHAR(20) NULL COMMENT 'Téléphone du déposant (pour les sociétés)',
ADD COLUMN email_deposant VARCHAR(150) NULL COMMENT 'Email du déposant (pour les sociétés)',
ADD COLUMN nom_cabinet VARCHAR(200) NULL COMMENT 'Nom du cabinet du déposant (optionnel)';

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_entreprise_deposant ON entreprise(nom_deposant, prenom_deposant);
