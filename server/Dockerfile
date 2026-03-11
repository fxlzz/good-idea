FROM node:20-alpine AS web-build
WORKDIR /app
COPY web/package.json web/package-lock.json* ./web/
WORKDIR /app/web
RUN npm ci || npm install
COPY web/ ./web/
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev || npm install --production
COPY server/src/ ./src/
COPY --from=web-build /app/web/dist /app/web/dist

ENV PORT=3001
ENV SQLITE_PATH=/data/app.db
EXPOSE 3001
CMD ["node", "src/index.js"]
