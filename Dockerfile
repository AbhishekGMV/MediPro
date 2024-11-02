ARG NODE_VERSION=20.11.1
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /build
COPY package*.json .
COPY .dockerignore .
COPY .env .env
COPY prisma prisma
RUN yarn install
COPY tsconfig.json .
COPY src/ src/
RUN yarn build


FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
COPY --from=builder build/package*.json .
COPY --from=builder build/prisma .
COPY --from=builder build/.env .
COPY --from=builder build/dist ./dist/
RUN yarn install --production
CMD ["node", "dist/app.js"]
