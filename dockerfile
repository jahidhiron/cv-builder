# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for caching
COPY package.json pnpm-lock.yaml ./

# Clean previous dist folder
RUN rm -rf dist

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN pnpm build

# Stage 2: Runtime
FROM node:22-alpine AS runtime

WORKDIR /app

# Enable pnpm in runtime stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for potential runtime needs
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy only build output
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && apk add --no-cache dos2unix && dos2unix ./entrypoint.sh


# Copy correct env file
COPY .env .env

EXPOSE ${PORT}

ENTRYPOINT ["./entrypoint.sh"]
