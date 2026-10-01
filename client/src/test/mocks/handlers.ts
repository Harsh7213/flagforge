import { http, HttpResponse } from 'msw';
import { mockUser, mockFlags, mockProjects, mockAuditLog } from './data';

const BASE = 'http://localhost/api/v1';
const AUTH_BASE = 'http://localhost/api/v1/auth';

export const handlers = [
  // ─── Auth ────────────────────────────────────────────────────────────────────
  http.get(`${AUTH_BASE}/me`, () =>
    HttpResponse.json({
      data: {
        user: mockUser,
        expiresAt: Date.now() + 60 * 60 * 1000
      }
    })
  ),

  http.post(`${AUTH_BASE}/login`, () =>
    HttpResponse.json({ data: { user: mockUser, expiresAt: Date.now() + 60 * 60 * 1000 } })
  ),

  http.post(`${AUTH_BASE}/register`, () =>
    HttpResponse.json({ data: { user: mockUser, expiresAt: Date.now() + 60 * 60 * 1000 } })
  ),

  http.post(`${AUTH_BASE}/logout`, () => HttpResponse.json({ success: true })),

  http.post(`${BASE}/auth/invitations/accept`, () =>
    HttpResponse.json({
      data: {
        expiresAt: Date.now() + 60 * 60 * 1000,
        user: { ...mockUser, id: 'user-accepted' }
      }
    })
  ),

  // ─── Flags ───────────────────────────────────────────────────────────────────
  http.get(`${BASE}/flags`, () => HttpResponse.json({ data: mockFlags })),

  http.get(`${BASE}/flags/:id`, ({ params }) => {
    const flag = mockFlags.find(f => f.id === params.id) ?? mockFlags[0];
    return HttpResponse.json({ data: flag });
  }),

  http.post(`${BASE}/flags`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      data: {
        ...mockFlags[0],
        id: 'flag-new',
        key: body.key,
        name: body.name,
        description: body.description ?? null
      }
    });
  }),

  http.patch(`${BASE}/flags/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const flag = mockFlags.find(f => f.id === params.id) ?? mockFlags[0];
    return HttpResponse.json({ data: { ...flag, ...body } });
  }),

  http.delete(`${BASE}/flags/:id`, () => new HttpResponse(null, { status: 204 })),

  http.post(
    `${BASE}/flags/:flagId/environments/:env/toggle`,
    () => new HttpResponse(null, { status: 200 })
  ),

  http.post(`${BASE}/flags/:flagId/rules`, () => new HttpResponse(null, { status: 201 })),

  http.delete(`${BASE}/flags/:flagId/rules/:ruleId`, () => new HttpResponse(null, { status: 204 })),

  // ─── Stats ───────────────────────────────────────────────────────────────────
  http.get(`${BASE}/stats`, () =>
    HttpResponse.json({
      data: {
        total: 2,
        active: 1,
        archived: 1,
        byEnvironment: { development: 1, staging: 0, production: 0 }
      }
    })
  ),

  // ─── Audit Logs ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/audit`, () =>
    HttpResponse.json({ data: [mockAuditLog], total: 1, limit: 100, offset: 0 })
  ),

  http.get(`${BASE}/flags/:flagId/audit`, () =>
    HttpResponse.json({ data: [mockAuditLog], total: 1, limit: 100, offset: 0 })
  ),

  // ─── Projects ────────────────────────────────────────────────────────────────
  http.get(`${BASE}/projects`, () => HttpResponse.json({ data: mockProjects })),

  http.post(`${BASE}/projects`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: { ...mockProjects[0], id: 'proj-new', name: body.name } });
  }),

  http.patch(`${BASE}/projects/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      data: { ...mockProjects[0], id: params.id as string, name: body.name }
    });
  }),

  http.post(`${BASE}/projects/:id/api-key/rotate`, ({ params }) =>
    HttpResponse.json({
      data: { ...mockProjects[0], id: params.id as string, apiKey: 'ff_live_rotated123' }
    })
  ),

  http.delete(`${BASE}/projects/:id/api-key`, () => new HttpResponse(null, { status: 204 })),

  http.delete(`${BASE}/projects/:id`, () => new HttpResponse(null, { status: 204 })),

  // ─── Organization ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/organizations/members`, () =>
    HttpResponse.json({ data: [{ ...mockUser, id: 'member-1' }] })
  ),

  http.post(`${BASE}/organizations/invitations`, () =>
    HttpResponse.json({
      data: {
        email: 'invited@example.com',
        role: 'member',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }
    })
  ),

  http.delete(
    `${BASE}/organizations/members/:userId`,
    () => new HttpResponse(null, { status: 204 })
  )
];
