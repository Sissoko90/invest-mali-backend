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
import AutorisationExercicePage from './pages/AutorisationExercicePage';
import AutorisationTypeSelectionPage from './pages/AutorisationTypeSelectionPage';
import DemandeAutorisationPage from './components/DemandeAutorisationPage';
// Pages de paiement
import PaymentTresorPayPage from './pages/PaymentTresorPayPage';
import PaymentReceiptPage from './pages/PaymentReceiptPage';
import AgentDashboard from './components/AgentDashboard';
import ActivitesReglementees from './pages/ActivitesReglementees';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

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
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/activites-reglementees" element={<ActivitesReglementees />} />
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
            <Route path="/autorisation-exercice" element={
              <ProtectedRoute>
                <AutorisationTypeSelectionPage />
              </ProtectedRoute>
            } />
            <Route path="/autorisation-exercice/agrement" element={
              <ProtectedRoute>
                <AutorisationExercicePage />
              </ProtectedRoute>
            } />
            <Route path="/demande-autorisation" element={
              <ProtectedRoute>
                <DemandeAutorisationPage />
              </ProtectedRoute>
            } />
            
            {/* Route pour les agents */}
            <Route path="/dossier" element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            } />
            
            {/* Routes de paiement */}
            <Route path="/payment/tresorpay" element={
              <ProtectedRoute>
                <PaymentTresorPayPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/receipt" element={
              <ProtectedRoute>
                <PaymentReceiptPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;