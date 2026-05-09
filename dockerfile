FROM node:20-alpine as frontend-builder

COPY ./Frontend /app

WORKDIR /app
Run npm install

Run npm run build


FROM node:20-alpine

COPY ./Backend /app

WORKDIR /app

Run npm install

Copy --from=frontend-builder /app/dist /app/public


CMD ["node","server.js"]