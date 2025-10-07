import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AgentAuthProvider } from './contexts/AgentAuthContext';
import AgentLogin from './components/AgentLogin';
import AgentProtectedRoute from './components/AgentProtectedRoute';
import AgentDashboard from './pages/AgentDashboard';
import DossierWorkflowPage from './pages/DossierWorkflowPage';
import TestConnection from './components/TestConnection';
import SimpleApplicationsList from './components/SimpleApplicationsList';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AgentAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/agent-login" element={<AgentLogin />} />
            <Route path="/test-connection" element={<TestConnection />} />
            <Route path="/simple-list" element={<SimpleApplicationsList />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <AgentProtectedRoute>
                <Navigate to="/dashboard" replace />
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
            
            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AgentAuthProvider>
  );
}

export default App;
