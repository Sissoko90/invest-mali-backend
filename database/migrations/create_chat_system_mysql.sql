-- Migration pour le système de chat agent-utilisateur (MySQL)
-- Permet aux agents d'accueil de communiquer avec les utilisateurs
-- concernant les documents manquants ou non conformes

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Références
    entreprise_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Métadonnées de la conversation
    subject VARCHAR(255) NOT NULL, -- Ex: "Documents manquants - Entreprise XYZ"
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, CLOSED
    priority VARCHAR(50) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    
    -- Contraintes
    CONSTRAINT conversations_status_check CHECK (status IN ('ACTIVE', 'RESOLVED', 'CLOSED')),
    CONSTRAINT conversations_priority_check CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    
    -- Clés étrangères
    FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES persons(id) ON DELETE CASCADE
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Référence à la conversation
    conversation_id VARCHAR(36) NOT NULL,
    
    -- Expéditeur du message
    sender_id VARCHAR(36) NOT NULL,
    
    -- Contenu du message
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'TEXT', -- TEXT, DOCUMENT_REQUEST, DOCUMENT_UPLOAD, SYSTEM
    
    -- Métadonnées du message
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    -- Données spécifiques selon le type de message
    document_name VARCHAR(255) NULL, -- Pour DOCUMENT_REQUEST et DOCUMENT_UPLOAD
    document_url VARCHAR(500) NULL,  -- Pour DOCUMENT_UPLOAD
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT messages_type_check CHECK (message_type IN ('TEXT', 'DOCUMENT_REQUEST', 'DOCUMENT_UPLOAD', 'SYSTEM')),
    
    -- Clés étrangères
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES persons(id) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX idx_conversations_entreprise ON conversations(entreprise_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(is_read, conversation_id);

-- Vue pour faciliter les requêtes de conversations avec compteurs
CREATE OR REPLACE VIEW conversations_with_stats AS
SELECT 
    c.*,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.is_read = FALSE AND m.sender_id != c.agent_id THEN 1 END) as unread_messages_for_agent,
    COUNT(CASE WHEN m.is_read = FALSE AND m.sender_id != c.user_id THEN 1 END) as unread_messages_for_user,
    MAX(m.created_at) as last_message_at,
    u_agent.utilisateur as agent_username,
    u_user.utilisateur as user_username,
    e.nom as entreprise_nom
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN utilisateurs u_agent ON c.agent_id = u_agent.id
LEFT JOIN utilisateurs u_user ON c.user_id = u_user.id
LEFT JOIN entreprises e ON c.entreprise_id = e.id
GROUP BY c.id, u_agent.utilisateur, u_user.utilisateur, e.nom;
