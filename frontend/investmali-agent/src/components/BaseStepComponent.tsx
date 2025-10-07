import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import { DemandeEntreprise } from '../types';

interface BaseStepProps {
  stepName: string;
  stepTitle: string;
  stepDescription: string;
  onDossierUpdate?: (dossier: any) => void;
  children?: React.ReactNode;
}

const BaseStepComponent: React.FC<BaseStepProps> = ({ 
  stepName, 
  stepTitle, 
  stepDescription, 
  onDossierUpdate,
  children 
}) => {
  const { agent, canEditStep } = useAgentAuth();
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const canEdit = canEditStep(stepName);

  // Charger les vraies données depuis la base de données
  const loadDemandesFromDatabase = async () => {
    setIsLoading(true);
    try {
      console.log(`🔄 Chargement des vraies données ${stepName} depuis la base de données...`);
      
      // Charger toutes les entreprises depuis l'API
      const response = await entreprisesAPI.list({
        page: 0,
        size: 100
      });
      
      const allEntreprises = response.data?.content || response.data?.data || response.data?.rows || response.data || [];
      console.log(`📊 Total entreprises chargées depuis DB pour ${stepName}:`, allEntreprises.length);
      
      // Filtrer celles qui sont à cette étape
      const entreprisesForStep = allEntreprises.filter((entreprise: any) => {
        const etapeActuelle = entreprise.etapeActuelle || entreprise.etape_actuelle || entreprise.etapeValidation || entreprise.etape_validation;
        const isForThisStep = etapeActuelle === stepName;
        
        if (isForThisStep) {
          console.log(`✅ Entreprise ${stepName} trouvée: ${entreprise.nom} (${entreprise.id})`);
        }
        
        return isForThisStep;
      });
      
      console.log(`🎯 Entreprises pour ${stepName} trouvées:`, entreprisesForStep.length);
      
      // Convertir au format attendu
      const demandesFormatted = entreprisesForStep.map((entreprise: any) => {
        const gerantPersonne = entreprise.gerant || entreprise.gerantPersonne || {};
        
        return {
          id: entreprise.id,
          nom: entreprise.nom || 'Nom inconnu',
          sigle: entreprise.sigle || '',
          formeJuridique: entreprise.formeJuridique || entreprise.forme_juridique || 'Non spécifiée',
          typeEntreprise: entreprise.typeEntreprise || entreprise.type_entreprise || 'Non spécifié',
          dateCreation: entreprise.dateCreation || entreprise.date_creation || new Date().toISOString(),
          statut: entreprise.statut || 'EN_COURS',
          demandeur: {
            nom: gerantPersonne.nom || 'Nom inconnu',
            prenom: gerantPersonne.prenom || 'Prénom inconnu',
            email: gerantPersonne.email || 'Email inconnu',
            telephone: gerantPersonne.telephone1 || gerantPersonne.telephone || 'Téléphone inconnu'
          },
          etapeActuelle: stepName,
          division: entreprise.division?.nom || entreprise.localisation || '',
          antenne: entreprise.antenne || ''
        } as DemandeEntreprise;
      });
      
      setDemandes(demandesFormatted);
      console.log(`✅ Vraies données ${stepName} chargées:`, demandesFormatted.length);
      
    } catch (error) {
      console.error(`❌ Erreur chargement données ${stepName}:`, error);
      setDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger au démarrage
  useEffect(() => {
    loadDemandesFromDatabase();
  }, [stepName]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Étape {stepTitle}</h2>
            <p className="text-gray-600 mt-1">
              {stepDescription} - Agent: {agent?.firstName} {agent?.lastName}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log(`🔄 Rechargement des vraies données ${stepName}...`);
                  loadDemandesFromDatabase();
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                title={`Recharger les vraies données ${stepName}`}
              >
                🔄 Reload DB
              </button>
              <span className="text-xs text-gray-500 self-center">
                {demandes.length} demande(s) trouvée(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des vraies données...</p>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune entreprise n'est actuellement à l'étape {stepName}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Demandes à traiter ({demandes.length})
              </h3>
              {demandes.map((demande) => (
                <div key={demande.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{demande.nom}</h4>
                      <p className="text-sm text-gray-600">{demande.formeJuridique} - {demande.typeEntreprise}</p>
                      <p className="text-sm text-gray-500">
                        Demandeur: {demande.demandeur.prenom} {demande.demandeur.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        Email: {demande.demandeur.email} | Tél: {demande.demandeur.telephone}
                      </p>
                      <p className="text-sm text-gray-500">
                        Date création: {new Date(demande.dateCreation).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      {canEdit && (
                        <>
                          <button
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            ✅ Traiter
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            👁️ Détails
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Contenu personnalisé */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseStepComponent;
