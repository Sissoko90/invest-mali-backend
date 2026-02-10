-- Création de l'utilisateur admin pour AKERA
-- Mot de passe: Admin@2024 (haché avec BCrypt)

-- Insérer la personne admin
INSERT INTO persons (id, prenom, nom, email, telephone1, date_naissance, lieu_naissance, nationnalite, sexe, situation_matrimoniale, civilite, created_at, updated_at)
VALUES (
    'admin-akera-person-id',
    'Admin',
    'AKERA',
    'admin.akera@apimali.com',
    '76000000',
    '1990-01-01',
    'Bamako',
    'MALIENNE',
    'MASCULIN',
    'CELIBATAIRE',
    'MONSIEUR',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Insérer l'utilisateur admin
-- Mot de passe: Admin@2024
-- Hash BCrypt: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO utilisateurs (id, utilisateur, motdepasse, personne_id, est_actif, created_at, updated_at)
VALUES (
    'admin-akera-user-id',
    'admin.akera',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'admin-akera-person-id',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;
