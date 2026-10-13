import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW Node server — used in Vitest (Node environment) via jsdom
export const server = setupServer(...handlers);
