-- Migration pour ajouter le champ division_code à la table persons
-- Ceci permet de stocker les codes de division INSTAT au lieu des IDs

-- Ajouter la colonne division_code
ALTER TABLE persons ADD COLUMN division_code VARCHAR(20);

-- Commentaire pour la colonne
COMMENT ON COLUMN persons.division_code IS 'Code de division INSTAT (remplace progressivement division_id)';

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_persons_division_code ON persons(division_code);

-- Optionnel : Migrer les données existantes si nécessaire
-- UPDATE persons SET division_code = 'DEFAULT_CODE' WHERE division_code IS NULL;
