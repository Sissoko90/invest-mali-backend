// Service pour consommer les APIs Person (Spring Boot)
// Base: /api/v1/persons (endpoint réel du backend)

import { apiRequest } from "./api";

const BASE = "/api/v1/persons";

export const personService = {
  // GET /api/v1/creation-entreprise/person
  list: async () => {
    return await apiRequest(`${BASE}`, {
      method: "GET",
    });
  },

  // POST /api/v1/creation-entreprise/person
  create: async (person) => {
    const payload = buildPersonRequestDto(person);
    return await apiRequest(`${BASE}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // PUT /api/v1/persons/{id}
  update: async (id, person) => {
    const payload = buildPersonUpdateRequestDto(person);
    return await apiRequest(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // GET /api/v1/creation-entreprise/person/{id}
  getById: async (id) => {
    return await apiRequest(`${BASE}/${id}`, {
      method: "GET",
    });
  },

  // GET /api/v1/creation-entreprise/person/exists?email=&telephone=&numero_piece=&typePersonne=
  exists: async ({ email = undefined, telephone = undefined, numero_piece = undefined, typePersonne = 'RESPONSABLE' } = {}) => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (telephone) params.append('telephone', telephone);
    if (numero_piece) params.append('numero_piece', numero_piece);
    if (typePersonne) params.append('typePersonne', typePersonne);
    if ([...params.keys()].length === 0) {
      throw new Error('At least one identifier is required');
    }
    return await apiRequest(`${BASE}/exists?${params.toString()}`, {
      method: 'GET',
    });
  },
};

// Construit un DTO conforme à PersonCreateRequest côté backend
// Champs attendus selon PersonCreateRequest.java: nom, prenom, email, telephone1, dateNaissance, lieuNaissance,
// nationnalite, sexe, situationMatrimoniale, civilite, role, entrepriseRole, division_id, divisionCode, localite
export function buildPersonRequestDto(person = {}) {
  const dto = {
    nom: person.nom || "",
    prenom: person.prenom || "",
    email: person.email || undefined,
    telephone1: person.telephone || person.telephone1 || undefined,
    telephone2: person.telephone2 || undefined,
    dateNaissance: person.dateNaissance || undefined, // Format: YYYY-MM-DD
    lieuNaissance: person.lieuNaissance || undefined,
    nationnalite: person.nationnalite || undefined, // Enum Nationalites
    sexe: person.sexe || undefined, // MASCULIN | FEMININ
    situationMatrimoniale: person.situationMatrimoniale || undefined,
    civilite: person.civilite || undefined, // MONSIEUR | MADAME | MADEMOISELLE
    role: person.role || "USER", // Par défaut USER
    entrepriseRole: person.entrepriseRole || undefined, // FONDATEUR | ASSOCIE | GERANT
    antenneAgent: person.antenneAgent || undefined,
    // Gestion de la hiérarchie des divisions - utiliser null au lieu de undefined
    division_id: person.division_id || person.quartierId || person.communeId || person.arrondissementId || person.cercleId || person.regionId || null,
    divisionCode: person.divisionCode || person.quartierCode || person.communeCode || person.arrondissementCode || person.cercleCode || person.regionCode || null,
    localite: person.localite || null,
  };
  
  // Log pour debugging
  console.log('🔍 PersonService - Données envoyées:', {
    division_id: dto.division_id,
    divisionCode: dto.divisionCode,
    localite: dto.localite
  });
  
  return dto;
}

// Construit un DTO conforme à PersonUpdateRequest côté backend
export function buildPersonUpdateRequestDto(person = {}) {
  const dto = {
    nom: person.nom || undefined,
    prenom: person.prenom || undefined,
    email: person.email || undefined,
    telephone1: person.telephone || person.telephone1 || undefined,
    telephone2: person.telephone2 || undefined,
    dateNaissance: person.dateNaissance || undefined, // Format: YYYY-MM-DD
    lieuNaissance: person.lieuNaissance || undefined,
    nationnalite: person.nationnalite || undefined,
    sexe: person.sexe || undefined,
    situationMatrimoniale: person.situationMatrimoniale || undefined,
    civilite: person.civilite || undefined,
    role: person.role || undefined,
    entrepriseRole: person.entrepriseRole || undefined,
    antenneAgent: person.antenneAgent || undefined,
    // Gestion de la hiérarchie des divisions pour update - utiliser null au lieu de undefined
    division_id: person.division_id || person.quartierId || person.communeId || person.arrondissementId || person.cercleId || person.regionId || null,
    divisionCode: person.divisionCode || person.quartierCode || person.communeCode || person.arrondissementCode || person.cercleCode || person.regionCode || null,
    localite: person.localite || null,
  };
  
  // Log pour debugging
  console.log('🔍 PersonService UPDATE - Données envoyées:', {
    division_id: dto.division_id,
    divisionCode: dto.divisionCode,
    localite: dto.localite
  });
  
  return dto;
}

export default personService;
