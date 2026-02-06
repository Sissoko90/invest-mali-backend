/**
 * Utilitaire pour obtenir l'URL de base de l'API selon l'environnement
 * Centralisé pour éviter la duplication de code
 */

export const getApiBaseUrl = (): string => {
  // 1. Détection automatique selon le domaine (PRIORITÉ)
  const hostname = window.location.hostname;
  
  if ( hostname==='agent-investmali.com') {
    return 'http://agent-investmali.com/api/v1';
  }
  if (hostname === '192.168.2.4') {
    return 'http://192.168.2.4/api/v1';
  }
  
  if (hostname === 'agent.formalisation.ml') {
    return 'https://agent.formalisation.ml/api/v1';
  }
  
  if (hostname === 'investmali-agent.abdatytch.com' || hostname === 'www.investmali-agent.abdatytch.com') {
    return 'https://investmali-agent.abdatytch.com/api/v1';
  }
  
  // 2. Variable d'environnement en fallback
  const envUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_USER_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 3. Fallback développement
  return 'http://localhost:8080/api/v1';
};

export const getOrangeMoneyApiUrl = (): string => {
  return `${getApiBaseUrl()}/orange-money/v2`;
};
