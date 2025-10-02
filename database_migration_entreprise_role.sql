-- Migration script to fix entreprise_role column length issue
-- This script should be run on your database to fix the "Data truncated for column 'entreprise_role'" error

-- For MySQL/MariaDB:
ALTER TABLE persons MODIFY COLUMN entreprise_role VARCHAR(20);

-- For PostgreSQL:
-- ALTER TABLE persons ALTER COLUMN entreprise_role TYPE VARCHAR(20);

-- For SQL Server:
-- ALTER TABLE persons ALTER COLUMN entreprise_role VARCHAR(20);

-- Verify the change:
-- DESCRIBE persons; (MySQL)
-- \d persons (PostgreSQL)
