import React, { useState } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { 
  UserIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

interface Dossier {
  id: string;
  reference: string;
  nom: string;
  sigle?: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'INCOMPLET' | 'VALIDE' | 'REJETE';
  dateCreation: string;
  division?: string;
  antenne?: string;
  documentsManquants: string[];
  personneId?: string;
  entrepriseId?: string;
}

interface DossierCreationFormProps {
  onDossierCreated: (dossier: Dossier) => void;
}

const DossierCreationForm: React.FC<DossierCreationFormProps> = ({ onDossierCreated }) => {
  const { agent } = useAgentAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Informations personne
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    // Informations entreprise
    nomEntreprise: '',
    sigleEntreprise: '',
    formeJuridique: '',
    domaineActivite: '',
    // Localisation
    division: agent?.division || '',
    antenne: agent?.antenne || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Générer une référence unique
      const reference = `CE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
      
      const newDossier: Dossier = {
        id: `temp-${Date.now()}`,
        reference,
        nom: formData.nomEntreprise,
        sigle: formData.sigleEntreprise,
        statut: 'NOUVEAU',
        dateCreation: new Date().toISOString(),
        division: formData.division,
        antenne: formData.antenne,
        documentsManquants: [
          'Pièce d\'identité du représentant',
          'Statuts de l\'entreprise',
          'Certificat de résidence'
        ]
      };

      // Simuler la création (à remplacer par l'API réelle)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onDossierCreated(newDossier);
      
      // Réinitialiser le formulaire
      setFormData({
        prenom: '',
        nom: '',
        telephone: '',
        email: '',
        nomEntreprise: '',
        sigleEntreprise: '',
        formeJuridique: '',
        domaineActivite: '',
        division: agent?.division || '',
        antenne: agent?.antenne || ''
      });
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informations de la personne */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <UserIcon className="h-5 w-5 text-mali-emerald mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Informations du représentant</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <input
              type="text"
              required
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone *
            </label>
            <input
              type="tel"
              required
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Informations de l'entreprise */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BuildingOfficeIcon className="h-5 w-5 text-mali-emerald mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Informations de l'entreprise</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              value={formData.nomEntreprise}
              onChange={(e) => setFormData({ ...formData, nomEntreprise: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sigle (optionnel)
            </label>
            <input
              type="text"
              value={formData.sigleEntreprise}
              onChange={(e) => setFormData({ ...formData, sigleEntreprise: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forme juridique *
            </label>
            <select
              required
              value={formData.formeJuridique}
              onChange={(e) => setFormData({ ...formData, formeJuridique: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="SARL">SARL</option>
              <option value="SA">SA</option>
              <option value="E_I">Entreprise Individuelle</option>
              <option value="SNC">SNC</option>
              <option value="SCS">SCS</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domaine d'activité non réglementé *
            </label>
            <select
              required
              value={formData.domaineActivite}
              onChange={(e) => setFormData({ ...formData, domaineActivite: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="COMMERCE">Commerce</option>
              <option value="SERVICES">Services</option>
              <option value="INDUSTRIE">Industrie</option>
              <option value="AGRICULTURE">Agriculture</option>
              <option value="TRANSPORT">Transport</option>
              <option value="CONSTRUCTION">Construction</option>
            </select>
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MapPinIcon className="h-5 w-5 text-mali-emerald mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Localisation</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division *
            </label>
            <input
              type="text"
              required
              value={formData.division}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
              placeholder="Ex: Bamako District"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Antenne *
            </label>
            <input
              type="text"
              required
              value={formData.antenne}
              onChange={(e) => setFormData({ ...formData, antenne: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
              placeholder="Ex: Antenne Centrale"
            />
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-mali-emerald text-white rounded-lg hover:bg-mali-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Création...
            </>
          ) : (
            <>
              <DocumentPlusIcon className="h-4 w-4 mr-2" />
              Créer le dossier
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DossierCreationForm;
