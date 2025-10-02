-- Migration pour le système de chat agent-utilisateur
-- Permet aux agents d'accueil de communiquer avec les utilisateurs
-- concernant les documents manquants ou non conformes

-- Table des conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    
    -- Métadonnées de la conversation
    subject VARCHAR(255) NOT NULL, -- Ex: "Documents manquants - Entreprise XYZ"
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, CLOSED
    priority VARCHAR(50) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    
    -- Index pour les requêtes fréquentes
    CONSTRAINT conversations_status_check CHECK (status IN ('ACTIVE', 'RESOLVED', 'CLOSED')),
    CONSTRAINT conversations_priority_check CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);

-- Table des messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence à la conversation
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Expéditeur du message
    sender_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT messages_type_check CHECK (message_type IN ('TEXT', 'DOCUMENT_REQUEST', 'DOCUMENT_UPLOAD', 'SYSTEM'))
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
CREATE INDEX idx_messages_unread ON messages(is_read, conversation_id) WHERE is_read = FALSE;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vue pour faciliter les requêtes de conversations avec compteurs
CREATE VIEW conversations_with_stats AS
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

-- Commentaires pour la documentation
COMMENT ON TABLE conversations IS 'Conversations entre agents et utilisateurs concernant les demandes d''entreprises';
COMMENT ON TABLE messages IS 'Messages échangés dans les conversations';
COMMENT ON COLUMN conversations.subject IS 'Sujet de la conversation, généralement lié à un problème de document';
COMMENT ON COLUMN conversations.status IS 'Statut de la conversation: ACTIVE (en cours), RESOLVED (résolue), CLOSED (fermée)';
COMMENT ON COLUMN messages.message_type IS 'Type de message: TEXT (texte simple), DOCUMENT_REQUEST (demande de document), DOCUMENT_UPLOAD (upload de document), SYSTEM (message système)';
