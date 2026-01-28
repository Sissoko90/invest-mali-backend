-- Migration script to add 'porte' column to persons table
-- This allows storing door/gate numbers separately from street names (localite)

ALTER TABLE persons ADD COLUMN porte VARCHAR(50);

-- Add comment to document the purpose of the column
COMMENT ON COLUMN persons.porte IS 'Numéro de porte ou portail de la personne';
