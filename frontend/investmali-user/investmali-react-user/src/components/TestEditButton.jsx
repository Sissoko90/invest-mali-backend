import React, { useState } from 'react';

// Composant de test pour vérifier le fonctionnement du bouton Modifier
const TestEditButton = () => {
  const [editMode, setEditMode] = useState(false);
  const [testData, setTestData] = useState({
    businessName: 'TMT',
    legalForm: 'SA',
    businessType: 'SOCIETE',
    domaineActivite: 'TRANSPORT'
  });

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-4">🧪 Test du Bouton Modifier</h3>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nom de l'entreprise</label>
            {editMode ? (
              <input
                type="text"
                value={testData.businessName}
                onChange={(e) => setTestData(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="font-medium">{testData.businessName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Forme juridique</label>
            {editMode ? (
              <select
                value={testData.legalForm}
                onChange={(e) => setTestData(prev => ({ ...prev, legalForm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="SA">SA</option>
                <option value="SARL">SARL</option>
                <option value="E_I">Entreprise Individuelle</option>
              </select>
            ) : (
              <p className="font-medium">{testData.legalForm}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2 border-t">
        <div className="text-xs text-gray-500 mr-auto flex items-center">
          Mode édition: <span className={`ml-1 px-2 py-1 rounded text-xs ${editMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {editMode ? 'ON' : 'OFF'}
          </span>
        </div>
        
        {editMode ? (
          <>
            <button
              onClick={() => {
                console.log('💾 Sauvegarde des données:', testData);
                setEditMode(false);
                alert('Données sauvegardées !');
              }}
              className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 text-sm"
            >
              Enregistrer
            </button>
            <button
              onClick={() => {
                console.log('❌ Annulation des modifications');
                setEditMode(false);
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
            >
              Annuler
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              console.log('✏️ Activation du mode édition');
              setEditMode(true);
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm transition-colors"
            title="Cliquez pour modifier les informations"
          >
            ✏️ Modifier
          </button>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium text-blue-800">Instructions de test :</p>
        <ul className="list-disc list-inside text-blue-700 mt-1">
          <li>Cliquez sur "Modifier" pour activer le mode édition</li>
          <li>Modifiez les champs</li>
          <li>Cliquez sur "Enregistrer" ou "Annuler"</li>
          <li>Vérifiez les logs dans la console</li>
        </ul>
      </div>
    </div>
  );
};

export default TestEditButton;

