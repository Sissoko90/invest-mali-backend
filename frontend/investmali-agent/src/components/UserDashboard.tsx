import React, { useState, useEffect } from 'react';
import UserChatModal from './UserChatModal';

interface UserDashboardProps {
  userId: string;
  userName: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId, userName }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Vérifier les messages non lus
  const checkUnreadMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/conversations/user-native/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'SUCCESS') {
          const totalUnread = data.conversations.reduce((sum: number, conv: any) => sum + conv.unread_count, 0);
          setUnreadCount(totalUnread);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des messages:', error);
    }
  };

  // Vérifier les messages non lus au chargement et périodiquement
  useEffect(() => {
    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 30000); // Vérifier toutes les 30 secondes
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec notification */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de Bord - {userName}
            </h1>
            
            {/* Bouton Chat avec notification */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="relative bg-gradient-to-r from-mali-emerald to-mali-gold text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <span>Mes Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Carte Messages */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">💬</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Messages non lus
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {unreadCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Voir toutes les conversations
                  </button>
                </div>
              </div>
            </div>

            {/* Carte Entreprises */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🏢</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Mes Entreprises
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        1
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-600">
                    Dymo - En cours de traitement
                  </span>
                </div>
              </div>
            </div>

            {/* Carte Support */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🎧</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Support Agent
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Disponible
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Contacter un agent
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section Notifications */}
          {unreadCount > 0 && (
            <div className="mt-6 bg-sky-50 border border-sky-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-primary-500 text-xl">🔔</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary-800">
                    Nouveaux messages
                  </h3>
                  <div className="mt-2 text-sm text-primary-700">
                    <p>
                      Vous avez {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''} de votre agent concernant vos entreprises.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-primary-50 px-2 py-1.5 rounded-md text-sm font-medium text-primary-800 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-primary-600"
                      >
                        Lire les messages
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de chat */}
      <UserChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          checkUnreadMessages(); // Rafraîchir le compteur après fermeture
        }}
        userId={userId}
        userName={userName}
      />
    </div>
  );
};

export default UserDashboard;
























