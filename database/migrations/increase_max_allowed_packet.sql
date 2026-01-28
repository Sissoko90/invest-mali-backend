-- Augmenter la limite max_allowed_packet pour permettre l'upload de gros fichiers
-- Cette configuration permet d'uploader des fichiers jusqu'à 64MB

-- Augmenter max_allowed_packet à 64MB (67108864 bytes)
SET GLOBAL max_allowed_packet = 67108864;

-- Vérifier la nouvelle valeur
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Note: Cette configuration est temporaire et sera perdue au redémarrage de MySQL
-- Pour une configuration permanente, ajouter dans my.cnf ou my.ini :
-- [mysqld]
-- max_allowed_packet = 64M
