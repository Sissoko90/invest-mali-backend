-- Migration pour créer la table person_roles (rôles multiples par personne)
CREATE TABLE IF NOT EXISTS person_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_person_role (person_id, role)
);

-- Index pour améliorer les performances
CREATE INDEX idx_person_roles_person_id ON person_roles(person_id);
CREATE INDEX idx_person_roles_role ON person_roles(role);
CREATE INDEX idx_person_roles_actif ON person_roles(actif);
