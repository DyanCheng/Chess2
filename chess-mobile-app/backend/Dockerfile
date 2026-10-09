# Build stage
FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=build /usr/src/app/dist ./dist

# Fly.io requirements for exposing port
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/main"]
