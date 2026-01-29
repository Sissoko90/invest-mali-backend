import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import divisionService from '../services/divisionService';

interface Division {
  id: any;
  nom: any;
  code: any;
  divisionType: string;
  parent?: Division | null;
}

interface DivisionSearchInputProps {
  placeholder?: string;
  onSelect: (division: Division) => void;
  filterType?: string | null;
  disabled?: boolean;
  className?: string;
}

// Icônes par type de division
const DIVISION_ICONS: Record<string, string> = {
  REGION: '🏛️',
  CERCLE: '🏘️', 
  ARRONDISSEMENT: '🏙️',
  COMMUNE: '🏘️',
  QUARTIER: '🏠'
};

// Labels français pour les types
const DIVISION_LABELS: Record<string, string> = {
  REGION: 'Région',
  CERCLE: 'Cercle',
  ARRONDISSEMENT: 'Arrondissement', 
  COMMUNE: 'Commune',
  QUARTIER: 'Quartier'
};

// Cache simple pour éviter les requêtes répétées
const searchCache = new Map<string, Division[]>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

const DivisionSearchInput: React.FC<DivisionSearchInputProps> = ({
  placeholder = "Rechercher une localisation...",
  onSelect,
  filterType,
  disabled = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Construire le chemin hiérarchique complet
  const buildHierarchyPath = (division: Division): string => {
    const path: string[] = [];
    let current: Division | undefined | null = division;
    
    while (current) {
      path.unshift(current.nom);
      current = current.parent;
    }
    
    return path.join(' → ');
  };

  // Trouver la région racine pour différencier les divisions avec le même nom
  const findRootRegion = (division: Division): string => {
    let current: Division | undefined | null = division;
    let rootRegion = ''; // Pas de valeur par défaut
    
    
    // Détection prioritaire pour Bamako par le code (plus fiable)
    if (division.code) {
      const code = division.code;
      // Pattern pour tous les codes de Bamako : 000X où X = 1-9, ou 00X où X = 1-9
      if (/^000[1-9]/.test(code) || /^00[1-9]/.test(code)) {
        console.log('✅ Détection Bamako par code pattern:', division.code);
        return 'Bamako District';
      }
    }
    
    // Remonter jusqu'à la région racine
    while (current) {
      if (current.divisionType === 'REGION') {
        rootRegion = current.nom;
        break;
      }
      // Cas spécial pour Bamako : détecter si on est dans la hiérarchie de Bamako
      if (current.nom && current.nom.toLowerCase().includes('bamako')) {
        rootRegion = 'Bamako District';
        break;
      }
      // Détecter Bamako par le code dans la hiérarchie
      if (current.code && current.code.startsWith('0004')) {
        rootRegion = 'Bamako District';
        break;
      }
      current = current.parent;
    }
    
    // Si on n'a pas trouvé de région, vérifier si le nom contient "bamako"
    if (!rootRegion && division.nom && division.nom.toLowerCase().includes('bamako')) {
      rootRegion = 'Bamako District';
    }
    
    // Détection étendue pour Bamako : tous les codes possibles
    if (!rootRegion && division.code) {
      const code = division.code;
      if (code.startsWith('0001') || code.startsWith('0002') || code.startsWith('0003') ||
          code.startsWith('0004') || code.startsWith('0005') || code.startsWith('0006') ||
          code.startsWith('0007') || code.startsWith('0008') || code.startsWith('0009') ||
          code.startsWith('00010') || code.startsWith('00020') || code.startsWith('00030') ||
          code.startsWith('00040') || code.startsWith('00050') || code.startsWith('00060') ||
          code.startsWith('00070') || code.startsWith('00080') || code.startsWith('00090')) {
        rootRegion = 'Bamako District';
      }
    }
    
    // Si aucune région trouvée, utiliser "Mali" comme fallback
    const finalRegion = rootRegion || 'Mali';
    return finalRegion;
  };

  // Vérifier si le cache est valide
  const isCacheValid = (cacheKey: string): boolean => {
    const timestamp = cacheTimestamps.get(cacheKey);
    return timestamp ? (Date.now() - timestamp) < CACHE_EXPIRY : false;
  };

  // Recherche avec debounce et cache optimisé
  const searchDivisions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Vérifier le cache d'abord
    const cacheKey = `${searchQuery.toLowerCase()}_${filterType || 'all'}`;
    if (searchCache.has(cacheKey) && isCacheValid(cacheKey)) {
      const cachedResults = searchCache.get(cacheKey)!;
      setResults(cachedResults);
      setIsOpen(cachedResults.length > 0);
      setSelectedIndex(-1);
      setError(cachedResults.length === 0 ? 'Aucune localisation trouvée' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Créer un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();

    try {
      const divisions = await divisionService.searchDivisions(searchQuery, filterType as any);
      
      // ✅ OPTIMISÉ : Limiter à 20 résultats au lieu de 50
      const limitedResults = divisions.slice(0, 20);
      
      // Mettre en cache les résultats
      searchCache.set(cacheKey, limitedResults);
      cacheTimestamps.set(cacheKey, Date.now());
      
      // Nettoyer le cache si il devient trop grand (max 100 entrées)
      if (searchCache.size > 100) {
        const oldestKey = searchCache.keys().next().value;
        if (oldestKey) {
          searchCache.delete(oldestKey);
          cacheTimestamps.delete(oldestKey);
        }
      }
      
      setResults(limitedResults);
      setIsOpen(limitedResults.length > 0);
      setSelectedIndex(-1);
      
      if (limitedResults.length === 0) {
        setError('Aucune localisation trouvée');
      }
    } catch (err: any) {
      // Ignorer les erreurs d'annulation
      if (err.name === 'AbortError') {
        return;
      }
      
      console.error('Erreur lors de la recherche:', err);
      setError('Erreur lors de la recherche');
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Debounce de la recherche
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        searchDivisions(query.trim());
      } else {
        setResults([]);
        setIsOpen(false);
        setError(null);
      }
    }, 800); // ✅ OPTIMISÉ : Augmenté de 300ms à 800ms pour réduire les requêtes

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [query, filterType]);

  // Gestion des touches clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Sélection d'une division
  const handleSelect = (division: Division) => {
    setQuery(division.nom);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(division);
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input de recherche */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          ) : (
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${disabled ? 'text-gray-500' : 'text-gray-900'}
          `}
        />
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {error ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {error}
            </div>
          ) : (
            results.map((division, index) => (
              <div
                key={division.id}
                onClick={() => handleSelect(division)}
                className={`
                  px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                  hover:bg-primary-50 transition-colors duration-150
                  ${index === selectedIndex ? 'bg-primary-50' : ''}
                `}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-0.5">
                    {DIVISION_ICONS[division.divisionType] || '📍'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {division.nom}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {buildHierarchyPath(division)}
                    </div>
                    <div className="text-xs text-primary-600 mt-1">
                      {DIVISION_LABELS[division.divisionType]} • {findRootRegion(division)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DivisionSearchInput;
























