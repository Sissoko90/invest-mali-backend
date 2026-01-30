<<<<<<< HEAD
﻿import React from 'react';
import UserProfileWithChat from '../components/UserProfileWithChat';

const UserProfileDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-mali-gold/50 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-14 h-14 bg-mali-emerald/50 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-mali-purple/50 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-mali-emerald/50 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 right-10 w-14 h-14 bg-mali-gold/50 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-20 w-8 h-8 bg-mali-purple/50 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        
        {/* Vague décorative */}
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-5" viewBox="0 0 1440 320">
          <path fill="#176B5C" fillOpacity="0.05" d="M0,160L60,186.7C120,213,240,267,360,261.3C480,256,600,192,720,186.7C840,181,960,235,1080,229.3C1200,224,1320,160,1380,128L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
        
        {/* Points animés */}
        <div className="absolute inset-0">
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '10%', top: '20%', animationDelay: '0s', animationDuration: '2s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '25%', top: '30%', animationDelay: '0.3s', animationDuration: '2.5s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '40%', top: '40%', animationDelay: '0.6s', animationDuration: '3s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '55%', top: '50%', animationDelay: '0.9s', animationDuration: '3.5s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '70%', top: '60%', animationDelay: '1.2s', animationDuration: '4s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '85%', top: '70%', animationDelay: '1.5s', animationDuration: '4.5s'}}></div>
        </div>
        
        {/* Lignes ondulées */}
        <svg className="absolute top-1/4 left-0 w-full h-32 opacity-20" viewBox="0 0 1440 100">
          <path fill="none" stroke="#22C55E" strokeWidth="2" strokeOpacity="0.05" d="M0,50 Q360,10 720,50 T1440,50"></path>
        </svg>
        <svg className="absolute top-3/4 left-0 w-full h-32 opacity-20" viewBox="0 0 1440 100">
          <path fill="none" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.05" d="M0,30 Q360,70 720,30 T1440,30"></path>
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-mali-emerald to-mali-gold rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">AD</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-mali-dark">Abdoul Doukhanse</h1>
                  <p className="text-gray-600">mdz.dev54@gmail.com</p>
                </div>
              </div>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                ← Retour
              </button>
            </div>
          </div>
        </div>

        {/* Interface utilisateur avec chat intégré */}
        <UserProfileWithChat
          userId="075e96d0-651c-40e7-a44a-04341daaac56"
          userName="Abdoul Doukhanse"
          userEmail="mdz.dev54@gmail.com"
        />
      </div>
    </div>
  );
};

export default UserProfileDemo;
























=======
﻿import React from 'react';
import UserProfileWithChat from '../components/UserProfileWithChat';

const UserProfileDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-mali-gold/50 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-14 h-14 bg-mali-emerald/50 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-mali-purple/50 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-mali-emerald/50 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 right-10 w-14 h-14 bg-mali-gold/50 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-20 w-8 h-8 bg-mali-purple/50 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        
        {/* Vague décorative */}
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-5" viewBox="0 0 1440 320">
          <path fill="#176B5C" fillOpacity="0.05" d="M0,160L60,186.7C120,213,240,267,360,261.3C480,256,600,192,720,186.7C840,181,960,235,1080,229.3C1200,224,1320,160,1380,128L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
        
        {/* Points animés */}
        <div className="absolute inset-0">
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '10%', top: '20%', animationDelay: '0s', animationDuration: '2s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '25%', top: '30%', animationDelay: '0.3s', animationDuration: '2.5s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '40%', top: '40%', animationDelay: '0.6s', animationDuration: '3s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '55%', top: '50%', animationDelay: '0.9s', animationDuration: '3.5s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '70%', top: '60%', animationDelay: '1.2s', animationDuration: '4s'}}></div>
          <div className="absolute w-2 h-2 bg-mali-emerald/50 rounded-full animate-bounce" style={{left: '85%', top: '70%', animationDelay: '1.5s', animationDuration: '4.5s'}}></div>
        </div>
        
        {/* Lignes ondulées */}
        <svg className="absolute top-1/4 left-0 w-full h-32 opacity-20" viewBox="0 0 1440 100">
          <path fill="none" stroke="#22C55E" strokeWidth="2" strokeOpacity="0.05" d="M0,50 Q360,10 720,50 T1440,50"></path>
        </svg>
        <svg className="absolute top-3/4 left-0 w-full h-32 opacity-20" viewBox="0 0 1440 100">
          <path fill="none" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.05" d="M0,30 Q360,70 720,30 T1440,30"></path>
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-mali-emerald to-mali-gold rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">AD</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-mali-dark">Abdoul Doukhanse</h1>
                  <p className="text-gray-600">mdz.dev54@gmail.com</p>
                </div>
              </div>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                ← Retour
              </button>
            </div>
          </div>
        </div>

        {/* Interface utilisateur avec chat intégré */}
        <UserProfileWithChat
          userId="075e96d0-651c-40e7-a44a-04341daaac56"
          userName="Abdoul Doukhanse"
          userEmail="mdz.dev54@gmail.com"
        />
      </div>
    </div>
  );
};

export default UserProfileDemo;
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
