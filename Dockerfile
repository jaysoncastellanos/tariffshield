FROM node:20-slim

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL deps, rebuilding native modules for this platform (glibc)
RUN npm ci --build-from-source

# Copy all source
COPY . .

# Build frontend + server bundle
RUN npm run build

# Rebuild native modules against the production node binary
RUN npm rebuild better-sqlite3

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=/app/data/data.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
