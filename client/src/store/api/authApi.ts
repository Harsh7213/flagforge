import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const csrfToken = () => document.cookie.split('; ').find((cookie) => cookie.startsWith('ff_csrf='))?.split('=')[1];

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/auth',
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = csrfToken();
      if (token) headers.set('X-CSRF-Token', token);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),
    me: builder.query({
      query: () => '/me',
    }),
    logout: builder.mutation({
      query: () => ({ url: '/logout', method: 'POST' }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery, useLogoutMutation } = authApi;
