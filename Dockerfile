FROM node:20-alpine

# Install build tools needed for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ linux-headers

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL deps and force-rebuild native modules for this platform
RUN npm ci --build-from-source

# Copy all source
COPY . .

# Build frontend + server bundle
RUN npm run build

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=/app/data/data.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
