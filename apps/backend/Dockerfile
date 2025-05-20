FROM node:20-alpine AS development

# Block optional packages like redis-memory-server
ENV npm_config_optional=false

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci -f
COPY . .

FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm ci -f --only=production && npm cache clean --force

FROM node:20-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/main.js"]
