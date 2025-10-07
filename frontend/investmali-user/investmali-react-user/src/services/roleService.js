// Service for Role endpoints (Spring Boot)
// Base: /api/v1/roles

import { apiRequest } from './api';

const BASE = '/api/v1/roles';

export const roleService = {
  // GET /api/v1/roles
  list: async () => {
    return await apiRequest(`${BASE}`, { method: 'GET' });
  },

  // POST /api/v1/roles
  create: async (nom) => {
    return await apiRequest(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify({ nom }),
    });
  },
};

export default roleService;
