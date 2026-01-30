<<<<<<< HEAD
<<<<<<< HEAD
﻿import React, { useState, useEffect, useRef } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { API_CONFIG } from '../config/api.config';

interface Message {
  id: string;
  content: string;
  messageType: 'AGENT' | 'USER';
  createdAt: string;
  senderName: string;
  senderId: string;
  isRead?: boolean;
}

interface Conversation {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  agentId: string;
  agentNom: string;
  userId: string;
  userNom: string;
  subject: string;
  status: string;
  messages: Message[];
  totalMessages: number;
  unreadMessages: number;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrepriseId: string;
  entrepriseNom: string;
  userId: string;
  userNom: string;
  conversationId?: string;
  onMessagesMarkedRead?: () => void; // Callback pour rafraîchir les compteurs
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  entrepriseId,
  entrepriseNom,
  userId,
  userNom,
  conversationId,
  onMessagesMarkedRead
}) => {
  const { agent } = useAgentAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonction pour scroller vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroller automatiquement quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Fonction pour ouvrir une conversation
  const openConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      console.log('🔍 Ouverture de la conversation:', conversationId);
      
      // Essayer de récupérer les messages existants
      try {
        console.log('📥 Récupération des messages existants...');
        const messagesResponse = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          }
        });

        let existingMessages: Message[] = [];
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log('📥 Messages récupérés:', messagesData);
          
          if (messagesData.status === 'SUCCESS' && messagesData.messages) {
            existingMessages = messagesData.messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              messageType: msg.sender_type === 'agent' ? 'AGENT' : 'USER',
              createdAt: msg.created_at,
              senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Agent' : 'Utilisateur'),
              senderId: msg.sender_id,
              isRead: msg.is_read
            }));
            console.log('✅ Messages convertis:', existingMessages.length);
            
            // Marquer les messages comme lus pour l'agent (avec délai pour éviter les race conditions)
            try {
              console.log('🔖 Marquage des messages comme lus pour l\'agent...');
              console.log('🔖 Conversation ID:', conversationId);
              console.log('🔖 Agent ID:', agent?.id);
              console.log('🔖 URL complète:', `${API_CONFIG.BASE_URL}/conversations/${conversationId}/mark-read-agent`);
              
              // Attendre 1 seconde pour éviter les race conditions
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log('🔖 Délai écoulé, marquage en cours...');
              
              const markReadResponse = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/mark-read-agent`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  agent_id: agent?.id
                })
              });
              
              if (markReadResponse.ok) {
                const markReadData = await markReadResponse.json();
                console.log('✅ Messages marqués comme lus:', markReadData.messages_marked_read);
                
                // Rafraîchir les compteurs immédiatement
                if (onMessagesMarkedRead) {
                  onMessagesMarkedRead();
                }
              } else {
                console.warn('⚠️ Erreur lors du marquage comme lu:', markReadResponse.status);
              }
            } catch (markReadError) {
              console.warn('⚠️ Erreur lors du marquage comme lu:', markReadError);
            }
          }
        } else {
          console.log('⚠️ Impossible de récupérer les messages, conversation vide');
        }

        // Créer la conversation avec les messages existants
        const realConversation: Conversation = {
          id: conversationId,
          subject: `Conversation avec ${entrepriseNom}`,
          status: "ACTIVE",
          entrepriseId: entrepriseId,
          entrepriseNom: entrepriseNom,
          agentId: agent?.id?.toString() || "temp",
          agentNom: agent?.firstName + ' ' + agent?.lastName || "Agent",
          userId: userId,
          userNom: userNom,
          messages: existingMessages,
          totalMessages: existingMessages.length,
          unreadMessages: 0
        };
        
        setConversation(realConversation);
        console.log('✅ Conversation configurée avec', existingMessages.length, 'messages existants');
        
      } catch (messageError) {
        console.warn('⚠️ Erreur lors de la récupération des messages, conversation vide:', messageError);
        
        // Fallback : conversation vide
        const emptyConversation: Conversation = {
          id: conversationId,
          subject: `Conversation avec ${entrepriseNom}`,
          status: "ACTIVE",
          entrepriseId: entrepriseId,
          entrepriseNom: entrepriseNom,
          agentId: agent?.id?.toString() || "temp",
          agentNom: agent?.firstName + ' ' + agent?.lastName || "Agent",
          userId: userId,
          userNom: userNom,
          messages: [],
          totalMessages: 0,
          unreadMessages: 0
        };
        
        setConversation(emptyConversation);
        console.log('✅ Conversation vide configurée en fallback');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture de la conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;
    
    setSending(true);
    try {
      console.log('📤 Envoi du message agent:', {
        message: newMessage,
        conversationId: conversation.id,
        agentId: agent?.id
      });
      
      const agentId = agent?.id;
      
      if (!agentId) {
        console.error('❌ Aucun ID agent trouvé dans le contexte d\'authentification');
        alert('Erreur: Vous devez être connecté pour envoyer un message');
        return;
      }
      
      const requestPayload = {
        sender_type: "agent",
        sender_id: agentId.toString(),
        content: newMessage
      };
      
      console.log('📤 Payload envoyé:', requestPayload);
      console.log('📤 URL:', `${API_CONFIG.BASE_URL}/conversations/${conversation.id}/messages`);
      
      // Envoyer le message via l'API
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📤 Réponse HTTP:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📤 Données reçues:', data);
      
      if (data.status === 'SUCCESS' || data.status === 'success') {
        console.log('✅ Message envoyé avec succès');
        
        // Créer le message pour l'affichage local
        const sentMessage: Message = {
          id: data.message?.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: newMessage,
          messageType: 'AGENT',
          createdAt: new Date().toISOString(),
          senderName: agent?.firstName + ' ' + agent?.lastName || 'Agent',
          senderId: agentId?.toString() || '',
          isRead: false
        };
        
        // Ajouter le message à la conversation
        setConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, sentMessage],
          totalMessages: prev.totalMessages + 1
        } : null);
        
        // Vider le champ de saisie
        setNewMessage('');
        
        console.log('✅ Message ajouté à la conversation locale');
      } else {
        console.error('❌ Erreur lors de l\'envoi:', data.message);
        alert(`Erreur lors de l'envoi du message: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      alert(`Erreur lors de l'envoi du message: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSending(false);
    }
  };

  // Fonction pour démarrer une nouvelle conversation
  const startNewConversation = async () => {
    try {
      const agentId = agent?.id;
      
      if (!agentId) {
        console.error('❌ Aucun ID agent trouvé');
        return;
      }

      console.log('🚀 Initiation conversation agent pour entreprise:', entrepriseId, entrepriseNom);
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/agent-initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          user_id: userId,
          entreprise_id: entrepriseId,
          initial_message: `Bonjour, nous avons bien reçu votre demande concernant l'entreprise "${entrepriseNom}". Comment puis-je vous aider ?`
        }),
      });

      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        console.log('✅ Nouvelle conversation créée:', data.conversation_id);
        
        // Ouvrir la conversation créée
        await openConversation(data.conversation_id);
      } else {
        console.error('❌ Erreur lors de la création:', data.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de conversation:', error);
    }
  };

  // Fonctions utilitaires
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Effet pour ouvrir automatiquement une conversation si un ID est fourni
  useEffect(() => {
    if (isOpen && conversationId) {
      openConversation(conversationId);
    }
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Chat - {entrepriseNom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex">
          {/* Zone de chat */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              {conversation ? (
                <div className="space-y-4">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.messageType === 'AGENT' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.messageType === 'AGENT'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Référence pour le scroll automatique */}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  {loading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">Aucune conversation sélectionnée</p>
                      <button
                        onClick={startNewConversation}
                        className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
                      >
                        Démarrer une conversation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zone de saisie */}
            {conversation && (
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : '📤'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
























=======
import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../config/api.config';
import { chatAPI } from '../services/api';
=======
﻿import React, { useState, useEffect, useRef } from 'react';
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { API_CONFIG } from '../config/api.config';

interface Message {
  id: string;
  content: string;
  messageType: 'AGENT' | 'USER';
  createdAt: string;
  senderName: string;
  senderId: string;
  isRead?: boolean;
}

interface Conversation {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  agentId: string;
  agentNom: string;
  userId: string;
  userNom: string;
  subject: string;
  status: string;
  messages: Message[];
  totalMessages: number;
  unreadMessages: number;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrepriseId: string;
  entrepriseNom: string;
  userId: string;
  userNom: string;
  conversationId?: string;
  onMessagesMarkedRead?: () => void; // Callback pour rafraîchir les compteurs
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  entrepriseId,
  entrepriseNom,
  userId,
  userNom,
  conversationId,
  onMessagesMarkedRead
}) => {
  const { agent } = useAgentAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonction pour scroller vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroller automatiquement quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Fonction pour ouvrir une conversation
  const openConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      console.log('🔍 Ouverture de la conversation:', conversationId);
      
      // Essayer de récupérer les messages existants
      try {
        console.log('📥 Récupération des messages existants...');
        const messagesResponse = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          }
        });

        let existingMessages: Message[] = [];
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log('📥 Messages récupérés:', messagesData);
          
          if (messagesData.status === 'SUCCESS' && messagesData.messages) {
            existingMessages = messagesData.messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              messageType: msg.sender_type === 'agent' ? 'AGENT' : 'USER',
              createdAt: msg.created_at,
              senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Agent' : 'Utilisateur'),
              senderId: msg.sender_id,
              isRead: msg.is_read
            }));
            console.log('✅ Messages convertis:', existingMessages.length);
            
            // Marquer les messages comme lus pour l'agent (avec délai pour éviter les race conditions)
            try {
              console.log('🔖 Marquage des messages comme lus pour l\'agent...');
              console.log('🔖 Conversation ID:', conversationId);
              console.log('🔖 Agent ID:', agent?.id);
              console.log('🔖 URL complète:', `${API_CONFIG.BASE_URL}/conversations/${conversationId}/mark-read-agent`);
              
              // Attendre 1 seconde pour éviter les race conditions
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log('🔖 Délai écoulé, marquage en cours...');
              
              const markReadResponse = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/mark-read-agent`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  agent_id: agent?.id
                })
              });
              
              if (markReadResponse.ok) {
                const markReadData = await markReadResponse.json();
                console.log('✅ Messages marqués comme lus:', markReadData.messages_marked_read);
                
                // Rafraîchir les compteurs immédiatement
                if (onMessagesMarkedRead) {
                  onMessagesMarkedRead();
                }
              } else {
                console.warn('⚠️ Erreur lors du marquage comme lu:', markReadResponse.status);
              }
            } catch (markReadError) {
              console.warn('⚠️ Erreur lors du marquage comme lu:', markReadError);
            }
          }
        } else {
          console.log('⚠️ Impossible de récupérer les messages, conversation vide');
        }

        // Créer la conversation avec les messages existants
        const realConversation: Conversation = {
          id: conversationId,
          subject: `Conversation avec ${entrepriseNom}`,
          status: "ACTIVE",
          entrepriseId: entrepriseId,
          entrepriseNom: entrepriseNom,
          agentId: agent?.id?.toString() || "temp",
          agentNom: agent?.firstName + ' ' + agent?.lastName || "Agent",
          userId: userId,
          userNom: userNom,
          messages: existingMessages,
          totalMessages: existingMessages.length,
          unreadMessages: 0
        };
        
        setConversation(realConversation);
        console.log('✅ Conversation configurée avec', existingMessages.length, 'messages existants');
        
      } catch (messageError) {
        console.warn('⚠️ Erreur lors de la récupération des messages, conversation vide:', messageError);
        
        // Fallback : conversation vide
        const emptyConversation: Conversation = {
          id: conversationId,
          subject: `Conversation avec ${entrepriseNom}`,
          status: "ACTIVE",
          entrepriseId: entrepriseId,
          entrepriseNom: entrepriseNom,
          agentId: agent?.id?.toString() || "temp",
          agentNom: agent?.firstName + ' ' + agent?.lastName || "Agent",
          userId: userId,
          userNom: userNom,
          messages: [],
          totalMessages: 0,
          unreadMessages: 0
        };
        
        setConversation(emptyConversation);
        console.log('✅ Conversation vide configurée en fallback');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture de la conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;
    
    setSending(true);
    try {
      console.log('📤 Envoi du message agent:', {
        message: newMessage,
        conversationId: conversation.id,
        agentId: agent?.id
      });
      
      const agentId = agent?.id;
      
      if (!agentId) {
        console.error('❌ Aucun ID agent trouvé dans le contexte d\'authentification');
        alert('Erreur: Vous devez être connecté pour envoyer un message');
        return;
      }
      
      const requestPayload = {
        sender_type: "agent",
        sender_id: agentId.toString(),
        content: newMessage
      };
      
      console.log('📤 Payload envoyé:', requestPayload);
      console.log('📤 URL:', `${API_CONFIG.BASE_URL}/conversations/${conversation.id}/messages`);
      
      // Envoyer le message via l'API
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📤 Réponse HTTP:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📤 Données reçues:', data);
      
      if (data.status === 'SUCCESS' || data.status === 'success') {
        console.log('✅ Message envoyé avec succès');
        
        // Créer le message pour l'affichage local
        const sentMessage: Message = {
          id: data.message?.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: newMessage,
          messageType: 'AGENT',
          createdAt: new Date().toISOString(),
          senderName: agent?.firstName + ' ' + agent?.lastName || 'Agent',
          senderId: agentId?.toString() || '',
          isRead: false
        };
        
        // Ajouter le message à la conversation
        setConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, sentMessage],
          totalMessages: prev.totalMessages + 1
        } : null);
        
        // Vider le champ de saisie
        setNewMessage('');
        
        console.log('✅ Message ajouté à la conversation locale');
      } else {
        console.error('❌ Erreur lors de l\'envoi:', data.message);
        alert(`Erreur lors de l'envoi du message: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      alert(`Erreur lors de l'envoi du message: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSending(false);
    }
  };

  // Fonction pour démarrer une nouvelle conversation
  const startNewConversation = async () => {
    try {
      const agentId = agent?.id;
      
      if (!agentId) {
        console.error('❌ Aucun ID agent trouvé');
        return;
      }

      console.log('🚀 Initiation conversation agent pour entreprise:', entrepriseId, entrepriseNom);
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/agent-initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          user_id: userId,
          entreprise_id: entrepriseId,
          initial_message: `Bonjour, nous avons bien reçu votre demande concernant l'entreprise "${entrepriseNom}". Comment puis-je vous aider ?`
        }),
      });

      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        console.log('✅ Nouvelle conversation créée:', data.conversation_id);
        
        // Ouvrir la conversation créée
        await openConversation(data.conversation_id);
      } else {
        console.error('❌ Erreur lors de la création:', data.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de conversation:', error);
    }
  };

  // Fonctions utilitaires
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Effet pour ouvrir automatiquement une conversation si un ID est fourni
  useEffect(() => {
    if (isOpen && conversationId) {
      openConversation(conversationId);
    }
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Chat - {entrepriseNom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex">
          {/* Zone de chat */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              {conversation ? (
                <div className="space-y-4">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.messageType === 'AGENT' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.messageType === 'AGENT'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Référence pour le scroll automatique */}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  {loading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">Aucune conversation sélectionnée</p>
                      <button
                        onClick={startNewConversation}
                        className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
                      >
                        Démarrer une conversation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zone de saisie */}
            {conversation && (
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : '📤'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
<<<<<<< HEAD
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
=======
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
