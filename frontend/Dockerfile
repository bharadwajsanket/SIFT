# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors and lockfile
COPY package*.json ./

# Install all dependencies (including devDependencies for typescript compilation)
RUN npm ci

# Copy full frontend workspace
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Compile TypeScript and build Next.js output
RUN npm run build

# Stage 2: Serve the built application
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package config
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy build output and configurations
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

# Start Next.js production server
CMD ["npx", "next", "start"]
