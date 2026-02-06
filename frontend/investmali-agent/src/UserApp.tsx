import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DirectChatAccess from './pages/DirectChatAccess';
import UserDashboard from './components/UserDashboard';
import UserProfileDemo from './pages/UserProfileDemo';
import './index.css';

// Application dédiée pour les utilisateurs
function UserApp() {
  return (
    <Router>
      <div className="UserApp">
        <Routes>
          {/* Page d'accueil - Interface de profil avec chat intégré */}
          <Route 
            path="/" 
            element={<UserProfileDemo />}
          />
          
          {/* Interface de profil avec onglets */}
          <Route path="/profile" element={<UserProfileDemo />} />
          
          {/* Page de chat avec paramètres d'URL */}
          <Route path="/chat" element={<DirectChatAccess />} />
          
          {/* Dashboard utilisateur direct */}
          <Route 
            path="/dashboard/:userId" 
            element={
              <UserDashboard 
                userId="075e96d0-651c-40e7-a44a-04341daaac56"
                userName="Abdoul Doukhanse"
              />
            } 
          />
          
          {/* Route de fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default UserApp;
























