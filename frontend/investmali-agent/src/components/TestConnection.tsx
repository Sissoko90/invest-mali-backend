import React, { useState } from 'react';
import { agentAuthAPI, healthAPI } from '../services/api';

const TestConnection: React.FC = () => {
  const [results, setResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoints = async () => {
    setIsLoading(true);
    const testResults: any = {};

    // Test 1: Health check
    try {
      console.log('Testing health endpoint...');
      const healthResponse = await healthAPI.checkHealth();
      testResults.health = {
        success: true,
        status: healthResponse.status,
        data: healthResponse.data
      };
      console.log('Health check success:', healthResponse);
    } catch (error: any) {
      console.error('Health check failed:', error);
      testResults.health = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    // Test 2: Login with test credentials
    try {
      console.log('Testing login endpoint...');
      const loginResponse = await agentAuthAPI.login({
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      testResults.login = {
        success: true,
        status: loginResponse.status,
        data: loginResponse.data
      };
      console.log('Login test success:', loginResponse);
    } catch (error: any) {
      console.error('Login test failed:', error);
      testResults.login = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    // Test 3: Direct axios call to backend
    try {
      console.log('Testing direct backend connection...');
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          motdepasse: 'Admin@123'
        })
      });
      const data = await response.json();
      testResults.directBackend = {
        success: response.ok,
        status: response.status,
        data: data
      };
      console.log('Direct backend test:', { status: response.status, data });
    } catch (error: any) {
      console.error('Direct backend test failed:', error);
      testResults.directBackend = {
        success: false,
        error: error.message
      };
    }

    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Test de Connectivité Backend</h2>
      
      <button
        onClick={testEndpoints}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {isLoading ? 'Test en cours...' : 'Tester la Connectivité'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div key={testName} className="border rounded p-4">
              <h3 className="font-bold text-lg mb-2">
                {testName.toUpperCase()} - 
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? ' ✅ SUCCÈS' : ' ❌ ÉCHEC'}
                </span>
              </h3>
              
              <div className="bg-gray-100 p-3 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestConnection;
