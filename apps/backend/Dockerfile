FROM node:22-alpine AS development

# Block optional packages like redis-memory-server
ENV npm_config_optional=false

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci -f
COPY . .

FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm ci -f --only=production && npm cache clean --force

FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
# dns.lookup, fs and crypto share libuv's pool of 4 threads by default, so a few
# slow dns answers stall every other lookup, ClickHouse connections included
ENV UV_THREADPOOL_SIZE=64
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/main.js"]
