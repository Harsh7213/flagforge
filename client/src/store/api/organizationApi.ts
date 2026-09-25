import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const csrfToken = () => document.cookie.split('; ').find((cookie) => cookie.startsWith('ff_csrf='))?.split('=')[1];

interface InvitationResponse {
  data: {
    email: string;
    role: 'admin' | 'member';
    token: string;
    expiresAt: string;
  };
}

interface AcceptInvitationResponse {
  data: {
    expiresAt: number;
    user: {
      id: string;
      name: string;
      email: string;
      organizationId: string;
      organizationName: string;
      role: 'admin' | 'member';
    };
  };
}

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  tagTypes: ['Member'],
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = csrfToken();
      if (token) headers.set('X-CSRF-Token', token);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    listMembers: builder.query<{ data: Member[] }, void>({
      query: () => '/organizations/members',
      providesTags: [{ type: 'Member', id: 'LIST' }],
    }),
    createInvitation: builder.mutation<InvitationResponse, { email: string; role: 'admin' | 'member' }>({
      query: (invitation) => ({
        url: '/organizations/invitations',
        method: 'POST',
        body: invitation,
      }),
    }),
    acceptInvitation: builder.mutation<AcceptInvitationResponse, { token: string; name: string; password: string }>({
      query: (invitation) => ({
        url: '/auth/invitations/accept',
        method: 'POST',
        body: invitation,
      }),
    }),
    removeMember: builder.mutation<void, string>({
      query: (userId) => ({ url: `/organizations/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Member', id: 'LIST' }],
    }),
  }),
});

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export const { useListMembersQuery, useCreateInvitationMutation, useAcceptInvitationMutation, useRemoveMemberMutation } = organizationApi;