import { createApi } from '@reduxjs/toolkit/query/react';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const csrfToken = () =>
  document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith('ff_csrf='))
    ?.split('=')[1];

const baseQuery = fetchBaseQuery({
  baseUrl: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost'}/api/v1`,
  credentials: 'include',
  prepareHeaders: headers => {
    const token = csrfToken();
    if (token) headers.set('X-CSRF-Token', token);
    return headers;
  }
});

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Flag', 'Stats', 'AuditLog', 'Member', 'Project'],
  endpoints: () => ({})
});