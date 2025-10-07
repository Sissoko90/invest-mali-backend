import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import BusinessCreation from './components/BusinessCreation';
import BusinessTracking from './components/BusinessTracking';
import UserProfile from './components/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import MyApplications from './components/MyApplications';
import DeclarationHonneur from './components/DeclarationHonneur';
import DemandePage from './pages/DemandePage';
// IntegrationTest route retirée en production

// Page d'accueil
const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <Hero />
      <Services />
      <Footer />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App font-inter text-mali-dark bg-white">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/demande" element={
              <ProtectedRoute>
                <DemandePage />
              </ProtectedRoute>
            } />
            <Route path="/create-business" element={
              <ProtectedRoute>
                <BusinessCreation />
              </ProtectedRoute>
            } />
            <Route path="/suivi-creation" element={
              <ProtectedRoute>
                <BusinessTracking />
              </ProtectedRoute>
            } />
            <Route path="/mes-demandes" element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/declaration-honneur" element={
              <ProtectedRoute>
                <DeclarationHonneur />
              </ProtectedRoute>
            } />
            {/* Route de test retirée */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
