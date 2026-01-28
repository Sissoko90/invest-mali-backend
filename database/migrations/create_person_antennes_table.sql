-- Migration pour créer la table person_antennes (antennes multiples par personne)
CREATE TABLE IF NOT EXISTS person_antennes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT NOT NULL,
    antenne VARCHAR(50) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_person_antenne (person_id, antenne)
);

-- Index pour améliorer les performances
CREATE INDEX idx_person_antennes_person_id ON person_antennes(person_id);
CREATE INDEX idx_person_antennes_antenne ON person_antennes(antenne);
CREATE INDEX idx_person_antennes_actif ON person_antennes(actif);
