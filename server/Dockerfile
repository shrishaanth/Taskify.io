# Taskify API + realtime. Runs the TypeScript entrypoint directly with tsx.
FROM node:20-alpine

WORKDIR /app

# Install deps (tsx lives in devDependencies, so we need the full install).
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=development
ENV PORT=4000
EXPOSE 4000

# Honour SIGTERM for graceful shutdown (index.ts handles it).
STOPSIGNAL SIGTERM
CMD ["npm", "start"]
