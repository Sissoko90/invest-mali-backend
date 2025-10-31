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
import { useAgentAuth } from '../contexts/AgentAuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  documentName?: string;
  documentUrl?: string;
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
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  entrepriseId,
  entrepriseNom,
  userId,
  userNom
}) => {
  const { agent } = useAgentAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeConversations, setActiveConversations] = useState<any[]>([]);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Polling pour actualiser la conversation active
  useEffect(() => {
    if (conversation && !showConversationList) {
      const interval = setInterval(() => {
        openConversation(conversation.id, true); // silent = true pour le polling
      }, 3000); // Actualiser toutes les 3 secondes

      return () => clearInterval(interval);
    }
  }, [conversation, showConversationList]);

  // Charger les conversations actives quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser les états à l'ouverture
      setShowConversationList(true);
      setConversation(null);
      loadActiveConversations();
    }
  }, [isOpen, entrepriseId]);

  const loadActiveConversations = async () => {
    setIsRefreshing(true);
    try {
      // Ajouter le paramètre entrepriseId pour filtrer les conversations
      const url = `${API_CONFIG.BASE_URL}/chat/conversations/active?entrepriseId=${entrepriseId}`;
      console.log('🔍 Chargement conversations pour entreprise:', entrepriseId);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        console.log('✅ Conversations actives chargées:', data.conversations);
        setActiveConversations(data.conversations || []);
      } else {
        console.warn('⚠️ Erreur lors du chargement des conversations:', data.message);
        setActiveConversations([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations actives:', error);
      setActiveConversations([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openConversation = async (conversationId: string, silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      if (!silent) {
        console.log('🔍 Ouverture de la conversation:', conversationId);
        console.log('🔄 État actuel - showConversationList:', showConversationList);
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/conversations/${conversationId}`);
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        // Adapter les messages au format du composant
        const adaptedMessages = (data.messages || []).map((msg: any) => {
          console.log('🔍 Message reçu côté agent:', msg); // Debug pour voir la structure
          console.log('🔍 senderType:', msg.senderType, 'messageType sera:', msg.senderType === 'AGENT' ? 'AGENT' : 'USER');
          return {
            id: msg.id,
            content: msg.content,
            messageType: msg.senderType === 'AGENT' ? 'AGENT' : 'USER', // Utiliser senderType au lieu de senderRole
            createdAt: msg.creation || msg.timestamp,
            senderName: msg.senderName || (msg.senderType === 'AGENT' ? 'Agent' : 'Utilisateur')
          };
        });

        // Adapter les données pour correspondre à l'interface
        const adaptedConversation: Conversation = {
          id: data.id,
          entrepriseId: entrepriseId || '',
          entrepriseNom: entrepriseNom || '',
          agentId: data.agentId || '',
          agentNom: data.agentNom || 'Agent',
          userId: data.userId || '',
          userNom: data.userNom || 'Utilisateur',
          subject: data.subject || 'Conversation',
          status: data.status || 'ACTIVE',
          messages: adaptedMessages,
          totalMessages: adaptedMessages.length,
          unreadMessages: 0
        };
        
        setConversation(adaptedConversation);
        setShowConversationList(false);
        console.log('✅ Conversation chargée, basculement vers vue détaillée');
        
        // TODO: Réactiver le marquage lecture quand le backend sera stable
        // fetch(`${API_CONFIG.BASE_URL}/chat/conversations/${conversationId}/read`, {
        //   method: 'PATCH'
        // }).then(() => {
        //   console.log('✅ Conversation marquée comme lue');
        // }).catch((error) => {
        //   console.warn('⚠️ Erreur marquage lecture (ignorée):', error);
        // });
        console.log('📖 Marquage lecture désactivé temporairement');
      } else {
        console.error('❌ Erreur lors du chargement de la conversation:', data.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture de la conversation:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      console.log('📤 Envoi du message agent:', newMessage);
      
      // Récupérer l'ID de l'agent depuis le contexte d'authentification
      const agentId = agent?.id;
      
      if (!agentId) {
        console.error('❌ Aucun ID agent trouvé dans le contexte d\'authentification');
        return;
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          senderId: agentId
        }),
      });

      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        console.log('✅ Message envoyé avec succès');
        
        // Recharger la conversation pour voir le nouveau message
        await openConversation(conversation.id);
        setNewMessage('');
      } else {
        console.error('❌ Erreur lors de l\'envoi:', data.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
    } finally {
      setSending(false);
    }
  };

  const requestDocument = async (documentName: string) => {
    if (!conversation || sending) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage(conversation.id, {
        content: `Pourriez-vous fournir le document suivant : ${documentName}`,
        messageType: 'DOCUMENT_REQUEST',
        documentName
      });

      if (response.data) {
        setConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, response.data]
        } : null);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la demande de document:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startNewConversation = async () => {
    try {
      // Récupérer l'ID de l'agent depuis le contexte d'authentification
      const agentId = agent?.id;
      
      if (!agentId) {
        console.error('❌ Aucun ID agent trouvé dans le contexte d\'authentification');
        return;
      }

      // Démarrer directement une conversation avec l'utilisateur de l'entreprise
      console.log('🚀 Création conversation pour entreprise:', entrepriseId, entrepriseNom);
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/conversations/start-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          userId: userId, // Utiliser l'utilisateur de l'entreprise courante
          message: `Bonjour ! Je vous contacte concernant votre entreprise ${entrepriseNom}.`,
          subject: `Assistance pour ${entrepriseNom}`,
          entrepriseId: entrepriseId, // Passer l'ID réel de l'entreprise
          entrepriseNom: entrepriseNom // Passer le nom réel de l'entreprise
        }),
      });

      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        console.log('✅ Nouvelle conversation créée:', data.conversationId);
        
        // Actualiser la liste des conversations
        await loadActiveConversations();
        
        // Ouvrir la nouvelle conversation
        await openConversation(data.conversationId);
      } else {
        console.error('❌ Erreur lors de la création:', data.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de conversation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {conversation && (
                  <button
                    onClick={() => {
                      setShowConversationList(true);
                      setConversation(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                    title="Retour aux conversations"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {showConversationList ? 'Conversations Actives' : conversation ? `💬 ${conversation.subject}` : 'Chat Agent'}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {showConversationList ? `${activeConversations.length} conversation(s)` : 
                 conversation ? `Client: ${conversation.userNom}` : `Agent: ${userNom}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Réinitialiser les états à la fermeture
              setShowConversationList(true);
              setConversation(null);
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          ) : showConversationList ? (
            /* Liste des conversations actives */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Conversations actives</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={startNewConversation}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    + Nouvelle
                  </button>
                  <button
                    onClick={loadActiveConversations}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    🔄 Actualiser
                  </button>
                </div>
              </div>
              
              {activeConversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Aucune conversation active pour le moment</p>
                  <button
                    onClick={startNewConversation}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Démarrer une conversation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-medium text-gray-900 truncate">{conv.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            👤 {conv.userName}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-500 mt-2 break-words">
                              <span className="font-medium">
                                {conv.lastMessageSender === 'USER' ? '👤 Client: ' : '🤖 Agent: '}
                              </span>
                              {conv.lastMessage.length > 60 ? conv.lastMessage.substring(0, 60) + '...' : conv.lastMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {conv.createdAt && new Date(conv.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Conversation ouverte */
            <>
              <div className="space-y-4 mb-4">
                {conversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.messageType === 'AGENT' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.messageType === 'AGENT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.messageType === 'USER' && (
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          {message.senderName || 'Utilisateur'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.messageType === 'AGENT' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de saisie */}
              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : '📤'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
