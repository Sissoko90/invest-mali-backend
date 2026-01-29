import React from 'react';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRateLimitState } from '../utils/rateLimitHandler';

/**
 * Composant d'alerte pour informer l'utilisateur des limitations de taux
 */
const RateLimitAlert: React.FC = () => {
  const rateLimitState = useRateLimitState();
  const [timeLeft, setTimeLeft] = React.useState(0);

  // Countdown timer
  React.useEffect(() => {
    if (!rateLimitState.isRateLimited) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(rateLimitState.retryAfter);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.isRateLimited, rateLimitState.retryAfter]);

  if (!rateLimitState.isRateLimited) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded-md shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-primary-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800">
              Trop de requêtes
            </h3>
            <div className="mt-2 text-sm text-primary-700">
              <p>
                Le serveur limite temporairement les requêtes pour éviter la surcharge.
              </p>
              {timeLeft > 0 && (
                <div className="mt-2 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    Retry dans: {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="text-xs text-primary-600">
                Les requêtes reprendront automatiquement.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitAlert;
























