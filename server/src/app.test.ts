import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

describe('app', () => {
  it('serves the health check without starting the server or database migration', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});