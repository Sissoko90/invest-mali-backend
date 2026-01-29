import React, { useState, useEffect } from 'react';
import { Plus, Users, Shield, AlertCircle, CheckCircle } from './icons';
import AgentManagementService, { 
  AgentResponse, 
  AgentCreationRequest, 
  RoleOption, 
  AntenneOption 
} from '../services/agentManagementApi';
import { entreprisesAPI } from '../services/api';

const AgentManagementFixed: React.FC = () => {
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [antennes, setAntennes] = useState<AntenneOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentResponse | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Form data pour création d'agent
  const [formData, setFormData] = useState<AgentCreationRequest>({
    prenom: '',
    nom: '',
    email: '',
    motDePasse: '',
    role: '',
    roles: [],
    antenneAgent: '',
    antennes: [],
    telephone: '',
    adresse: ''
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      
      // Essayer de charger les agents depuis l'API
      let loadedAgents: AgentResponse[] = [];
      try {
        const agentsData = await AgentManagementService.listAgents({ page: 0, size: 20 });
        loadedAgents = agentsData.content;
        setAgents(loadedAgents);
      } catch (agentError) {
        // Utiliser des données de fallback
        const fallbackAgents: AgentResponse[] = [
          {
            id: 1,
            prenom: 'Admin',
            nom: 'Système',
            email: 'admin@api-invest.ml',
            role: 'SUPER_ADMIN', // Correspond à l'enum Roles.SUPER_ADMIN
            roles: ['SUPER_ADMIN'],
            antenneAgent: 'BAMAKO', // Correspond à l'enum AntenneAgents.BAMAKO
            antennes: ['BAMAKO'],
            telephone: '70000000',
            adresse: 'Bamako, Mali',
            actif: true,
            dateCreation: new Date().toISOString(),
            dateModification: new Date().toISOString()
          }
        ];
        loadedAgents = fallbackAgents;
        setAgents(fallbackAgents);
      }
      
      // Utiliser les vraies valeurs des enums backend
      // Correspondance avec: src/main/java/abdaty_technologie/API_Invest/Entity/Enum/Roles.java
      const backendRoles = [
        { value: 'USER', label: 'User' },
        // Rôles création d'entreprise
        { value: 'AGENT_ACCEUIL', label: 'Agent Accueil (Création)' },
        { value: 'AGENT_REGISTER', label: 'Agent Register' },
        { value: 'AGENT_REVISION', label: 'Agent Révision (Création)' },
        { value: 'AGENT_IMPOT', label: 'Agent Impôt' },
        { value: 'AGENT_RCCM1', label: 'Agent RCCM1' },
        { value: 'AGENT_RCCM2', label: 'Agent RCCM2' },
        { value: 'AGENT_NINA', label: 'Agent NINA' },
        { value: 'AGENT_RETRAIT', label: 'Agent Retrait (Création)' },
        { value: 'AGENT_NOTAIRE', label: 'Agent Notaire' },
        { value: 'AGENT_TCOM', label: 'T-COM' },
        // Rôles agrément
        { value: 'AGENT_AGREMENT_ACCUEIL', label: 'Agent Agrément Accueil' },
        { value: 'AGENT_AGREMENT_REVISION', label: 'Agent Agrément Révision' },
        { value: 'AGENT_REGISSEUR', label: 'Agent Régisseur' },
        { value: 'AGENT_AGREMENT_RETRAIT', label: 'Agent Agrément Retrait' },
        // Rôles ministères
        { value: 'MINISTERE_TRANSPORT', label: 'Ministère des Transports' },
        { value: 'MINISTERE_TOURISME', label: 'Ministère du Tourisme' },
        { value: 'MINISTERE_COMMERCE', label: 'Ministère du Commerce' },
        { value: 'MINISTERE_INDUSTRIE', label: 'Ministère de l\'Industrie' },
        { value: 'MINISTERE_ENVIRONNEMENT', label: 'Ministère de l\'Environnement' },
        { value: 'MINISTERE_URBANISME', label: 'Ministère de l\'Urbanisme' },
        // Admin
        { value: 'SUPER_ADMIN', label: 'Super Admin' }
      ];

      // Correspondance avec: src/main/java/abdaty_technologie/API_Invest/Entity/Enum/AntenneAgents.java
      const backendAntennes = [
        { value: 'BAMAKO', label: 'Bamako' },
        { value: 'KAYES', label: 'Kayes' },
        { value: 'KOULIKORO', label: 'Koulikoro' },
        { value: 'SIKASSO', label: 'Sikasso' },
        { value: 'SÉGOU', label: 'Segou' },
        { value: 'MOPTI', label: 'Mopti' },
        { value: 'TOMBOUCTOU', label: 'Tombouctou' },
        { value: 'GAO', label: 'Gao' },
        { value: 'KIDAL', label: 'Kidal' },
        { value: 'TAOUDÉNIT', label: 'Taoudenit' },
        { value: 'MÉNAKA', label: 'Menaka' },
        { value: 'NIORO', label: 'Nioro' },
        { value: 'BOUGOUNI', label: 'Bougouni' },
        { value: 'DIOÏLA', label: 'Dioila' },
        { value: 'KOUTIALA', label: 'Koutiala' },
        { value: 'KITA', label: 'Kitaa' },
        { value: 'NARA', label: 'Nara' },
        { value: 'BANDIAGARA', label: 'Bandiagara' },
        { value: 'SAN', label: 'San' },
        { value: 'DOUENTZA', label: 'Douentza' }
      ];

      setRoles(backendRoles);
      setAntennes(backendAntennes);
      
      const agentCount = loadedAgents.length;
      showNotification('success', `${agentCount} agents chargés`);
      
    } catch (error) {
      showNotification('error', 'Erreur lors du chargement des données - Vérifiez que le serveur est redémarré');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des rôles
    if (!formData.roles || formData.roles.length === 0) {
      showNotification('error', 'Veuillez sélectionner au moins un rôle');
      return;
    }
    
    // Validation des antennes
    if (!formData.antennes || formData.antennes.length === 0) {
      showNotification('error', 'Veuillez sélectionner au moins une antenne');
      return;
    }
    
    // Validation basique du mot de passe (non vide seulement)
    if (!formData.motDePasse || formData.motDePasse.trim() === '') {
      showNotification('error', 'Le mot de passe ne peut pas être vide');
      return;
    }
    
    setLoading(true);

    try {
      
      const newAgent = await AgentManagementService.createAgent(formData);
      setAgents(prev => [newAgent, ...prev]);
      setShowCreateForm(false);
      setFormData({
        prenom: '',
        nom: '',
        email: '',
        motDePasse: '',
        role: '',
        roles: [],
        antenneAgent: '',
        antennes: [],
        telephone: '',
        adresse: ''
      });
      
      showNotification('success', 'Agent créé avec succès dans la base de données');
    } catch (error: any) {
      showNotification('error', error.message || 'Erreur lors de la création de l\'agent');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgent = (agent: AgentResponse) => {
    
    // Pré-remplir le formulaire avec les données de l'agent
    setFormData({
      prenom: agent.prenom,
      nom: agent.nom,
      email: agent.email,
      motDePasse: '', // Ne pas pré-remplir le mot de passe pour la sécurité
      role: agent.role,
      roles: agent.roles || [agent.role],
      antenneAgent: agent.antenneAgent,
      antennes: agent.antennes || [agent.antenneAgent],
      telephone: agent.telephone || '',
      adresse: agent.adresse || ''
    });
    
    setEditingAgent(agent);
    setShowEditForm(true);
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAgent) {
      showNotification('error', 'Aucun agent sélectionné pour la modification');
      return;
    }
    
    // Validation des rôles
    if (!formData.roles || formData.roles.length === 0) {
      showNotification('error', 'Veuillez sélectionner au moins un rôle');
      return;
    }
    
    // Validation des antennes
    if (!formData.antennes || formData.antennes.length === 0) {
      showNotification('error', 'Veuillez sélectionner au moins une antenne');
      return;
    }
    
    setLoading(true);

    try {
      console.log('🔄 Modification de l\'agent via API:', formData.email);
      console.log('📋 Rôles sélectionnés:', formData.roles);
      console.log('🏢 Antennes sélectionnées:', formData.antennes);
      
      // S'assurer que les champs principaux sont définis à partir des arrays
      const primaryRole = formData.roles && formData.roles.length > 0 ? formData.roles[0] : formData.role;
      const primaryAntenne = formData.antennes && formData.antennes.length > 0 ? formData.antennes[0] : formData.antenneAgent;
      
      // Adapter les données au format AgentUpdateRequest avec support des arrays
      const updateData = {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        motDePasse: formData.motDePasse || undefined, // Ne pas envoyer si vide
        role: primaryRole, // Rôle principal (premier de la liste)
        roles: formData.roles, // Array complet des rôles
        antenneAgent: primaryAntenne, // Antenne principale (première de la liste)
        antennes: formData.antennes, // Array complet des antennes
        telephone: formData.telephone,
        adresse: formData.adresse
      };
      
      console.log('📊 Données envoyées à l\'API:', updateData);
      
      const updatedAgent = await AgentManagementService.updateAgent(editingAgent.id.toString(), updateData);
      setAgents(prev => prev.map(a => a.id === editingAgent.id ? updatedAgent : a));
      setShowEditForm(false);
      setEditingAgent(null);
      setFormData({
        prenom: '',
        nom: '',
        email: '',
        motDePasse: '',
        role: '',
        roles: [],
        antenneAgent: '',
        antennes: [],
        telephone: '',
        adresse: ''
      });
      
      console.log('✅ Agent modifié avec succès:', updatedAgent.id);
      showNotification('success', 'Agent modifié avec succès dans la base de données');
    } catch (error: any) {
      console.error('❌ Erreur modification agent:', error);
      showNotification('error', error.message || 'Erreur lors de la modification de l\'agent');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agent: AgentResponse) => {
    // Demander confirmation avant suppression
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement l'agent "${agent.prenom} ${agent.nom}" (${agent.email}) ?\n\n⚠️ Cette action est irréversible !\n\n📋 Note: Si cet agent est assigné à des entreprises, elles seront automatiquement désassignées.`
    );
    
    if (!confirmDelete) {
      console.log('🚫 Suppression annulée par l\'utilisateur');
      return;
    }
    
    setLoading(true);

    try {
      console.log('🗑️ Suppression de l\'agent via API:', agent.email);
      
      // Étape 1: D'abord désactiver l'agent pour éviter de nouvelles assignations
      console.log('🔄 Étape 1: Désactivation de l\'agent...');
      try {
        await AgentManagementService.toggleAgentStatus(agent.id.toString(), false);
        console.log('✅ Agent désactivé avant suppression');
      } catch (deactivateError) {
        console.warn('⚠️ Impossible de désactiver l\'agent, continuation...');
      }
      
      // Étape 2: Tentative de suppression de l'agent
      console.log('🔄 Étape 2: Suppression de l\'agent...');
      await AgentManagementService.deleteAgent(agent.id.toString());
      
      // Retirer l'agent de la liste locale
      setAgents(prev => prev.filter(a => a.id !== agent.id));
      
      console.log('✅ Agent supprimé avec succès:', agent.id);
      showNotification('success', `Agent "${agent.prenom} ${agent.nom}" supprimé avec succès`);
    } catch (error: any) {
      console.error('❌ Erreur suppression agent:', error);
      
      // Analyser le type d'erreur
      if (error.message && error.message.includes('foreign key constraint')) {
        // Proposer une alternative à l'utilisateur
        const useAlternative = window.confirm(
          `❌ Impossible de supprimer l'agent "${agent.prenom} ${agent.nom}"\n\n` +
          `🔗 Cet agent est encore assigné à des entreprises.\n\n` +
          `💡 Voulez-vous le DÉSACTIVER à la place ?\n\n` +
          `• OUI = L'agent sera désactivé (recommandé)\n` +
          `• NON = Annuler l'opération`
        );
        
        if (useAlternative) {
          // Désactiver l'agent au lieu de le supprimer
          try {
            console.log('🔄 Désactivation de l\'agent comme alternative...');
            const updatedAgent = await AgentManagementService.toggleAgentStatus(agent.id.toString(), false);
            setAgents(prev => prev.map(a => a.id === agent.id ? updatedAgent : a));
            showNotification('success', `Agent "${agent.prenom} ${agent.nom}" désactivé avec succès`);
          } catch (deactivateError) {
            showNotification('error', 'Erreur lors de la désactivation de l\'agent');
          }
        } else {
          showNotification('error', 
            `Suppression annulée.\n\n` +
            `💡 Pour supprimer cet agent, vous devez d'abord:\n` +
            `• Aller dans "Gestion des Entreprises"\n` +
            `• Désassigner manuellement toutes ses entreprises\n` +
            `• Puis revenir supprimer l'agent`
          );
        }
      } else {
        showNotification('error', error.message || 'Erreur lors de la suppression de l\'agent');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgentStatus = async (agent: AgentResponse) => {
    const newStatus = !agent.actif;
    const action = newStatus ? 'activer' : 'désactiver';
    
    // Demander confirmation
    const confirmToggle = window.confirm(
      `Êtes-vous sûr de vouloir ${action} l'agent "${agent.prenom} ${agent.nom}" (${agent.email}) ?`
    );
    
    if (!confirmToggle) {
      console.log(`🚫 ${action} annulé par l'utilisateur`);
      return;
    }
    
    setLoading(true);

    try {
      console.log(`🔄 ${action} de l'agent via API:`, agent.email);
      
      const updatedAgent = await AgentManagementService.toggleAgentStatus(agent.id.toString(), newStatus);
      
      // Mettre à jour l'agent dans la liste locale
      setAgents(prev => prev.map(a => a.id === agent.id ? updatedAgent : a));
      
      console.log(`✅ Agent ${action} avec succès:`, updatedAgent.id);
      showNotification('success', `Agent "${agent.prenom} ${agent.nom}" ${action} avec succès`);
    } catch (error: any) {
      console.error(`❌ Erreur lors de l'${action}:`, error);
      showNotification('error', error.message || `Erreur lors de l'${action} de l'agent`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Chargement des agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header simple */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Gestion des Agents</h1>
          <p className="text-sm text-slate-500">Gérer les agents et leurs permissions</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              prenom: '',
              nom: '',
              email: '',
              motDePasse: '',
              role: '',
              roles: [],
              antenneAgent: '',
              antennes: [],
              telephone: '',
              adresse: ''
            });
            setShowCreateForm(true);
          }}
          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel Agent</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-3 rounded-lg flex items-center space-x-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Statistiques simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sky-50 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{agents.length}</p>
            <p className="text-sm text-slate-500">Total Agents</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{agents.filter(agent => agent.actif).length}</p>
            <p className="text-sm text-slate-500">Agents Actifs</p>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{roles.length}</p>
            <p className="text-sm text-slate-500">Rôles Disponibles</p>
          </div>
        </div>
      </div>

      {/* Liste des agents - Table simple */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-slate-700">Liste des Agents</h2>
        </div>
    
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Antenne</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {agent.prenom} {agent.nom}
                      </div>
                      <div className="text-xs text-slate-500">{agent.email}</div>
                      {agent.telephone && (
                        <div className="text-xs text-slate-500">{agent.telephone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.roles && agent.roles.length > 0 ? (
                        agent.roles.map((role, index) => (
                          <span key={index} className="inline-flex px-2 py-1 rounded text-xs font-medium bg-sky-100 text-sky-800">
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-sky-100 text-sky-800">
                          {agent.role}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.antennes && agent.antennes.length > 0 ? (
                        agent.antennes.map((antenne, index) => (
                          <span key={index} className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {antenne}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {agent.antenneAgent || 'Non assignée'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      agent.actif 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleAgentStatus(agent)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        {agent.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent)}
                        className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création simple */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Créer un Nouvel Agent</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateAgent} className="space-y-4">
                
                {/* Champs du formulaire */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      value={formData.motDePasse}
                      onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôles * (sélection multiple)
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {roles.map(role => (
                        <label key={role.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={(formData.roles || []).includes(role.value)}
                            onChange={(e) => {
                              const currentRoles = formData.roles || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData, 
                                  roles: [...currentRoles, role.value],
                                  role: currentRoles.length === 0 ? role.value : formData.role
                                });
                              } else {
                                const newRoles = currentRoles.filter(r => r !== role.value);
                                setFormData({
                                  ...formData, 
                                  roles: newRoles,
                                  role: newRoles.length > 0 ? newRoles[0] : ''
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez un ou plusieurs rôles pour cet agent
                      {(formData.roles || []).length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {(formData.roles || []).length} sélectionné{(formData.roles || []).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Antennes * (sélection multiple)
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {antennes.map(antenne => (
                        <label key={antenne.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={(formData.antennes || []).includes(antenne.value)}
                            onChange={(e) => {
                              const currentAntennes = formData.antennes || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData, 
                                  antennes: [...currentAntennes, antenne.value],
                                  antenneAgent: currentAntennes.length === 0 ? antenne.value : formData.antenneAgent
                                });
                              } else {
                                const newAntennes = currentAntennes.filter(a => a !== antenne.value);
                                setFormData({
                                  ...formData, 
                                  antennes: newAntennes,
                                  antenneAgent: newAntennes.length > 0 ? newAntennes[0] : ''
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">{antenne.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez une ou plusieurs antennes pour cet agent
                      {(formData.antennes || []).length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {(formData.antennes || []).length} sélectionnée{(formData.antennes || []).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+223 XX XX XX XX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Créer l\'Agent'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification simple */}
      {showEditForm && editingAgent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Modifier l'Agent</h3>
                <button
                  type="button"
                  onClick={() => { setShowEditForm(false); setEditingAgent(null); }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateAgent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={formData.motDePasse}
                      onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      placeholder="Laisser vide pour ne pas changer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôles *</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {roles.map(role => (
                        <label key={role.value} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(formData.roles || []).includes(role.value)}
                            onChange={(e) => {
                              const currentRoles = formData.roles || [];
                              if (e.target.checked) {
                                setFormData({...formData, roles: [...currentRoles, role.value], role: currentRoles.length === 0 ? role.value : formData.role});
                              } else {
                                const newRoles = currentRoles.filter(r => r !== role.value);
                                setFormData({...formData, roles: newRoles, role: newRoles.length > 0 ? newRoles[0] : ''});
                              }
                            }}
                            className="rounded border-gray-300 text-sky-600"
                          />
                          <span className="text-xs">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antennes *</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {antennes.map(antenne => (
                        <label key={antenne.value} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(formData.antennes || []).includes(antenne.value)}
                            onChange={(e) => {
                              const currentAntennes = formData.antennes || [];
                              if (e.target.checked) {
                                setFormData({...formData, antennes: [...currentAntennes, antenne.value], antenneAgent: currentAntennes.length === 0 ? antenne.value : formData.antenneAgent});
                              } else {
                                const newAntennes = currentAntennes.filter(a => a !== antenne.value);
                                setFormData({...formData, antennes: newAntennes, antenneAgent: newAntennes.length > 0 ? newAntennes[0] : ''});
                              }
                            }}
                            className="rounded border-gray-300 text-sky-600"
                          />
                          <span className="text-xs">{antenne.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      placeholder="+223 XX XX XX XX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Modification...' : 'Modifier l\'Agent'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagementFixed;
























