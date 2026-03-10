# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Set node environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy dependencies and source code
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./

# Expose server port
EXPOSE 3000

# Use non-root user
USER node

# Start the application
CMD ["npm", "start"]
