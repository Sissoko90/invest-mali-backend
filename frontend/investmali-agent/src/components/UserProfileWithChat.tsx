import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../utils/apiUrl';

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
  subject: string;
  status: string;
  agent_name: string;
  entreprise_name: string;
  unread_count: number;
  total_messages: number;
  last_message_content?: string;
  last_message_time?: string;
  last_message_sender?: string;
}

interface UserProfileWithChatProps {
  userId: string;
  userName: string;
  userEmail: string;
}

const UserProfileWithChat: React.FC<UserProfileWithChatProps> = ({
  userId,
  userName,
  userEmail
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'demandes' | 'messages' | 'settings'>('profile');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonction pour scroller vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroller automatiquement quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger les conversations de l'utilisateur
  const loadConversations = async () => {
    if (activeTab !== 'messages') return;
    
    setLoading(true);
    try {
      console.log('📥 Chargement des conversations pour utilisateur:', userId);
      
      const response = await fetch(`${getApiBaseUrl()}/conversations/user-native/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversations récupérées:', data);
        
        if (data.status === 'SUCCESS' && data.conversations) {
          setConversations(data.conversations);
          // Auto-sélectionner la première conversation s'il y en a
          if (data.conversations.length > 0 && !selectedConversation) {
            selectConversation(data.conversations[0]);
          }
        }
      } else {
        console.error('❌ Erreur lors du chargement des conversations:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les messages d'une conversation
  const loadMessages = async (conversationId: string) => {
    try {
      console.log('📥 Chargement des messages pour conversation:', conversationId);
      
      const response = await fetch(`${getApiBaseUrl()}/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Messages récupérés:', data);
        
        if (data.status === 'SUCCESS' && data.messages) {
          const formattedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            messageType: msg.sender_type === 'agent' ? 'AGENT' : 'USER',
            createdAt: msg.created_at,
            senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Agent' : 'Utilisateur'),
            senderId: msg.sender_id,
            isRead: msg.is_read
          }));
          setMessages(formattedMessages);
        }
      } else {
        console.error('❌ Erreur lors du chargement des messages:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des messages:', error);
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    setSending(true);
    try {
      console.log('📤 Envoi du message utilisateur:', newMessage);
      
      const requestPayload = {
        sender_type: "user",
        sender_id: userId,
        content: newMessage
      };
      
      const response = await fetch(`${getApiBaseUrl()}/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message envoyé avec succès:', data);
        
        // Ajouter le message à la liste locale
        const sentMessage: Message = {
          id: data.message?.id || `msg-${Date.now()}`,
          content: newMessage,
          messageType: 'USER',
          createdAt: new Date().toISOString(),
          senderName: userName,
          senderId: userId,
          isRead: false
        };
        
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // Recharger les conversations pour mettre à jour les compteurs
        loadConversations();
      } else {
        console.error('❌ Erreur lors de l\'envoi du message:', response.status);
        alert('Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  // Sélectionner une conversation
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Calculer le nombre total de messages non lus
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  // Charger les conversations quand l'onglet Messages est sélectionné
  useEffect(() => {
    if (activeTab === 'messages') {
      loadConversations();
    }
  }, [activeTab, userId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl shadow-lg mb-6">
        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'profile' 
                ? 'text-mali-emerald border-b-2 border-mali-emerald' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>Profil</span>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('demandes')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'demandes' 
                ? 'text-mali-emerald border-b-2 border-mali-emerald' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <span>Mes Demandes (1)</span>
            </div>
          </button>

          {/* NOUVEAU : Onglet Messages */}
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${
              activeTab === 'messages' 
                ? 'text-mali-emerald border-b-2 border-mali-emerald' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <span>Messages</span>
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'text-mali-emerald border-b-2 border-mali-emerald' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>Paramètres</span>
            </div>
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {/* Onglet Profil */}
          {activeTab === 'profile' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-mali-dark">Informations Personnelles</h2>
                <button className="bg-mali-emerald text-white px-4 py-2 rounded-xl hover:bg-mali-emerald/90 transition-colors">
                  Modifier
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                    <p className="text-lg font-medium text-mali-dark">Abdoul</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                    <p className="text-lg font-medium text-mali-dark">Doukhanse</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-lg font-medium text-mali-dark">{userEmail}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
                  <p className="text-lg font-medium text-mali-dark">Non renseigné</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Membre depuis</label>
                  <p className="text-lg font-medium text-mali-dark">—</p>
                </div>
              </div>
            </>
          )}

          {/* Onglet Messages */}
          {activeTab === 'messages' && (
            <div className="h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-mali-dark">Mes Conversations</h2>
                {loading && <p className="text-sm text-gray-500">Chargement...</p>}
              </div>

              <div className="flex-1 flex border border-gray-200 rounded-xl overflow-hidden">
                {/* Liste des conversations */}
                <div className="w-1/3 border-r border-gray-200 bg-gray-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-mali-dark">Conversations</h3>
                    {conversations.length > 0 && (
                      <p className="text-sm text-gray-600">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-white border-l-4 border-l-mali-emerald' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-mali-dark">{conv.entreprise_name}</h4>
                            <p className="text-xs text-gray-600">Agent: {conv.agent_name}</p>
                            {conv.last_message_content && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {conv.last_message_content}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            {conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                                {conv.unread_count}
                              </span>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {conv.total_messages} msg
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {conversations.length === 0 && !loading && (
                      <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p>Aucune conversation</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Zone de chat */}
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* En-tête de conversation */}
                      <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="font-semibold text-mali-dark">{selectedConversation.entreprise_name}</h3>
                        <p className="text-sm text-gray-600">Agent: {selectedConversation.agent_name}</p>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 p-4 overflow-y-auto bg-gray-50" style={{ maxHeight: '400px' }}>
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.messageType === 'USER' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                  message.messageType === 'USER'
                                    ? 'bg-gradient-to-r from-mali-emerald to-mali-gold text-white'
                                    : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${message.messageType === 'USER' ? 'text-white opacity-75' : 'text-gray-500'}`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {/* Référence pour le scroll automatique */}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Zone de saisie */}
                      <div className="border-t border-gray-200 p-4 bg-white">
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Tapez votre réponse..."
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                            disabled={sending}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={sending || !newMessage.trim()}
                            className="bg-gradient-to-r from-mali-emerald to-mali-gold text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {sending ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p className="text-lg font-medium">Sélectionnez une conversation</p>
                        <p className="text-sm">Choisissez une conversation dans la liste pour commencer</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Mes Demandes */}
          {activeTab === 'demandes' && (
            <div>
              <h2 className="text-2xl font-semibold text-mali-dark mb-6">Mes Demandes</h2>
              <div className="bg-gray-50 p-8 rounded-xl text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <p className="text-gray-600">Vous avez 1 demande en cours de traitement</p>
                <p className="text-sm text-gray-500 mt-2">Entreprise: Dymo</p>
              </div>
            </div>
          )}

          {/* Onglet Paramètres */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-semibold text-mali-dark mb-6">Paramètres</h2>
              <div className="bg-gray-50 p-8 rounded-xl text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p className="text-gray-600">Paramètres de compte</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileWithChat;
























