FROM node:24-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy root package files and workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the status-page app
COPY apps/status-page ./apps/status-page

# Install all dependencies for the monorepo
RUN pnpm install --frozen-lockfile

# Build the status-page app
WORKDIR /app/apps/status-page
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "build"] 