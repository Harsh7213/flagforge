import { baseApi } from './baseApi';
import { Member, InvitationResponse, AcceptInvitationResponse } from '../../types';

const organizationApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    listMembers: builder.query<{ data: Member[] }, void>({
      query: () => '/organizations/members',
      providesTags: [{ type: 'Member', id: 'LIST' }]
    }),
    createInvitation: builder.mutation<
      InvitationResponse,
      { email: string; role: 'admin' | 'member' }
    >({
      query: invitation => ({
        url: '/organizations/invitations',
        method: 'POST',
        body: invitation
      })
    }),
    acceptInvitation: builder.mutation<
      AcceptInvitationResponse,
      { token: string; name: string; password: string }
    >({
      query: invitation => ({
        url: '/auth/invitations/accept',
        method: 'POST',
        body: invitation
      })
    }),
    removeMember: builder.mutation<void, string>({
      query: userId => ({ url: `/organizations/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Member', id: 'LIST' }]
    })
  })
});

export const {
  useListMembersQuery,
  useCreateInvitationMutation,
  useAcceptInvitationMutation,
  useRemoveMemberMutation
} = organizationApi;
