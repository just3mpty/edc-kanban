FROM node:20-alpine AS build
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["npm", "start"]
