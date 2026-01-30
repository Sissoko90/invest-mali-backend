-- Migration pour ajouter le champ division_code à la table entreprise
-- Ceci permet de stocker les codes de division INSTAT au lieu des IDs

-- Ajouter la colonne division_code
ALTER TABLE entreprise ADD COLUMN division_code VARCHAR(20);

-- Commentaire pour la colonne
COMMENT ON COLUMN entreprise.division_code IS 'Code de division INSTAT (remplace progressivement division_id)';

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_entreprise_division_code ON entreprise(division_code);

-- Optionnel : Migrer les données existantes si nécessaire
-- UPDATE entreprise SET division_code = 'DEFAULT_CODE' WHERE division_code IS NULL;
