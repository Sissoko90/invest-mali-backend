import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import divisionService from '../services/divisionService';

interface Division {
  id: string;
  nom: string;
  code: string;
  divisionType: 'REGION' | 'CERCLE' | 'ARRONDISSEMENT' | 'COMMUNE' | 'QUARTIER';
  parent?: Division;
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

  // Construire le chemin hiérarchique complet
  const buildHierarchyPath = (division: Division): string => {
    const path: string[] = [];
    let current: Division | undefined = division;
    
    while (current) {
      path.unshift(current.nom);
      current = current.parent;
    }
    
    return path.join(' → ');
  };

  // Recherche avec debounce
  const searchDivisions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const divisions = await divisionService.searchDivisions(searchQuery, filterType as any);
      
      // Limiter à 50 résultats pour éviter la surcharge
      const limitedResults = divisions.slice(0, 50);
      
      setResults(limitedResults);
      setIsOpen(limitedResults.length > 0);
      setSelectedIndex(-1);
      
      if (limitedResults.length === 0) {
        setError('Aucune localisation trouvée');
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError('Erreur lors de la recherche');
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
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
    }, 300);

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
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${disabled ? 'text-gray-500' : 'text-gray-900'}
          `}
        />
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
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
                  hover:bg-blue-50 transition-colors duration-150
                  ${index === selectedIndex ? 'bg-blue-50' : ''}
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
                    <div className="text-xs text-blue-600 mt-1">
                      {DIVISION_LABELS[division.divisionType]} • Code: {division.code}
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
