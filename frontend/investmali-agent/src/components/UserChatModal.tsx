<<<<<<< HEAD
﻿import React, { useState, useEffect, useRef } from 'react';
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

interface UserChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const UserChatModal: React.FC<UserChatModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
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
    setLoading(true);
    try {
      console.log('📥 Chargement des conversations pour utilisateur:', userId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/user-native/${userId}`, {
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${selectedConversation.id}/messages`, {
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

  // Charger les conversations au montage
  useEffect(() => {
    if (isOpen && userId) {
      loadConversations();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Mes Conversations - {userName}
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
          {/* Liste des conversations */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Conversations</h3>
              {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{conv.entreprise_name}</h4>
                      <p className="text-xs text-gray-600">Agent: {conv.agent_name}</p>
                      {conv.last_message_content && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conv.last_message_content}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
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
            </div>
          </div>

          {/* Zone de chat */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* En-tête de conversation */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{selectedConversation.entreprise_name}</h3>
                  <p className="text-sm text-gray-600">Agent: {selectedConversation.agent_name}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 250px)' }}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.messageType === 'USER' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.messageType === 'USER'
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
                </div>

                {/* Zone de saisie */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Tapez votre réponse..."
                      className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? '⏳' : '📤'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChatModal;
























=======
﻿import React, { useState, useEffect, useRef } from 'react';
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

interface UserChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const UserChatModal: React.FC<UserChatModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
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
    setLoading(true);
    try {
      console.log('📥 Chargement des conversations pour utilisateur:', userId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/user-native/${userId}`, {
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${selectedConversation.id}/messages`, {
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

  // Charger les conversations au montage
  useEffect(() => {
    if (isOpen && userId) {
      loadConversations();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Mes Conversations - {userName}
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
          {/* Liste des conversations */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Conversations</h3>
              {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{conv.entreprise_name}</h4>
                      <p className="text-xs text-gray-600">Agent: {conv.agent_name}</p>
                      {conv.last_message_content && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conv.last_message_content}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
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
            </div>
          </div>

          {/* Zone de chat */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* En-tête de conversation */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{selectedConversation.entreprise_name}</h3>
                  <p className="text-sm text-gray-600">Agent: {selectedConversation.agent_name}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 250px)' }}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.messageType === 'USER' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.messageType === 'USER'
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
                </div>

                {/* Zone de saisie */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Tapez votre réponse..."
                      className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? '⏳' : '📤'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChatModal;
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
