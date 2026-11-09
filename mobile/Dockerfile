# Build stage for dependencies
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Default Expo dev server port and Metro bundler port
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19006

CMD ["npx", "expo", "start", "--web"]

