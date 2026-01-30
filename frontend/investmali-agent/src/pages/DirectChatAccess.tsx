<<<<<<< HEAD
﻿import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserChatModal from '../components/UserChatModal';
import UserDashboard from '../components/UserDashboard';

const DirectChatAccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<{id: string, name: string} | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Récupérer l'ID utilisateur depuis l'URL
    const userId = searchParams.get('user');
    const action = searchParams.get('action');
    
    if (userId) {
      // Dans un vrai système, vous récupéreriez les infos utilisateur depuis l'API
      // Ici, on utilise les données de test
      if (userId === '075e96d0-651c-40e7-a44a-04341daaac56') {
        setUser({
          id: userId,
          name: 'Abdoul Doukhanse'
        });
        
        // Si l'action est 'chat', ouvrir directement le chat
        if (action === 'chat') {
          setShowChat(true);
        }
      }
    }
  }, [searchParams]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🔐 Accès Sécurisé</h1>
          <p className="text-gray-600 mb-6">
            Veuillez utiliser le lien fourni par votre agent pour accéder à vos messages.
          </p>
          
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-primary-800 mb-2">📝 Format du lien :</h3>
            <code className="text-sm text-primary-700">
              {window.location.origin}/chat?user=VOTRE_ID&action=chat
            </code>
          </div>
          
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <h3 className="font-semibold text-primary-800 mb-2">🔗 Exemple de lien :</h3>
            <a 
              href="?user=075e96d0-651c-40e7-a44a-04341daaac56&action=chat"
              className="text-sky-600 hover:text-primary-800 underline text-sm"
            >
              Accéder aux messages de test (Abdoul Doukhanse)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <UserDashboard 
        userId={user.id} 
        userName={user.name}
      />
      
      {showChat && (
        <UserChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          userId={user.id}
          userName={user.name}
        />
      )}
    </>
  );
};

export default DirectChatAccess;
























=======
﻿import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserChatModal from '../components/UserChatModal';
import UserDashboard from '../components/UserDashboard';

const DirectChatAccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<{id: string, name: string} | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Récupérer l'ID utilisateur depuis l'URL
    const userId = searchParams.get('user');
    const action = searchParams.get('action');
    
    if (userId) {
      // Dans un vrai système, vous récupéreriez les infos utilisateur depuis l'API
      // Ici, on utilise les données de test
      if (userId === '075e96d0-651c-40e7-a44a-04341daaac56') {
        setUser({
          id: userId,
          name: 'Abdoul Doukhanse'
        });
        
        // Si l'action est 'chat', ouvrir directement le chat
        if (action === 'chat') {
          setShowChat(true);
        }
      }
    }
  }, [searchParams]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🔐 Accès Sécurisé</h1>
          <p className="text-gray-600 mb-6">
            Veuillez utiliser le lien fourni par votre agent pour accéder à vos messages.
          </p>
          
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-primary-800 mb-2">📝 Format du lien :</h3>
            <code className="text-sm text-primary-700">
              {window.location.origin}/chat?user=VOTRE_ID&action=chat
            </code>
          </div>
          
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-semibold text-primary-800 mb-2">🔗 Exemple de lien :</h3>
            <a 
              href="?user=075e96d0-651c-40e7-a44a-04341daaac56&action=chat"
              className="text-primary-600 hover:text-primary-800 underline text-sm"
            >
              Accéder aux messages de test (Abdoul Doukhanse)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <UserDashboard 
        userId={user.id} 
        userName={user.name}
      />
      
      {showChat && (
        <UserChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          userId={user.id}
          userName={user.name}
        />
      )}
    </>
  );
};

export default DirectChatAccess;
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
