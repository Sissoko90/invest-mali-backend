import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import ChatModal from './ChatModal';
import { getApiBaseUrl } from '../utils/apiUrl';

interface Conversation {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  userId: string;
  userNom: string;
  subject: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSender?: 'AGENT' | 'USER';
  unreadMessages: number;
  status: string;
}

interface AgentConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgentConversationsModal: React.FC<AgentConversationsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { agent } = useAgentAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Charger les conversations de l'agent
  const loadAgentConversations = async () => {
    if (!agent?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Chargement des conversations pour l\'agent:', agent.id);
      
      const response = await fetch(`${getApiBaseUrl()}/chat/conversations/agent/${agent.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversations agent chargées:', data);
        
        if (data.status === 'SUCCESS') {
          setConversations(data.conversations || []);
        } else {
          setError(data.message || 'Erreur lors du chargement des conversations');
        }
      } else {
        setError(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des conversations:', err);
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  // Charger les conversations quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && agent?.id) {
      loadAgentConversations();
    }
  }, [isOpen, agent?.id]);

  // Ouvrir une conversation spécifique
  const openConversation = (conversation: Conversation) => {
    console.log('🔄 Ouverture de la conversation:', conversation.id);
    setSelectedConversation(conversation);
    setChatModalOpen(true);
  };

  // Fermer le chat et revenir à la liste
  const handleCloseChat = () => {
    setChatModalOpen(false);
    setSelectedConversation(null);
    // Recharger les conversations pour mettre à jour les compteurs
    loadAgentConversations();
  };

  // Formater le temps
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Tronquer le message
  const truncateMessage = (message?: string, maxLength = 60) => {
    if (!message) return 'Aucun message';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal des conversations */}
      {!chatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-mali-emerald to-mali-gold text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Mes Conversations</h3>
                  <p className="text-sm opacity-90">
                    {conversations.length} conversation(s) • Agent: {agent?.firstName} {agent?.lastName}
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
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald mx-auto mb-2"></div>
                    <p className="text-gray-600">Chargement des conversations...</p>
                  </div>
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
                      onClick={loadAgentConversations}
                      className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 transition-colors"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune conversation</h3>
                    <p className="text-gray-600">Les conversations avec les utilisateurs apparaîtront ici.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Conversations actives ({conversations.length})
                    </h4>
                    <button
                      onClick={loadAgentConversations}
                      className="text-mali-emerald hover:text-mali-emerald/80 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Actualiser"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => openConversation(conv)}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                          conv.unreadMessages > 0
                            ? 'bg-primary-50 border-primary-200 hover:bg-primary-100'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-semibold text-gray-800 truncate">
                                {conv.entrepriseNom}
                              </h5>
                              {conv.unreadMessages > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                                  {conv.unreadMessages > 9 ? '9+' : conv.unreadMessages}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span>👤 {conv.userNom}</span>
                              <span>📋 {conv.subject}</span>
                            </div>

                            {conv.lastMessage && (
                              <p className={`text-sm break-words ${
                                conv.unreadMessages > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
                              }`}>
                                <span className="font-medium">
                                  {conv.lastMessageSender === 'AGENT' ? 'Vous: ' : `${conv.userNom}: `}
                                </span>
                                {truncateMessage(conv.lastMessage, 80)}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                            <div>{formatTime(conv.lastMessageTime)}</div>
                            <div className={`mt-1 px-2 py-1 rounded-full text-xs ${
                              conv.status === 'ACTIVE' 
<<<<<<< HEAD
                                ? 'bg-sky-100 text-primary-800' 
=======
                                ? 'bg-primary-100 text-primary-800' 
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {conv.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de chat spécifique */}
      {chatModalOpen && selectedConversation && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={handleCloseChat}
          entrepriseId={selectedConversation.entrepriseId}
          entrepriseNom={selectedConversation.entrepriseNom}
          userId={selectedConversation.userId}
          userNom={selectedConversation.userNom}
        />
      )}
    </>
  );
};

export default AgentConversationsModal;
























