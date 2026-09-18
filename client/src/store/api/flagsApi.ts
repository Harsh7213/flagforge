import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type {
  FeatureFlag,
  FlagStats,
  AuditLog,
  ApiResponse,
  PaginatedResponse,
  Environment,
  RuleType,
} from '../../types';

export const flagsApi = createApi({
  reducerPath: 'flagsApi',
  baseQuery: baseQuery,
  tagTypes: ['Flag', 'Stats', 'AuditLog'],
  endpoints: (builder) => ({
    // ── List flags ─────────────────────────────────────────────────
    listFlags: builder.query<
      ApiResponse<FeatureFlag[]>,
      { projectId: string; search?: string; archived?: boolean }
    >({
      query: ({ projectId, search, archived }) => {
        const params = new URLSearchParams({ projectId });
        if (search) params.set('search', search);
        if (archived !== undefined) params.set('archived', String(archived));
        return `/flags?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Flag' as const, id })),
              { type: 'Flag', id: 'LIST' },
            ]
          : [{ type: 'Flag', id: 'LIST' }],
    }),

    // ── Get single flag ─────────────────────────────────────────────
    getFlag: builder.query<ApiResponse<FeatureFlag>, string>({
      query: (id) => `/flags/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Flag', id }],
    }),

    // ── Create flag ─────────────────────────────────────────────────
    createFlag: builder.mutation<
      ApiResponse<FeatureFlag>,
      { key: string; name: string; description?: string; projectId: string }
    >({
      query: (body) => ({ url: '/flags', method: 'POST', body }),
      invalidatesTags: [{ type: 'Flag', id: 'LIST' }, 'Stats'],
    }),

    // ── Update flag ─────────────────────────────────────────────────
    updateFlag: builder.mutation<
      ApiResponse<FeatureFlag>,
      { id: string; name?: string; description?: string; archived?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/flags/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Flag', id }, { type: 'Flag', id: 'LIST' }, 'Stats'],
    }),

    // ── Delete flag ─────────────────────────────────────────────────
    deleteFlag: builder.mutation<void, string>({
      query: (id) => ({ url: `/flags/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Flag', id: 'LIST' }, 'Stats'],
    }),

    // ── Toggle environment ──────────────────────────────────────────
    toggleEnvironment: builder.mutation<
      void,
      { flagId: string; env: Environment; enabled: boolean }
    >({
      query: ({ flagId, env, enabled }) => ({
        url: `/flags/${flagId}/environments/${env}/toggle`,
        method: 'POST',
        body: { enabled },
      }),
      invalidatesTags: (_result, _err, { flagId }) => [
        { type: 'Flag', id: flagId },
        { type: 'Flag', id: 'LIST' },
        'Stats',
        'AuditLog',
      ],
    }),

    // ── Add rule ────────────────────────────────────────────────────
    addRule: builder.mutation<
      void,
      { flagId: string; env: Environment; type: RuleType; value: string[] | number }
    >({
      query: ({ flagId, env, type, value }) => ({
        url: `/flags/${flagId}/rules?env=${env}`,
        method: 'POST',
        body: { type, value },
      }),
      invalidatesTags: (_result, _err, { flagId }) => [{ type: 'Flag', id: flagId }, 'AuditLog'],
    }),

    // ── Delete rule ─────────────────────────────────────────────────
    deleteRule: builder.mutation<void, { flagId: string; ruleId: string }>({
      query: ({ flagId, ruleId }) => ({
        url: `/flags/${flagId}/rules/${ruleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { flagId }) => [{ type: 'Flag', id: flagId }, 'AuditLog'],
    }),

    // ── Stats ───────────────────────────────────────────────────────
    getStats: builder.query<ApiResponse<FlagStats>, string>({
      query: (projectId) => `/stats?projectId=${projectId}`,
      providesTags: ['Stats'],
    }),

    // ── Audit logs (project-wide) ───────────────────────────────────
    getAuditLogs: builder.query<
      PaginatedResponse<AuditLog>,
      { projectId: string; limit?: number; offset?: number }
    >({
      query: ({ projectId, limit = 100, offset = 0 }) =>
        `/audit?projectId=${projectId}&limit=${limit}&offset=${offset}`,
      providesTags: ['AuditLog'],
    }),

    // ── Audit logs (flag-level) ─────────────────────────────────────
    getFlagAuditLogs: builder.query<PaginatedResponse<AuditLog>, string>({
      query: (flagId) => `/flags/${flagId}/audit`,
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useListFlagsQuery,
  useGetFlagQuery,
  useCreateFlagMutation,
  useUpdateFlagMutation,
  useDeleteFlagMutation,
  useToggleEnvironmentMutation,
  useAddRuleMutation,
  useDeleteRuleMutation,
  useGetStatsQuery,
  useGetAuditLogsQuery,
  useGetFlagAuditLogsQuery,
} = flagsApi;
