FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM deps AS build
COPY tsconfig*.json nest-cli.json eslint.config.mjs ./
COPY env.validation.ts datasource.ts ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/env.validation.ts ./env.validation.ts
COPY --from=build /app/datasource.ts ./datasource.ts

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
