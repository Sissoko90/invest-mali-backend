<<<<<<< HEAD
﻿import React, { useState } from 'react';
import UserChatModal from './UserChatModal';

const UserChatDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Données de test pour l'utilisateur de l'entreprise Dymo
  const testUser = {
    id: '075e96d0-651c-40e7-a44a-04341daaac56',
    name: 'Abdoul Doukhanse'
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Interface Utilisateur</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Informations Utilisateur</h2>
            <p><strong>Nom:</strong> {testUser.name}</p>
            <p><strong>ID:</strong> {testUser.id}</p>
            <p><strong>Entreprise:</strong> Dymo</p>
          </div>

          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">💬 Notifications</h3>
            <p className="text-sm text-primary-700">
              Vous avez reçu des messages de votre agent concernant votre entreprise Dymo.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            📨 Voir mes conversations
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Cliquez pour ouvrir vos conversations avec les agents</p>
          </div>
        </div>
      </div>

      {/* Modal de chat utilisateur */}
      <UserChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={testUser.id}
        userName={testUser.name}
      />
    </div>
  );
};

export default UserChatDemo;
























=======
﻿import React, { useState } from 'react';
import UserChatModal from './UserChatModal';

const UserChatDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Données de test pour l'utilisateur de l'entreprise Dymo
  const testUser = {
    id: '075e96d0-651c-40e7-a44a-04341daaac56',
    name: 'Abdoul Doukhanse'
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Interface Utilisateur</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Informations Utilisateur</h2>
            <p><strong>Nom:</strong> {testUser.name}</p>
            <p><strong>ID:</strong> {testUser.id}</p>
            <p><strong>Entreprise:</strong> Dymo</p>
          </div>

          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">💬 Notifications</h3>
            <p className="text-sm text-primary-700">
              Vous avez reçu des messages de votre agent concernant votre entreprise Dymo.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            📨 Voir mes conversations
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Cliquez pour ouvrir vos conversations avec les agents</p>
          </div>
        </div>
      </div>

      {/* Modal de chat utilisateur */}
      <UserChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={testUser.id}
        userName={testUser.name}
      />
    </div>
  );
};

export default UserChatDemo;
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
