import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AgentAuthProvider } from './contexts/AgentAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ModalProvider } from './contexts/ModalContext';
import AgentLogin from './components/AgentLogin';
import AgentProtectedRoute from './components/AgentProtectedRoute';
import AgentDashboard from './pages/AgentDashboard';
import DossierWorkflowPage from './pages/DossierWorkflowPage';
import TestConnection from './components/TestConnection';
import SimpleApplicationsList from './components/SimpleApplicationsList';
import EntrepriseDetailsPage from './components/EntrepriseDetailsPage';
import AgrementManagement from './components/AgrementManagement';
import AgrementWorkflowPage from './pages/AgrementWorkflowPage';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
// Pages de paiement agent
import PaymentTresorPayPage from './pages/PaymentTresorPayPage';
import PaymentCashPage from './pages/PaymentCashPage';
import OrangeMoneyCallbackPage from './pages/OrangeMoneyCallbackPage';
import TestOrangeMoneyUpdatePage from './pages/TestOrangeMoneyUpdatePage';

function App() {
  return (
    <ThemeProvider>
      <AgentAuthProvider>
        <ModalProvider>
          <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            {/* Public Routes */}
            <Route path="/agent-login" element={<AgentLogin />} />
            <Route path="/test-connection" element={<TestConnection />} />
            <Route path="/simple-list" element={<SimpleApplicationsList />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <AgentProtectedRoute>
                <Navigate to="/dossier" replace />
              </AgentProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <AgentProtectedRoute>
                <AgentDashboard />
              </AgentProtectedRoute>
            } />
            
            <Route path="/dossier" element={
              <AgentProtectedRoute>
                <DossierWorkflowPage />
              </AgentProtectedRoute>
            } />
            
            <Route path="/dossier/:dossierId" element={
              <AgentProtectedRoute>
                <DossierWorkflowPage />
              </AgentProtectedRoute>
            } />
            
            <Route path="/entreprise/:id" element={
              <AgentProtectedRoute>
                <EntrepriseDetailsPage />
              </AgentProtectedRoute>
            } />
            
            <Route path="/agrement" element={
              <AgentProtectedRoute allowedRoles={[
                'AGENT_ACCEUIL',
                'AGENT_AGREMENT_ACCUEIL',
                'AGENT_AGREMENT_REVISION', 
                'AGENT_REGISSEUR',
                'AGENT_AGREMENT_RETRAIT',
                'MINISTERE_TRANSPORT',
                'MINISTERE_TOURISME',
                'MINISTERE_COMMERCE',
                'MINISTERE_INDUSTRIE',
                'MINISTERE_ENVIRONNEMENT',
                'MINISTERE_URBANISME',
                'SUPER_ADMIN'
              ]}>
                <AgrementManagement />
              </AgentProtectedRoute>
            } />
            
            <Route path="/agrement-workflow" element={
              <AgentProtectedRoute allowedRoles={[
                'AGENT_ACCEUIL',
                'AGENT_AGREMENT_ACCUEIL',
                'AGENT_AGREMENT_REVISION', 
                'AGENT_REGISSEUR',
                'AGENT_AGREMENT_RETRAIT',
                'MINISTERE_TRANSPORT',
                'MINISTERE_TOURISME',
                'MINISTERE_COMMERCE',
                'MINISTERE_INDUSTRIE',
                'MINISTERE_ENVIRONNEMENT',
                'MINISTERE_URBANISME',
                'SUPER_ADMIN'
              ]}>
                <AgrementWorkflowPage />
              </AgentProtectedRoute>
            } />
            
            {/* Routes de paiement agent */}
            <Route path="/payment/tresorpay" element={
              <AgentProtectedRoute>
                <PaymentTresorPayPage />
              </AgentProtectedRoute>
            } />
            <Route path="/payment/cash" element={
              <AgentProtectedRoute>
                <PaymentCashPage />
              </AgentProtectedRoute>
            } />
            
            {/* Routes de callback Orange Money - Publiques pour permettre les redirections */}
            <Route path="/return" element={<OrangeMoneyCallbackPage />} />
            <Route path="/cancel" element={<OrangeMoneyCallbackPage />} />
            
            {/* Page de test Orange Money V2 */}
            <Route path="/test-orange-money-update" element={
              <AgentProtectedRoute>
                <TestOrangeMoneyUpdatePage />
              </AgentProtectedRoute>
            } />
            
            {/* Route spécifique Super Admin */}
            <Route path="/super-admin" element={
              <AgentProtectedRoute>
                <AgentDashboard />
              </AgentProtectedRoute>
            } />
            
            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
          </Router>
        </ModalProvider>
      </AgentAuthProvider>
    </ThemeProvider>
  );
}

export default App;
























