FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build:docker
RUN npm prune --omit=dev

####

FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist-docker ./dist
COPY --from=builder /app/package*.json ./

COPY infra/docker/dev/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3333

ENTRYPOINT ["/entrypoint.sh"]
