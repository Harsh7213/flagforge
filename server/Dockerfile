FROM node:26-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build && npm prune --omit=dev

EXPOSE 4000

CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
