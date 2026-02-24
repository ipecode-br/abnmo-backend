FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY dist-docker ./dist

USER node

EXPOSE 3333

CMD ["dumb-init", "node", "dist/main.js"]
