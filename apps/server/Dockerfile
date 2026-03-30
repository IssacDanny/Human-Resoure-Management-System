# --- STAGE 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (relative to apps/server)
COPY package.json ./
# If you have a lockfile in this directory, uncomment the next line:
# COPY package-lock.json ./

# Install dependencies (including dev)
RUN npm install

# Copy source and prisma (relative to apps/server)
COPY . .

# Build the app
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Production ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json ./
# COPY package-lock.json ./
RUN npm install --omit=dev

# Copy build artifacts and prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port 3000
EXPOSE 3000

# Start command
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
