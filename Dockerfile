FROM node:20-alpine

# Install build tools needed for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install all deps (including dev — needed for tsx build)
RUN npm ci

# Copy all source
COPY . .

# Build frontend + server bundle
RUN npm run build

# Prune dev deps after build to slim image
RUN npm prune --omit=dev

# Railway volumes: mount /app/data for SQLite persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=/app/data/data.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
