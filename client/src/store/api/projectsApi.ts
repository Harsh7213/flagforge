import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type { Project, ApiResponse } from '../../types';

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: baseQuery,
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    listProjects: builder.query<ApiResponse<Project[]>, void>({
      query: () => '/projects',
      providesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    createProject: builder.mutation<ApiResponse<Project>, { name: string }>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    updateProject: builder.mutation<ApiResponse<Project>, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/projects/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
  }),
});

export const { useListProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } =
  projectsApi;
