import React from 'react';

// Composant de debug pour identifier les objets rendus directement
const DebugComponent = () => {
  // Exemple d'objet avec key, value, label
  const testObject = { key: 'test', value: 'testValue', label: 'Test Label' };
  
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="text-red-800 font-bold mb-2">Debug Component</h3>
      
      {/* ✅ CORRECT - Rendu des propriétés de l'objet */}
      <div className="mb-2">
        <p><strong>Correct:</strong></p>
        <p>Key: {testObject.key}</p>
        <p>Value: {testObject.value}</p>
        <p>Label: {testObject.label}</p>
      </div>
      
      {/* ❌ INCORRECT - Ceci causerait l'erreur "Objects are not valid as a React child" */}
      {/* <p>Incorrect: {testObject}</p> */}
      
      {/* ✅ CORRECT - Conversion en string pour debug */}
      <div>
        <p><strong>Object as JSON:</strong></p>
        <pre className="text-xs bg-white p-2 rounded">
          {JSON.stringify(testObject, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugComponent;
