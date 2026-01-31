import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, Shield, AlertCircle, CheckCircle } from './icons';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, PencilSquareIcon, TrashIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
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
  
  // Pagination et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal de détails agent
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsAgent, setDetailsAgent] = useState<AgentResponse | null>(null);
  
  // Modal de confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AgentResponse | null>(null);
  
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

  // Filtrage et pagination des agents
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(agent => 
      agent.prenom.toLowerCase().includes(query) ||
      agent.nom.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query) ||
      (agent.telephone && agent.telephone.includes(query)) ||
      agent.role.toLowerCase().includes(query) ||
      (agent.antenneAgent && agent.antenneAgent.toLowerCase().includes(query))
    );
  }, [agents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgents, currentPage, itemsPerPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    // La confirmation est maintenant gérée par la modale showDeleteModal
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
          <p className="mt-4 text-gray-600 text-lg">Chargement des agents...</p>
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
          <p className="text-lg text-slate-500">Gérer les agents et leurs permissions</p>
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
          className="px-4 py-2 bg-sky-600 text-white text-lg font-medium rounded-lg hover:bg-sky-700 transition-colors flex items-center space-x-2"
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
          <span className="text-lg">{notification.message}</span>
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
            <p className="text-lg text-slate-500">Total Agents</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{agents.filter(agent => agent.actif).length}</p>
            <p className="text-lg text-slate-500">Agents Actifs</p>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{roles.length}</p>
            <p className="text-lg text-slate-500">Rôles Disponibles</p>
          </div>
        </div>
      </div>

      {/* Liste des agents - Table simple */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-700">Liste des Agents</h2>
          
          {/* Barre de recherche */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
        </div>
    
        {/* Liste des agents en cards */}
        <div className="p-4">
          {paginatedAgents.length === 0 ? (
            <div className="text-center py-12">
              <UserCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun agent trouvé</p>
              {searchQuery && (
                <p className="text-gray-400 text-sm mt-2">Essayez de modifier votre recherche</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedAgents.map((agent) => (
                <div 
                  key={agent.id} 
                  className={`bg-white border rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${
                    agent.actif ? 'border-gray-200' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  {/* Header avec avatar et statut */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        agent.actif ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gray-400'
                      }`}>
                        {agent.prenom.charAt(0)}{agent.nom.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {agent.prenom} {agent.nom}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          agent.actif 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${agent.actif ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {agent.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations de contact */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                    {agent.telephone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{agent.telephone}</span>
                      </div>
                    )}
                    {agent.antenneAgent && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{agent.antennes && agent.antennes.length > 1 
                          ? `${agent.antennes[0]} +${agent.antennes.length - 1}` 
                          : agent.antenneAgent}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rôles */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Rôles</p>
                    <div className="flex flex-wrap gap-1">
                      {(agent.roles && agent.roles.length > 0 ? agent.roles : [agent.role]).slice(0, 2).map((role, index) => (
                        <span 
                          key={index} 
                          className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200"
                        >
                          {role.replace('AGENT_', '').replace('_', ' ')}
                        </span>
                      ))}
                      {((agent.roles && agent.roles.length > 2) || (agent.antennes && agent.antennes.length > 1)) && (
                        <button
                          onClick={() => { setDetailsAgent(agent); setShowDetailsModal(true); }}
                          className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          Voir tout
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleAgentStatus(agent)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        agent.actif 
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {agent.actif ? 'Désactiver' : 'Activer'}
                    </button>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => { setAgentToDelete(agent); setShowDeleteModal(true); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {filteredAgents.length === 0 ? (
              <span>Aucun agent trouvé</span>
            ) : (
              <span>
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAgents.length)} sur {filteredAgents.length} agent{filteredAgents.length > 1 ? 's' : ''}
                {searchQuery && ` (filtrés sur ${agents.length} total)`}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-sky-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
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
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                          <span className="text-lg">{role.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Sélectionnez un ou plusieurs rôles pour cet agent
                      {(formData.roles || []).length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {(formData.roles || []).length} sélectionné{(formData.roles || []).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                          <span className="text-lg">{antenne.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Sélectionnez une ou plusieurs antennes pour cet agent
                      {(formData.antennes || []).length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {(formData.antennes || []).length} sélectionnée{(formData.antennes || []).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                    <label className="block text-lg font-medium text-gray-700 mb-2">
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
                    className="px-6 py-2 bg-sky-600 text-white text-lg font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Créer l\'Agent'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification - Design professionnel */}
      {showEditForm && editingAgent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header avec avatar */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                    {editingAgent.prenom.charAt(0)}{editingAgent.nom.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Modifier l'agent
                    </h3>
                    <p className="text-sky-100 text-sm">
                      {editingAgent.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowEditForm(false); setEditingAgent(null); }}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Formulaire scrollable */}
            <form onSubmit={handleUpdateAgent} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Section Informations personnelles */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <UserCircleIcon className="w-5 h-5 mr-2 text-sky-600" />
                    Informations personnelles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section Contact */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <EnvelopeIcon className="w-5 h-5 mr-2 text-sky-600" />
                    Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        placeholder="+223 XX XX XX XX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                      <input
                        type="text"
                        value={formData.adresse}
                        onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Sécurité */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Sécurité
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={formData.motDePasse}
                      onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                      placeholder="Laisser vide pour conserver le mot de passe actuel"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Laissez vide si vous ne souhaitez pas modifier le mot de passe</p>
                  </div>
                </div>

                {/* Section Rôles et Antennes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-sky-600" />
                    Rôles et Affectations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Rôles <span className="text-red-500">*</span>
                        <span className="ml-2 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">
                          {(formData.roles || []).length} sélectionné(s)
                        </span>
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                        {roles.map(role => (
                          <label key={role.value} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
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
                              className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="text-sm text-gray-700">{role.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Antennes <span className="text-red-500">*</span>
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {(formData.antennes || []).length} sélectionnée(s)
                        </span>
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                        {antennes.map(antenne => (
                          <label key={antenne.value} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
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
                              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{antenne.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer avec actions */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setShowEditForm(false); setEditingAgent(null); }}
                  className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails agent */}
      {showDetailsModal && detailsAgent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    detailsAgent.actif ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gray-400'
                  }`}>
                    {detailsAgent.prenom.charAt(0)}{detailsAgent.nom.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">
                      {detailsAgent.prenom} {detailsAgent.nom}
                    </h3>
                    <p className="text-sm text-gray-500">{detailsAgent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDetailsModal(false); setDetailsAgent(null); }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rôles complets */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-sky-600" />
                  Rôles ({(detailsAgent.roles || [detailsAgent.role]).length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(detailsAgent.roles && detailsAgent.roles.length > 0 ? detailsAgent.roles : [detailsAgent.role]).map((role, index) => (
                    <span 
                      key={index} 
                      className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200"
                    >
                      {role.replace('AGENT_', '').replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Antennes complètes */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-2 text-green-600" />
                  Antennes ({(detailsAgent.antennes || [detailsAgent.antenneAgent]).filter(Boolean).length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(detailsAgent.antennes && detailsAgent.antennes.length > 0 ? detailsAgent.antennes : [detailsAgent.antenneAgent]).filter(Boolean).map((antenne, index) => (
                    <span 
                      key={index} 
                      className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200"
                    >
                      {antenne}
                    </span>
                  ))}
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {detailsAgent.telephone && (
                  <div className="flex items-center text-sm">
                    <PhoneIcon className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-700">{detailsAgent.telephone}</span>
                  </div>
                )}
                {detailsAgent.adresse && (
                  <div className="flex items-center text-sm">
                    <MapPinIcon className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-700">{detailsAgent.adresse}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <span className={`w-2 h-2 rounded-full mr-3 ${detailsAgent.actif ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-gray-700">{detailsAgent.actif ? 'Agent actif' : 'Agent inactif'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowDetailsModal(false); setDetailsAgent(null); }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => { 
                    setShowDetailsModal(false); 
                    handleEditAgent(detailsAgent); 
                  }}
                  className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg font-medium transition-colors"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && agentToDelete && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              {/* Icône d'alerte */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Titre et message */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir supprimer définitivement l'agent
                </p>
                <p className="font-semibold text-gray-900 mt-1">
                  {agentToDelete.prenom} {agentToDelete.nom}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ({agentToDelete.email})
                </p>
              </div>

              {/* Avertissement */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Cette action est irréversible</p>
                    <p className="mt-1">Si cet agent est assigné à des entreprises, elles seront automatiquement désassignées.</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setAgentToDelete(null); }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (agentToDelete) {
                      setShowDeleteModal(false);
                      await handleDeleteAgent(agentToDelete);
                      setAgentToDelete(null);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagementFixed;
























