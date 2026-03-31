# --- STAGE 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Increase timeout and use legacy-peer-deps to solve the ERESOLVE conflict
RUN npm config set fetch-retry-maxtimeout 1200000 && \
    npm config set fetch-retries 10 && \
    npm install --legacy-peer-deps

# Copy source and prisma
COPY . .

# Build the app
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Production ---
FROM node:20-slim AS runner

WORKDIR /app

# Copy package files
COPY package.json ./

# Increase timeout and use legacy-peer-deps here too
RUN npm config set fetch-retry-maxtimeout 1200000 && \
    npm config set fetch-retries 10 && \
    npm install --omit=dev --legacy-peer-deps

# Copy build artifacts and prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma.config.ts ./

# Expose port 3000
EXPOSE 3000

# Start command
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
