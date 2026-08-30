# Build the client and serve the static bundle from nginx. This nginx instance
# is also the public entrypoint / load balancer for the API + Socket.IO.
#
# Build context is the repo root (Taskify.io/) so deploy/nginx.conf is in scope:
#   docker build -f client/Dockerfile -t taskify-web .
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ .
# Same-origin API + websocket: nginx proxies /api and /socket.io to the app pool.
ENV VITE_API_URL=/api/v1
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
