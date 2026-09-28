FROM node:24-alpine AS base

# Create app directory
WORKDIR /app

# Copy root package files and workspace config. The root package.json holds
# the pnpm overrides the frozen lockfile is checked against
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install the pnpm pinned in packageManager, the one that wrote the lockfile
RUN npm install -g "$(node -p "require('./package.json').packageManager")"

# Copy the status-page app
COPY apps/status-page ./apps/status-page

# Copy packages
COPY packages ./packages

# Copy root tsconfig
COPY tsconfig.json ./tsconfig.json

# Install all dependencies for the monorepo
RUN pnpm install --frozen-lockfile

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the status-page app
WORKDIR /app/apps/status-page
RUN pnpm run build

# Remove development dependencies
ENV CI=true
RUN pnpm prune --prod

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "build"] 
