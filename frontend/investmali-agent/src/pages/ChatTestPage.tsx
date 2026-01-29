import React from 'react';
import UserChatDemo from '../components/UserChatDemo';

const ChatTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎉 Système de Chat Bidirectionnel
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Démonstration du système de messagerie entre agents et utilisateurs. 
            L'utilisateur peut maintenant recevoir et répondre aux messages de l'agent concernant son entreprise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Côté Agent */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">👨‍💼</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Interface Agent</h2>
              <p className="text-gray-600">Envoie des messages aux utilisateurs</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-800 mb-2">✅ Fonctionnalités Actives</h3>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• Envoi de messages aux utilisateurs</li>
                  <li>• Réutilisation des conversations existantes</li>
                  <li>• Historique des messages persisté</li>
                  <li>• Scroll automatique dans le chat</li>
                  <li>• Interface responsive et moderne</li>
                </ul>
              </div>
              
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-800 mb-2">📊 Statistiques</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">6</div>
                    <div className="text-primary-700">Messages envoyés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">1</div>
                    <div className="text-primary-700">Conversation active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Côté Utilisateur */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Interface Utilisateur</h2>
              <p className="text-gray-600">Reçoit et répond aux messages</p>
            </div>
            
            {/* Composant de démonstration utilisateur */}
            <UserChatDemo />
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Système Complet Implémenté</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Agent envoie message</h3>
                <p className="text-sm text-gray-600">L'agent contacte l'utilisateur via l'interface</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Utilisateur reçoit</h3>
                <p className="text-sm text-gray-600">L'utilisateur voit les messages dans son interface</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Conversation bidirectionnelle</h3>
                <p className="text-sm text-gray-600">Les deux parties peuvent échanger en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTestPage;
























