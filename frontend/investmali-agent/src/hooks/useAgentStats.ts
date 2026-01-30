<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';

interface AgentStats {
  enCours: number;
  valides: number;
  enAttente: number;
  total: number;
  progressionPourcentage: number;
}

export const useAgentStats = () => {
  const [stats, setStats] = useState<AgentStats>({
    enCours: 0,
    valides: 0,
    enAttente: 0,
    total: 0,
    progressionPourcentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAgentAuth();

  const fetchStats = async () => {
      if (!agent) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Appel à l'API pour récupérer les statistiques de l'agent
        const token = localStorage.getItem('investmali_agent_token');
        
        // Utiliser la fonction utilitaire centralisée
        const { getApiBaseUrl } = await import('../utils/apiUrl');
        const apiUrl = getApiBaseUrl();
        
        
        const response = await fetch(`${apiUrl}/agent/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Adapter les données selon la structure de l'API existante
        const statsData: AgentStats = {
          enCours: data.pendingApplications || 0,
          valides: data.approvedApplications || 0,
          enAttente: data.rejectedApplications || 0,
          total: data.totalApplications || 0,
          progressionPourcentage: 0
        };

        // Calculer la progression si pas fournie par l'API
        if (statsData.progressionPourcentage === 0 && statsData.total > 0) {
          statsData.progressionPourcentage = Math.round((statsData.valides / statsData.total) * 100);
        }

        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        
        // Données par défaut en cas d'erreur
        setStats({
          enCours: 0,
          valides: 0,
          enAttente: 0,
          total: 0,
          progressionPourcentage: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchStats();
  }, [agent]);

  return { stats, isLoading, error, refetch: fetchStats };
};
=======
import { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';

interface AgentStats {
  enCours: number;
  valides: number;
  enAttente: number;
  total: number;
  progressionPourcentage: number;
}

export const useAgentStats = () => {
  const [stats, setStats] = useState<AgentStats>({
    enCours: 0,
    valides: 0,
    enAttente: 0,
    total: 0,
    progressionPourcentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAgentAuth();

  const fetchStats = async () => {
      if (!agent) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Appel à l'API pour récupérer les statistiques de l'agent
        const token = localStorage.getItem('investmali_agent_token');
        
        // Utiliser la fonction utilitaire centralisée
        const { getApiBaseUrl } = await import('../utils/apiUrl');
        const apiUrl = getApiBaseUrl();
        
        
        const response = await fetch(`${apiUrl}/agent/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Adapter les données selon la structure de l'API existante
        const statsData: AgentStats = {
          enCours: data.pendingApplications || 0,
          valides: data.approvedApplications || 0,
          enAttente: data.rejectedApplications || 0,
          total: data.totalApplications || 0,
          progressionPourcentage: 0
        };

        // Calculer la progression si pas fournie par l'API
        if (statsData.progressionPourcentage === 0 && statsData.total > 0) {
          statsData.progressionPourcentage = Math.round((statsData.valides / statsData.total) * 100);
        }

        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        
        // Données par défaut en cas d'erreur
        setStats({
          enCours: 0,
          valides: 0,
          enAttente: 0,
          total: 0,
          progressionPourcentage: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchStats();
  }, [agent]);

  return { stats, isLoading, error, refetch: fetchStats };
};
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
