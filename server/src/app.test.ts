import { describe, expect, it } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import express from 'express';
import { createApp } from './app';
import { csrfProtection, CSRF_COOKIE, SESSION_COOKIE } from './middleware/auth';

describe('app', () => {
  it('serves the health check without starting the server or database migration', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it('allows same-origin POST requests that include a matching CSRF token', async () => {
    const app = express();
    app.use(cookieParser());
    app.post('/csrf-check', csrfProtection, (_req, res) => res.status(204).send());

    const response = await request(app)
      .post('/csrf-check')
      .set('Cookie', [`${SESSION_COOKIE}=session-token`, `${CSRF_COOKIE}=csrf-token`])
      .set('X-CSRF-Token', 'csrf-token');

    expect(response.status).toBe(204);
  });

  it('rejects POST requests with an unexpected Origin header', async () => {
    const app = express();
    app.use(cookieParser());
    app.post('/csrf-check', csrfProtection, (_req, res) => res.status(204).send());

    const response = await request(app)
      .post('/csrf-check')
      .set('Origin', 'https://evil.example')
      .set('Cookie', [`${SESSION_COOKIE}=session-token`, `${CSRF_COOKIE}=csrf-token`])
      .set('X-CSRF-Token', 'csrf-token');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CSRF validation failed');
  });
});