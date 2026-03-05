FROM node:20-alpine AS builder

WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install client dependencies
COPY web/client/package.json web/client/package-lock.json ./web/client/
RUN cd web/client && npm ci

# Copy source
COPY . .

# Build server and client
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/client/dist ./web/client/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/web/server/index.js"]
