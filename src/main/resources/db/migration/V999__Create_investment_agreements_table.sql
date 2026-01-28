-- Création de la table investment_agreements pour persister les demandes d'agrément d'investissement
CREATE TABLE investment_agreements (
    id VARCHAR(36) PRIMARY KEY,
    reference_number VARCHAR(255) UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Informations du promoteur
    promoteur_nom VARCHAR(255),
    promoteur_nationalite VARCHAR(100),
    promoteur_adresse TEXT,
    
    -- Identification du projet
    nom_raison_sociale VARCHAR(255),
    activite VARCHAR(255),
    forme_juridique VARCHAR(100),
    localisation VARCHAR(255),
    adresse TEXT,
    
    -- Détails des investissements
    investissement_total DECIMAL(15,2),
    investissement_immobilisations DECIMAL(15,2),
    investissement_fonds_roulement DECIMAL(15,2),
    
    -- Plan de financement
    financement_fonds_propres DECIMAL(15,2),
    financement_credits DECIMAL(15,2),
    financement_autres DECIMAL(15,2),
    
    -- Taux de participation
    participation_taux_nationaux DECIMAL(5,2),
    participation_taux_expatries DECIMAL(5,2),
    
    -- Emplois
    emploi_nationaux INTEGER,
    emploi_expatries INTEGER,
    
    -- Autres caractéristiques
    taux_valeur_ajoutee DECIMAL(5,2),
    capacite_production TEXT,
    
    -- Marchés ciblés
    marche_local DECIMAL(5,2),
    marche_exterieur DECIMAL(5,2),
    
    -- Régime sollicité
    regime_sollicite VARCHAR(50) NOT NULL,
    
    -- Champs administratifs
    observations TEXT,
    date_traitement TIMESTAMP NULL,
    agent_traitant VARCHAR(255),
    
    -- Index pour améliorer les performances
    INDEX idx_user_id (user_id),
    INDEX idx_statut (statut),
    INDEX idx_regime_sollicite (regime_sollicite),
    INDEX idx_reference_number (reference_number),
    INDEX idx_date_creation (date_creation)
);

-- Commentaires sur la table
ALTER TABLE investment_agreements COMMENT = 'Table pour stocker les demandes d\'agrément d\'investissement';
