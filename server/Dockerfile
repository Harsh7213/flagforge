FROM node:26-alpine

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --include=dev

WORKDIR /app
COPY server/ ./server/
COPY shared/ ./shared/

WORKDIR /app/server
RUN npm run build && npm prune --omit=dev

EXPOSE 4000

CMD ["sh", "-c", "node dist/server/src/db/migrate.js && node dist/server/src/index.js"]
