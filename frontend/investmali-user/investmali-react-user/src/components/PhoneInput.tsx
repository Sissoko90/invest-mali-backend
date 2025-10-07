import React, { useState } from 'react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// Composant pour afficher le drapeau avec fallback
const FlagIcon: React.FC<{ countryCode: string; className?: string }> = ({ countryCode, className = "w-6 h-4" }) => {
  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      alt={`Drapeau ${countryCode}`}
      className={`${className} object-cover rounded-sm`}
      onError={(e) => {
        // Fallback en cas d'erreur de chargement
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent && !parent.querySelector('.flag-fallback')) {
          const fallback = document.createElement('div');
          fallback.className = `flag-fallback ${className} bg-gray-200 rounded-sm flex items-center justify-center text-xs font-bold text-gray-600`;
          fallback.textContent = countryCode;
          parent.appendChild(fallback);
        }
      }}
    />
  );
};

const countries: Country[] = [
  // Mali en premier (pays par défaut)
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: 'ML' },
  
  // Pays d'Afrique de l'Ouest (priorité)
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: 'SN' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: 'CI' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: 'BF' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: 'NE' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: 'GN' },
  { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: 'MR' },
  { code: 'GW', name: 'Guinée-Bissau', dialCode: '+245', flag: 'GW' },
  { code: 'LR', name: 'Libéria', dialCode: '+231', flag: 'LR' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: 'SL' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: 'GH' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: 'TG' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: 'BJ' },
  { code: 'NG', name: 'Nigéria', dialCode: '+234', flag: 'NG' },
  
  // Afrique du Nord
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: 'DZ' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: 'MA' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: 'TN' },
  { code: 'LY', name: 'Libye', dialCode: '+218', flag: 'LY' },
  { code: 'EG', name: 'Égypte', dialCode: '+20', flag: 'EG' },
  { code: 'SD', name: 'Soudan', dialCode: '+249', flag: 'SD' },
  
  // Afrique Centrale
  { code: 'TD', name: 'Tchad', dialCode: '+235', flag: 'TD' },
  { code: 'CF', name: 'République Centrafricaine', dialCode: '+236', flag: 'CF' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: 'CM' },
  { code: 'GQ', name: 'Guinée Équatoriale', dialCode: '+240', flag: 'GQ' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: 'GA' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: 'CG' },
  { code: 'CD', name: 'République Démocratique du Congo', dialCode: '+243', flag: 'CD' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: 'AO' },
  
  // Afrique de l'Est
  { code: 'ET', name: 'Éthiopie', dialCode: '+251', flag: 'ET' },
  { code: 'ER', name: 'Érythrée', dialCode: '+291', flag: 'ER' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: 'DJ' },
  { code: 'SO', name: 'Somalie', dialCode: '+252', flag: 'SO' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: 'KE' },
  { code: 'UG', name: 'Ouganda', dialCode: '+256', flag: 'UG' },
  { code: 'TZ', name: 'Tanzanie', dialCode: '+255', flag: 'TZ' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: 'RW' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: 'BI' },
  
  // Afrique Australe
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: 'ZA' },
  { code: 'NA', name: 'Namibie', dialCode: '+264', flag: 'NA' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: 'BW' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: 'ZW' },
  { code: 'ZM', name: 'Zambie', dialCode: '+260', flag: 'ZM' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: 'MW' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: 'MZ' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268', flag: 'SZ' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: 'LS' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: 'MG' },
  { code: 'MU', name: 'Maurice', dialCode: '+230', flag: 'MU' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: 'SC' },
  { code: 'KM', name: 'Comores', dialCode: '+269', flag: 'KM' },
  
  // Europe
  { code: 'FR', name: 'France', dialCode: '+33', flag: 'FR' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: 'GB' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: 'DE' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: 'ES' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: 'IT' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: 'PT' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: 'NL' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: 'BE' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: 'CH' },
  { code: 'AT', name: 'Autriche', dialCode: '+43', flag: 'AT' },
  { code: 'SE', name: 'Suède', dialCode: '+46', flag: 'SE' },
  { code: 'NO', name: 'Norvège', dialCode: '+47', flag: 'NO' },
  { code: 'DK', name: 'Danemark', dialCode: '+45', flag: 'DK' },
  { code: 'FI', name: 'Finlande', dialCode: '+358', flag: 'FI' },
  { code: 'PL', name: 'Pologne', dialCode: '+48', flag: 'PL' },
  { code: 'CZ', name: 'République Tchèque', dialCode: '+420', flag: 'CZ' },
  { code: 'RU', name: 'Russie', dialCode: '+7', flag: 'RU' },
  
  // Amérique du Nord
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: 'US' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: 'CA' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: 'MX' },
  
  // Amérique du Sud
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: 'BR' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: 'AR' },
  { code: 'CL', name: 'Chili', dialCode: '+56', flag: 'CL' },
  { code: 'CO', name: 'Colombie', dialCode: '+57', flag: 'CO' },
  { code: 'PE', name: 'Pérou', dialCode: '+51', flag: 'PE' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: 'VE' },
  
  // Asie
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: 'CN' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: 'JP' },
  { code: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: 'KR' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: 'IN' },
  { code: 'ID', name: 'Indonésie', dialCode: '+62', flag: 'ID' },
  { code: 'TH', name: 'Thaïlande', dialCode: '+66', flag: 'TH' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: 'VN' },
  { code: 'MY', name: 'Malaisie', dialCode: '+60', flag: 'MY' },
  { code: 'SG', name: 'Singapour', dialCode: '+65', flag: 'SG' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: 'PH' },
  
  // Moyen-Orient
  { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: 'SA' },
  { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: 'AE' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: 'QA' },
  { code: 'KW', name: 'Koweït', dialCode: '+965', flag: 'KW' },
  { code: 'BH', name: 'Bahreïn', dialCode: '+973', flag: 'BH' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: 'OM' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: 'TR' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: 'IR' },
  { code: 'IQ', name: 'Irak', dialCode: '+964', flag: 'IQ' },
  
  // Océanie
  { code: 'AU', name: 'Australie', dialCode: '+61', flag: 'AU' },
  { code: 'NZ', name: 'Nouvelle-Zélande', dialCode: '+64', flag: 'NZ' },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "XX XX XX XX",
  required = false,
  className = ""
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Mali par défaut
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Extraire le numéro de téléphone sans indicatif au chargement initial
  React.useEffect(() => {
    if (value && value.startsWith(selectedCountry.dialCode)) {
      setPhoneNumber(value.substring(selectedCountry.dialCode.length).trim());
    } else if (value && !value.startsWith('+')) {
      setPhoneNumber(value);
    }
  }, []);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    // Mettre à jour la valeur complète avec le nouvel indicatif
    const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : country.dialCode;
    onChange(fullNumber);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    setPhoneNumber(number);
    // Construire le numéro complet avec l'indicatif
    const fullNumber = number ? `${selectedCountry.dialCode} ${number}` : selectedCountry.dialCode;
    onChange(fullNumber);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Sélecteur de pays */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
          >
            <FlagIcon countryCode={selectedCountry.flag} className="w-6 h-4 mr-2" />
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown des pays */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <FlagIcon countryCode={country.flag} className="w-6 h-4 mr-3" />
                  <span className="flex-1 text-sm text-gray-900">{country.name}</span>
                  <span className="text-sm text-gray-500 font-medium">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Champ de saisie du numéro */}
        <input
          type="tel"
          required={required}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
        />
      </div>

      {/* Overlay pour fermer le dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default PhoneInput;
