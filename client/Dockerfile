FROM node:26-alpine AS build

WORKDIR /app

COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

WORKDIR /app
COPY client/ ./client/
COPY shared/ ./shared/

WORKDIR /app/client
RUN npm run build

FROM nginx:1.31.6-alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]