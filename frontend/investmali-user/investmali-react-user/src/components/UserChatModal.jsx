import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserChatModal = ({ isOpen, onClose, user, entrepriseId = "" }) => {
  const { user: authUser } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [userConversations, setUserConversations] = useState([]);
  const [showConversationList, setShowConversationList] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      if (userConversations.length === 0) {
        loadUserConversations();
      } else if (!conversation) {
        initializeChat();
      }
    }
  }, [isOpen]);

  const loadUserConversations = async () => {
    try {
      // Récupérer l'ID utilisateur depuis le contexte d'authentification
      const userId = authUser?.id || authUser?.personne_id || user?.id;
      
      if (!userId) {
        console.error('❌ Aucun ID utilisateur trouvé dans le contexte d\'authentification');
        return;
      }

      console.log('🔍 Chargement des conversations pour:', userId, 'entrepriseId:', entrepriseId);
      
      let url = `http://localhost:8080/api/v1/chat/conversations/user/${userId}`;
      if (entrepriseId) {
        url += `?entrepriseId=${entrepriseId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        console.log('✅ Conversations utilisateur chargées:', data.conversations);
        setUserConversations(data.conversations || []);
        
        if (data.conversations && data.conversations.length > 0) {
          setShowConversationList(true);
        } else {
          // Aucune conversation, démarrer directement le chat
          initializeChat();
        }
      } else {
        console.warn('⚠️ Erreur lors du chargement des conversations:', data.message);
        initializeChat();
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations:', error);
      initializeChat();
    }
  };

  // Polling pour récupérer les nouveaux messages toutes les 3 secondes
  useEffect(() => {
    if (conversation && conversation.conversationId) {
      const interval = setInterval(() => {
        loadConversationMessages(conversation.conversationId, true); // silent = true pour le polling
      }, 3000); // Actualiser toutes les 3 secondes

      return () => clearInterval(interval);
    }
  }, [conversation]);

  const initializeChat = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      console.log('🚀 Initialisation du chat utilisateur...');
      console.log('👤 Utilisateur authentifié:', authUser);
      
      // Récupérer l'ID utilisateur depuis le contexte d'authentification
      const userId = authUser?.id || authUser?.personne_id || user?.id;
      
      if (!userId) {
        throw new Error('Aucun ID utilisateur trouvé. Veuillez vous reconnecter.');
      }
      
      console.log('✅ UserId récupéré depuis le contexte:', userId);
      
      // D'abord, essayer de récupérer les conversations existantes de l'utilisateur
      console.log('🔍 Recherche des conversations existantes pour:', userId);
      try {
        const userConversationsResponse = await fetch(`http://localhost:8080/api/v1/chat/conversations/user/${userId}`);
        const userConversationsData = await userConversationsResponse.json();
        
        if (userConversationsData.status === 'SUCCESS' && userConversationsData.conversations.length > 0) {
          // Utiliser la conversation la plus récente
          const latestConversation = userConversationsData.conversations[0];
          console.log('✅ Conversation existante trouvée:', latestConversation);
          
          setConversation({
            conversationId: latestConversation.id,
            agentId: latestConversation.agentId,
            agentName: latestConversation.agentName,
            subject: latestConversation.subject,
            userId: userId
          });
          
          // Charger les messages de cette conversation
          await loadConversationMessages(latestConversation.id);
          return; // Sortir de la fonction
        }
      } catch (fetchError) {
        console.warn('⚠️ Erreur lors de la récupération des conversations existantes:', fetchError);
      }
      
      // Aucune conversation existante ou erreur, créer une nouvelle
      console.log('📝 Création d\'une nouvelle conversation...');
      const response = await chatAPI.startConversation(
        "Bonjour, j'aimerais obtenir de l'aide concernant ma demande d'entreprise.",
        "Assistance demande d'entreprise",
        userId // Passer l'userId récupéré depuis le contexte
      );
      
      console.log('✅ Nouvelle conversation créée:', response);
      
      if (response.status === 'SUCCESS') {
        setConversation(response);
        
        // Charger les messages de la conversation
        await loadConversationMessages(response.conversationId);
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la conversation');
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'initialisation du chat:', err);
      setError('Impossible de démarrer la conversation. Veuillez réessayer.');
    } finally {
      setIsInitializing(false);
    }
  };

  const openConversation = async (conversationData) => {
    try {
      console.log('🔄 Ouverture de la conversation:', conversationData.id);
      
      setConversation({
        conversationId: conversationData.id,
        agentId: conversationData.agentId,
        agentName: conversationData.agentName,
        subject: conversationData.subject,
        userId: conversationData.userId
      });
      
      await loadConversationMessages(conversationData.id);
      setShowConversationList(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture de la conversation:', error);
      setError('Impossible d\'ouvrir la conversation');
    }
  };

  const startNewConversation = async () => {
    try {
      // D'abord vérifier s'il y a des conversations existantes
      await loadUserConversations();
      
      // Si il y a des conversations, montrer la liste
      if (userConversations.length > 0) {
        setShowConversationList(true);
        return;
      }
      
      // Sinon, créer une nouvelle conversation
      setConversation(null);
      setMessages([]);
      setShowConversationList(false);
      initializeChat();
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des conversations:', error);
      // En cas d'erreur, créer une nouvelle conversation
      setConversation(null);
      setMessages([]);
      setShowConversationList(false);
      initializeChat();
    }
  };

  const backToConversationList = () => {
    setShowConversationList(true);
    setConversation(null);
    setMessages([]);
  };

  const loadConversationMessages = async (conversationId, silent = false) => {
    try {
      if (!silent) {
        console.log('🔄 Chargement des messages de la conversation:', conversationId);
      }
      const response = await chatAPI.getConversation(conversationId);
      
      if (response.status === 'SUCCESS') {
        if (!silent) {
          console.log('✅ Messages chargés:', response.messages);
        }
        
        // Adapter les messages au format du composant
        const adaptedMessages = (response.messages || []).map(msg => {
          console.log('🔍 Message reçu:', msg); // Debug pour voir la structure
          return {
            id: msg.id,
            content: msg.content,
            sender: msg.senderType === 'AGENT' ? 'agent' : 'user', // Utiliser senderType au lieu de senderRole
            timestamp: new Date(msg.creation || msg.timestamp).toISOString(), // Utiliser creation si disponible
            senderName: msg.senderName || (msg.senderType === 'AGENT' ? 'Agent' : 'Vous')
          };
        });
        
        // Vérifier s'il y a de nouveaux messages
        const currentMessageCount = messages.length;
        const newMessageCount = adaptedMessages.length;
        
        if (newMessageCount > currentMessageCount && !silent) {
          console.log('🔔 Nouveaux messages détectés !');
        }
        
        setMessages(adaptedMessages);
      } else {
        console.error('❌ Erreur lors du chargement des messages:', response.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);
    
    // Ajouter le message de l'utilisateur immédiatement
    const userMessage = {
      id: `user-${Date.now()}`,
      content: messageContent,
      sender: 'user',
      timestamp: new Date().toISOString(),
      senderName: user?.firstName || 'Vous'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Récupérer l'ID utilisateur depuis le contexte d'authentification
      const userId = authUser?.id || authUser?.personne_id || user?.id;
      
      if (!userId) {
        console.error('❌ Aucun ID utilisateur trouvé pour l\'envoi du message');
        setError('Erreur : Impossible d\'identifier l\'utilisateur');
        return;
      }
      
      // Envoyer le message via l'API
      const response = await chatAPI.sendMessage(conversation.conversationId, messageContent, userId);
      
      console.log('📤 Message envoyé:', response);
      
      if (response.status === 'SUCCESS') {
        // Recharger tous les messages de la conversation
        await loadConversationMessages(conversation.conversationId);
      } else {
        console.error('❌ Erreur lors de l\'envoi:', response.message);
        setError('Erreur lors de l\'envoi du message');
      }
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi du message:', err);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message, maxLength = 60) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    
    // Essayer de couper à un espace pour éviter de couper un mot
    const truncated = message.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-mali-emerald to-mali-gold text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {conversation && userConversations.length > 0 && (
                  <button
                    onClick={backToConversationList}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                    title="Retour aux conversations"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h3 className="font-semibold">
                  {showConversationList ? 'Mes Conversations' : 'Assistance InvestMali'}
                </h3>
              </div>
              <p className="text-sm opacity-90">
                {showConversationList ? `${userConversations.length} conversation(s)` : 
                 conversation ? 'En ligne' : 'Connexion...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          {isInitializing ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald mx-auto mb-2"></div>
                <p className="text-gray-600">Connexion à l'assistance...</p>
              </div>
            </div>
          ) : showConversationList ? (
            /* Liste des conversations */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Mes conversations</h3>
                <button
                  onClick={startNewConversation}
                  className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                >
                  + Nouvelle conversation
                </button>
              </div>
              
              {userConversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Aucune conversation pour le moment</p>
                  <button
                    onClick={startNewConversation}
                    className="mt-4 bg-mali-emerald text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Démarrer une conversation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-medium text-gray-800 truncate">{conv.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Agent: {conv.agentName}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-500 mt-2 break-words">
                              <span className="font-medium">
                                {conv.lastMessageSender === 'USER' ? 'Vous: ' : 'Agent: '}
                              </span>
                              {truncateMessage(conv.lastMessage, 70)}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(conv.lastMessageTime || conv.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={initializeChat}
                  className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-mali-emerald text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.sender === 'agent' && (
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {message.senderName || 'Agent'}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {conversation && !error && (
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-mali-emerald text-white p-2 rounded-full hover:bg-mali-emerald/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserChatModal;
