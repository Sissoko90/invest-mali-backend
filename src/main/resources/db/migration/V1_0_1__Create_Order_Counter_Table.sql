-- Migration pour créer la table des compteurs d'order_id
-- Version: V1.0.1
-- Description: Création de la table order_counters pour gérer l'incrémentation des order_id

CREATE TABLE IF NOT EXISTS order_counters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    counter_name VARCHAR(100) NOT NULL UNIQUE,
    current_value BIGINT NOT NULL DEFAULT 0,
    prefix VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insérer le compteur pour Orange Money V2 en commençant à 124 (comme dans votre exemple)
INSERT INTO order_counters (counter_name, current_value, prefix) 
VALUES ('ORANGE_MONEY_V2', 124, 'merchant_order')
ON DUPLICATE KEY UPDATE current_value = current_value;

-- Créer un index sur counter_name pour les performances
CREATE INDEX IF NOT EXISTS idx_order_counters_name ON order_counters(counter_name);
